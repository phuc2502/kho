import { Receipt, ReceiptItem } from '../models/receipt.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { StockCard } from '../models/stockCard.model.js';
import { sendNotification, createNotificationForUser } from '../utils/notification.helper.js';

export const getReceipts = async (req, res, next) => {
  try {
    const receipts = await Receipt.findAll({
      include: [
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: ReceiptItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(receipts);
  } catch (error) {
    next(error);
  }
};

export const createReceipt = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { ghiChu, items } = req.body;

    const count = await Receipt.count();
    const code = `RC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

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

    const receipt = await Receipt.create({
      code,
      ghiChu: ghiChu || null,
      totalAmount,
      createdByUserId: req.user._id,
      status: 'draft'
    }, { transaction: t });

    for (const mappedItem of mappedItems) {
      await ReceiptItem.create({
        receiptId: receipt._id,
        productId: mappedItem.productId,
        quantity: mappedItem.quantity,
        price: mappedItem.price,
        warehouseNodeId: mappedItem.warehouseNodeId
      }, { transaction: t });
    }

    await t.commit();

    const populated = await Receipt.findByPk(receipt._id, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: ReceiptItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ]
    });

    await recordAudit({ action: 'receipt.create', userId: req.user._id, username: req.user.username, entity: 'receipt', entityId: receipt._id, payload: { code, totalAmount, itemCount: mappedItems.length } });

    // Gửi thông báo cho người có quyền phê duyệt phiếu nhập
    sendNotification({
      targetRoles: ['Admin', 'QuanLyKho'],
      excludeUserId: req.user._id,
      title: `Phiếu nhập kho mới: ${code}`,
      content: `${req.user.fullName || req.user.username} vừa tạo phiếu nhập kho ${code} với ${mappedItems.length} sản phẩm, tổng giá trị ${Number(totalAmount).toLocaleString('vi-VN')}đ. Vui lòng xem xét và phê duyệt.`,
      type: 'receipt',
      refId: receipt._id
    });

    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const updateReceipt = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { ghiChu, items, status } = req.body;

    const receipt = await Receipt.findByPk(id, {
      include: [{ model: ReceiptItem, as: 'items' }]
    });
    if (!receipt) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu nhập kho' });
    }

    if (receipt.status === 'completed' || receipt.status === 'rejected') {
      await t.rollback();
      return res.status(400).json({ message: 'Không thể sửa phiếu nhập kho đã hoàn tất hoặc bị hủy' });
    }

    if (ghiChu !== undefined) receipt.ghiChu = ghiChu;

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

      await ReceiptItem.destroy({ where: { receiptId: id }, transaction: t });

      for (const mappedItem of mappedItems) {
        await ReceiptItem.create({
          receiptId: id,
          productId: mappedItem.productId,
          quantity: mappedItem.quantity,
          price: mappedItem.price,
          warehouseNodeId: mappedItem.warehouseNodeId
        }, { transaction: t });
      }

      receipt.totalAmount = totalAmount;
    }

    if (status) {
      if (status === 'completed' || status === 'approved' || status === 'rejected') {
        const canApprove = req.user.role === 'Admin' || (req.user.effectivePermissions && req.user.effectivePermissions.includes('receipt:approve'));
        if (!canApprove) {
          await t.rollback();
          return res.status(403).json({ message: 'Bạn không có quyền duyệt/từ chối phiếu nhập kho' });
        }

        if (status === 'completed' && receipt.status !== 'completed') {
          const itemsToProcess = items ? await ReceiptItem.findAll({ where: { receiptId: id }, transaction: t }) : receipt.items;

          for (const item of itemsToProcess) {
            const [inventoryRecord, created] = await Inventory.findOrCreate({
              where: {
                productId: item.productId,
                warehouseNodeId: item.warehouseNodeId
              },
              defaults: {
                quantity: 0
              },
              transaction: t
            });

            const qtyBefore = inventoryRecord.quantity;
            inventoryRecord.quantity += Number(item.quantity);
            await inventoryRecord.save({ transaction: t });
            const qtyAfter = inventoryRecord.quantity;

            // Tự động ghi nhận Thẻ kho (Stock Card)
            const count = await StockCard.count({ transaction: t });
            const scCode = `TK-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

            await StockCard.create({
              code: scCode,
              productId: item.productId,
              warehouseNodeId: item.warehouseNodeId,
              refCode: receipt.code,
              type: 'import',
              qtyBefore,
              qtyChange: Number(item.quantity),
              qtyAfter,
              note: `Nhập kho tự động theo phiếu ${receipt.code}`,
              recordedAt: new Date(),
              createdByUserId: req.user._id
            }, { transaction: t });
          }
        }
      }
      receipt.status = status;
    }

    await receipt.save({ transaction: t });
    await t.commit();

    const populated = await Receipt.findByPk(id, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: ReceiptItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ]
    });

    const actionVerb = status === 'completed' ? 'receipt.complete' : status === 'approved' ? 'receipt.approve' : status === 'rejected' ? 'receipt.reject' : 'receipt.update';
    await recordAudit({ action: actionVerb, userId: req.user._id, username: req.user.username, entity: 'receipt', entityId: Number(id), payload: { status, code: populated.code } });

    // Gửi thông báo phản hồi cho người tạo phiếu khi trạng thái thay đổi
    if (status && receipt.createdByUserId !== req.user._id) {
      const statusLabels = { approved: 'đã được phê duyệt', completed: 'đã hoàn tất', rejected: 'đã bị từ chối' };
      const label = statusLabels[status];
      if (label) {
        createNotificationForUser(receipt.createdByUserId, {
          title: `Phiếu nhập ${populated.code} ${label}`,
          content: `${req.user.fullName || req.user.username} đã cập nhật phiếu nhập kho ${populated.code} sang trạng thái "${label}".`,
          type: 'receipt',
          refId: Number(id)
        });
      }
    }

    // Khi quản lý phê duyệt phiếu nhập kho (status === 'approved'), thông báo đến nhân viên kho để nhận hàng
    if (status === 'approved') {
      sendNotification({
        targetRoles: ['NhanVienKho'],
        excludeUserId: req.user._id,
        title: `Phiếu nhập kho được phê duyệt: ${populated.code}`,
        content: `${req.user.fullName || req.user.username} đã phê duyệt phiếu nhập kho ${populated.code}. Nhân viên kho vui lòng chuẩn bị nhận hàng và cập nhật hoàn tất.`,
        type: 'receipt',
        refId: Number(id)
      });
    }

    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
