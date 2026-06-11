import { Delivery, DeliveryItem } from '../models/delivery.model.js';
import { DeliveryRequest } from '../models/deliveryRequest.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';

export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.findAll({
      include: [
        { model: User, as: 'createdByUser', attributes: ['username', 'fullName', 'role'] },
        {
          model: DeliveryItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        },
        { model: DeliveryRequest, as: 'fromRequest', attributes: ['_id', 'code', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(deliveries);
  } catch (error) {
    next(error);
  }
};

export const createDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { tenKhachHang, items, requestId } = req.body;

    if (!tenKhachHang || !tenKhachHang.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Tên khách hàng là bắt buộc' });
    }

    const count = await Delivery.count();
    const code = `DL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    let totalAmount = 0;
    const mappedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product);
      if (!product) {
        await t.rollback();
        return res.status(400).json({ message: `Sản phẩm với ID ${item.product} không tồn tại` });
      }
      totalAmount += Number(item.quantity) * Number(item.price);
      mappedItems.push({
        productId: item.product,
        quantity: Number(item.quantity),
        price: Number(item.price),
        warehouseNodeId: item.warehouseNode
      });
    }

    const delivery = await Delivery.create({
      code,
      tenKhachHang: tenKhachHang.trim(),
      totalAmount,
      createdByUserId: req.user._id,
      status: 'draft',
      requestId: requestId || null
    }, { transaction: t });

    // Nếu tạo từ yêu cầu → đánh dấu yêu cầu đang xử lý
    if (requestId) {
      await DeliveryRequest.update(
        { status: 'processing' },
        { where: { _id: requestId }, transaction: t }
      );
    }

    for (const mappedItem of mappedItems) {
      await DeliveryItem.create({
        deliveryId: delivery._id,
        productId: mappedItem.productId,
        quantity: mappedItem.quantity,
        price: mappedItem.price,
        warehouseNodeId: mappedItem.warehouseNodeId
      }, { transaction: t });
    }

    await t.commit();

    const populated = await Delivery.findByPk(delivery._id, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: DeliveryItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ]
    });

    await recordAudit({ action: 'delivery.create', userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: delivery._id, payload: { code, totalAmount, itemCount: mappedItems.length } });
    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const updateDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { tenKhachHang, items, status } = req.body;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: DeliveryItem, as: 'items' }]
    });
    if (!delivery) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    }

    // Chỉ được sửa nội dung (tenKhachHang, items) khi phiếu còn ở trạng thái Nháp
    if ((tenKhachHang !== undefined || items !== undefined) && delivery.status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể sửa nội dung phiếu xuất kho khi đang ở trạng thái Nháp' });
    }

    if (tenKhachHang && tenKhachHang.trim()) delivery.tenKhachHang = tenKhachHang.trim();

    if (items) {
      let totalAmount = 0;
      const mappedItems = [];
      for (const item of items) {
        const product = await Product.findByPk(item.product);
        if (!product) {
          await t.rollback();
          return res.status(400).json({ message: `Sản phẩm với ID ${item.product} không tồn tại` });
        }
        totalAmount += Number(item.quantity) * Number(item.price);
        mappedItems.push({
          productId: item.product,
          quantity: Number(item.quantity),
          price: Number(item.price),
          warehouseNodeId: item.warehouseNode
        });
      }

      await DeliveryItem.destroy({ where: { deliveryId: id }, transaction: t });

      for (const mappedItem of mappedItems) {
        await DeliveryItem.create({
          deliveryId: id,
          productId: mappedItem.productId,
          quantity: mappedItem.quantity,
          price: mappedItem.price,
          warehouseNodeId: mappedItem.warehouseNodeId
        }, { transaction: t });
      }

      delivery.totalAmount = totalAmount;
    }

    if (status) {
      if (status === 'shipping') {
        if (delivery.status !== 'approved') {
          await t.rollback();
          return res.status(400).json({ message: 'Chỉ có thể xác nhận xuất hàng từ trạng thái "Đã phê duyệt"' });
        }
      }

      if (status === 'completed' || status === 'approved') {
        const canApprove = req.user.role === 'Admin' || req.user.permissions.includes('delivery:approve');
        if (!canApprove) {
          await t.rollback();
          return res.status(403).json({ message: 'Bạn không có quyền duyệt phiếu xuất kho' });
        }

        if (status === 'completed' && delivery.status !== 'completed') {
          const itemsToProcess = items ? await DeliveryItem.findAll({ where: { deliveryId: id }, transaction: t }) : delivery.items;

          for (const item of itemsToProcess) {
            const stock = await Inventory.findOne({
              where: {
                productId: item.productId,
                warehouseNodeId: item.warehouseNodeId
              },
              transaction: t
            });

            const currentQty = stock ? stock.quantity : 0;
            if (currentQty < item.quantity) {
              const prod = await Product.findByPk(item.productId, { transaction: t });
              await t.rollback();
              return res.status(400).json({
                message: `Sản phẩm ${prod ? prod.name : 'không xác định'} không đủ tồn kho tại vị trí chỉ định. (Yêu cầu: ${item.quantity}, Hiện có: ${currentQty})`
              });
            }
          }

          for (const item of itemsToProcess) {
            const stock = await Inventory.findOne({
              where: {
                productId: item.productId,
                warehouseNodeId: item.warehouseNodeId
              },
              transaction: t
            });

            stock.quantity -= Number(item.quantity);
            await stock.save({ transaction: t });
          }
        }
      }
      delivery.status = status;
    }

    await delivery.save({ transaction: t });
    await t.commit();

    const populated = await Delivery.findByPk(id, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: DeliveryItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ]
    });

    const actionVerb = status === 'completed' ? 'delivery.complete' : status === 'approved' ? 'delivery.approve' : status === 'shipping' ? 'delivery.shipping' : status === 'rejected' ? 'delivery.reject' : 'delivery.update';
    await recordAudit({ action: actionVerb, userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: Number(id), payload: { status, code: populated.code } });
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
