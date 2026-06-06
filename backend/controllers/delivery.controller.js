import { Delivery, DeliveryItem } from '../models/delivery.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { Partner } from '../models/partner.model.js';
import { User } from '../models/user.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { sequelize } from '../config/db.js';

export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.findAll({
      include: [
        { model: Partner, as: 'partner', attributes: ['name', 'type'] },
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: DeliveryItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
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
    const { partner, items } = req.body;

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
      partnerId: partner,
      totalAmount,
      createdByUserId: req.user._id,
      status: 'draft'
    }, { transaction: t });

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
        { model: Partner, as: 'partner', attributes: ['name', 'type'] },
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
    const { partner, items, status } = req.body;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: DeliveryItem, as: 'items' }]
    });
    if (!delivery) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    }

    if (delivery.status === 'completed' || delivery.status === 'cancelled' || delivery.status === 'rejected') {
      await t.rollback();
      return res.status(400).json({ message: 'Không thể sửa phiếu xuất kho đã hoàn tất hoặc đã hủy' });
    }

    if (partner) delivery.partnerId = partner;

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
        { model: Partner, as: 'partner', attributes: ['name', 'type'] },
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

    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
