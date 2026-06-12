import { Adjustment, AdjustmentItem } from '../models/adjustment.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { StockCard } from '../models/stockCard.model.js';
import { sendNotification, createNotificationForUser } from '../utils/notification.helper.js';

const adjustmentIncludes = [
  { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
  { model: User, as: 'approvedByUser', attributes: ['username', 'role'] },
  {
    model: AdjustmentItem,
    as: 'items',
    include: [
      { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
      { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
    ]
  }
];

export const getAdjustments = async (req, res, next) => {
  try {
    const adjustments = await Adjustment.findAll({
      include: adjustmentIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(adjustments);
  } catch (error) {
    next(error);
  }
};

export const createAdjustment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { code, reason, items, note } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Phiếu điều chỉnh cần ít nhất một dòng sản phẩm' });
    }

    if (items.some(item => Number(item.delta) === 0)) {
      await t.rollback();
      return res.status(400).json({ message: 'Số lượng điều chỉnh (delta) không được bằng 0' });
    }

    const count = await Adjustment.count();
    const finalCode = code || `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const existing = await Adjustment.findOne({ where: { code: finalCode } });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ message: `Mã phiếu điều chỉnh ${finalCode} đã tồn tại` });
    }

    const adjustment = await Adjustment.create({
      code: finalCode,
      reason,
      note: note || null,
      status: 'draft',
      createdByUserId: req.user._id
    }, { transaction: t });

    for (const item of items) {
      await AdjustmentItem.create({
        adjustmentId: adjustment._id,
        productId: item.productId,
        warehouseNodeId: item.warehouseNodeId,
        delta: Number(item.delta)
      }, { transaction: t });
    }

    await t.commit();

    await recordAudit({
      action: 'adjustment.create',
      entity: 'Adjustment',
      entityId: adjustment._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: finalCode, reason }
    });

    const populated = await Adjustment.findByPk(adjustment._id, { include: adjustmentIncludes });
    res.status(201).json(populated);

    // Gửi thông báo cho Admin, QuanLyKho khi tạo phiếu điều chỉnh mới
    sendNotification({
      targetRoles: ['Admin', 'QuanLyKho'],
      excludeUserId: req.user._id,
      title: `Phiếu điều chỉnh tồn mới: ${finalCode}`,
      content: `${req.user.fullName || req.user.username} vừa tạo phiếu điều chỉnh tồn kho ${finalCode} (${items.length} sản phẩm). Vui lòng xem xét và phê duyệt.`,
      type: 'adjustment',
      refId: adjustment._id
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const approveAdjustment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Permission check: only Admin or users with adjustment:approve
    const canApprove = req.user.role === 'Admin' || (req.user.effectivePermissions && req.user.effectivePermissions.includes('adjustment:approve'));
    if (!canApprove) {
      await t.rollback();
      return res.status(403).json({ message: 'Bạn không có quyền duyệt phiếu điều chỉnh tồn kho' });
    }

    const adjustment = await Adjustment.findByPk(id, {
      include: [{ model: AdjustmentItem, as: 'items' }],
      transaction: t
    });
    if (!adjustment) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu điều chỉnh' });
    }

    if (adjustment.status === 'completed') {
      await t.rollback();
      return res.status(400).json({ message: 'Phiếu điều chỉnh này đã được hoàn tất rồi' });
    }

    // Apply delta to Inventory
    let currentCardCount = await StockCard.count({ transaction: t });
    for (const item of adjustment.items) {
      const [inventoryRecord] = await Inventory.findOrCreate({
        where: { productId: item.productId, warehouseNodeId: item.warehouseNodeId },
        defaults: { quantity: 0 },
        transaction: t
      });

      const qtyBefore = Number(inventoryRecord.quantity);
      const newQty = qtyBefore + Number(item.delta);
      if (newQty < 0) {
        const prod = await Product.findByPk(item.productId, { transaction: t });
        await t.rollback();
        return res.status(400).json({
          message: `Sản phẩm ${prod?.name || 'không xác định'} không đủ tồn kho để điều chỉnh. Hiện có: ${inventoryRecord.quantity}, Điều chỉnh: ${item.delta}`
        });
      }

      inventoryRecord.quantity = newQty;
      await inventoryRecord.save({ transaction: t });
      const qtyAfter = newQty;

      // Tự động ghi nhận Thẻ kho (Stock Card)
      currentCardCount++;
      const scCode = `TK-${new Date().getFullYear()}-${String(currentCardCount).padStart(5, '0')}`;

      await StockCard.create({
        code: scCode,
        productId: item.productId,
        warehouseNodeId: item.warehouseNodeId,
        refCode: adjustment.code,
        type: 'adjustment',
        qtyBefore,
        qtyChange: Number(item.delta),
        qtyAfter,
        note: `Điều chỉnh tồn kho tự động theo phiếu ${adjustment.code}`,
        recordedAt: new Date(),
        createdByUserId: req.user._id
      }, { transaction: t });
    }

    adjustment.status = 'completed';
    adjustment.approvedByUserId = req.user._id;
    adjustment.approvedAt = new Date();
    await adjustment.save({ transaction: t });
    await t.commit();

    await recordAudit({
      action: 'adjustment.approve',
      entity: 'Adjustment',
      entityId: adjustment._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: adjustment.code }
    });

    const populated = await Adjustment.findByPk(id, { include: adjustmentIncludes });
    res.json(populated);

    // Gửi thông báo cho người tạo phiếu khi được duyệt
    if (adjustment.createdByUserId !== req.user._id) {
      createNotificationForUser(adjustment.createdByUserId, {
        title: `Phiếu điều chỉnh ${adjustment.code} đã được duyệt`,
        content: `${req.user.fullName || req.user.username} đã phê duyệt phiếu điều chỉnh tồn kho ${adjustment.code}. Tồn kho đã được cập nhật.`,
        type: 'adjustment',
        refId: Number(id)
      });
    }
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const deleteAdjustment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adjustment = await Adjustment.findByPk(id);
    if (!adjustment) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu điều chỉnh' });
    }
    if (adjustment.status === 'completed') {
      return res.status(400).json({ message: 'Không thể xóa phiếu điều chỉnh đã hoàn tất' });
    }

    await AdjustmentItem.destroy({ where: { adjustmentId: id } });
    await Adjustment.destroy({ where: { _id: id } });

    await recordAudit({
      action: 'adjustment.delete',
      entity: 'Adjustment',
      entityId: Number(id),
      userId: req.user._id,
      username: req.user.username,
      payload: { code: adjustment.code }
    });

    res.json({ message: 'Xóa phiếu điều chỉnh thành công' });
  } catch (error) {
    next(error);
  }
};
