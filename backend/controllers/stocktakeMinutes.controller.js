import { StocktakeMinutes } from '../models/stocktakeMinutes.model.js';
import { Stocktake, StocktakeItem } from '../models/stocktake.model.js';
import { StocktakeReport } from '../models/stocktakeReport.model.js';
import { Adjustment, AdjustmentItem } from '../models/adjustment.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { sendNotification, createNotificationForUser } from '../utils/notification.helper.js';

const minutesIncludes = [
  {
    model: Stocktake,
    as: 'stocktake',
    attributes: ['_id', 'code', 'date', 'status', 'hasDiff', 'note']
  },
  { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
  { model: User, as: 'approvedByUser', attributes: ['username', 'role'] }
];

export const getStocktakeMinutes = async (req, res, next) => {
  try {
    const minutes = await StocktakeMinutes.findAll({
      include: minutesIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(minutes);
  } catch (error) {
    next(error);
  }
};

export const getStocktakeMinutesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const minutes = await StocktakeMinutes.findByPk(id, {
      include: [
        {
          model: Stocktake,
          as: 'stocktake',
          attributes: ['_id', 'code', 'date', 'status', 'hasDiff', 'note'],
          include: [
            {
              model: StocktakeItem,
              as: 'items',
              include: [
                { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
                { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
              ]
            }
          ]
        },
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        { model: User, as: 'approvedByUser', attributes: ['username', 'role'] }
      ]
    });

    if (!minutes) {
      return res.status(404).json({ message: 'Không tìm thấy biên bản kiểm kê' });
    }

    res.json(minutes);
  } catch (error) {
    next(error);
  }
};

export const approveMinutes = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const minutes = await StocktakeMinutes.findByPk(id);
    if (!minutes) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy biên bản kiểm kê' });
    }

    if (minutes.status !== 'pending_approval') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể phê duyệt biên bản đang ở trạng thái chờ duyệt' });
    }

    const stocktake = await Stocktake.findByPk(minutes.stocktakeId, {
      include: [{ model: StocktakeItem, as: 'items' }],
      transaction: t
    });

    // Approve minutes
    await minutes.update({
      status: 'approved',
      approvedByUserId: req.user._id,
      approvedAt: new Date()
    }, { transaction: t });

    // Complete stocktake
    await stocktake.update({ status: 'completed' }, { transaction: t });

    const items = stocktake.items || [];
    let adjustmentId = null;

    // Auto-create adjustment if there are discrepancies
    if (stocktake.hasDiff) {
      const diffItems = items.filter(
        item => Number(item.countedQty) !== Number(item.systemQty)
      );

      if (diffItems.length > 0) {
        const adjustment = await Adjustment.create({
          code: 'ADJ-' + stocktake.code,
          reason: 'count_correction',
          note: 'Tự động tạo từ biên bản kiểm kê ' + minutes.code,
          status: 'approved',
          createdByUserId: req.user._id
        }, { transaction: t });

        for (const item of diffItems) {
          const delta = Number(item.countedQty) - Number(item.systemQty);
          await AdjustmentItem.create({
            adjustmentId: adjustment._id,
            productId: item.productId,
            warehouseNodeId: item.warehouseNodeId,
            delta
          }, { transaction: t });

          // Apply inventory adjustment: set quantity to countedQty
          const productIdVal = item.get('productId') ?? item.dataValues?.product;
          const nodeIdVal    = item.get('warehouseNodeId') ?? item.dataValues?.warehouseNode;
          await sequelize.query(
            'UPDATE Inventories SET quantity = ? WHERE `product` = ? AND `warehouseNode` = ?',
            { replacements: [Number(item.countedQty), productIdVal, nodeIdVal], transaction: t }
          );
        }

        adjustmentId = adjustment._id;
      }
    }

    // Auto-create báo cáo kiểm kê
    const matchedItems = items.filter(
      item => Number(item.countedQty) === Number(item.systemQty)
    ).length;
    const discrepancyItems = items.length - matchedItems;

    let totalShortage = 0;
    let totalSurplus = 0;
    for (const item of items) {
      const delta = Number(item.countedQty) - Number(item.systemQty);
      if (delta < 0) totalShortage += Math.abs(delta);
      else if (delta > 0) totalSurplus += delta;
    }

    await StocktakeReport.create({
      code: 'BC-' + stocktake.code,
      stocktakeId: stocktake._id,
      adjustmentId: adjustmentId,
      totalItems: items.length,
      matchedItems,
      discrepancyItems,
      totalShortage,
      totalSurplus,
      generatedByUserId: req.user._id
    }, { transaction: t });

    await t.commit();

    await recordAudit({
      action: 'stocktakeMinutes.approve',
      entity: 'StocktakeMinutes',
      entityId: minutes._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: minutes.code, stocktakeCode: stocktake.code }
    });

    const populated = await StocktakeMinutes.findByPk(id, { include: minutesIncludes });

    // Gửi thông báo phê duyệt thành công đến Kế toán kho
    sendNotification({
      targetRoles: ['KeToanKho'],
      excludeUserId: req.user._id,
      title: `Biên bản kiểm kê đã được phê duyệt: ${minutes.code}`,
      content: `Quản lý đã phê duyệt biên bản kiểm kê ${minutes.code} (liên kết phiếu kiểm kê ${stocktake.code}). Tồn kho thực tế đã được cập nhật hoặc tạo phiếu điều chỉnh tự động.`,
      type: 'stocktake',
      refId: minutes._id
    });

    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const rejectMinutes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối biên bản' });
    }

    const minutes = await StocktakeMinutes.findByPk(id);
    if (!minutes) {
      return res.status(404).json({ message: 'Không tìm thấy biên bản kiểm kê' });
    }

    if (minutes.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối biên bản đang ở trạng thái chờ duyệt' });
    }

    await minutes.update({ status: 'rejected', rejectNote: reason.trim() });

    await recordAudit({
      action: 'stocktakeMinutes.reject',
      entity: 'StocktakeMinutes',
      entityId: minutes._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: minutes.code, reason: reason.trim() }
    });

    const populated = await StocktakeMinutes.findByPk(id, { include: minutesIncludes });

    // Gửi thông báo từ chối biên bản kiểm kê đến Kế toán kho
    sendNotification({
      targetRoles: ['KeToanKho'],
      excludeUserId: req.user._id,
      title: `Biên bản kiểm kê bị từ chối: ${minutes.code}`,
      content: `Quản lý đã từ chối biên bản kiểm kê ${minutes.code}. Lý do: ${reason.trim()}. Vui lòng kiểm tra lại.`,
      type: 'stocktake',
      refId: minutes._id
    });

    res.json(populated);
  } catch (error) {
    next(error);
  }
};
