import { Stocktake, StocktakeItem } from '../models/stocktake.model.js';
import { StocktakeMinutes } from '../models/stocktakeMinutes.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';

const stocktakeIncludes = [
  { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
  { model: User, as: 'approvedByUser', attributes: ['username', 'role'] },
  { model: User, as: 'submittedByUser', attributes: ['username', 'role'] },
  {
    model: StocktakeItem,
    as: 'items',
    include: [
      { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
      { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
    ]
  },
  {
    model: StocktakeMinutes,
    as: 'minutes',
    attributes: ['_id', 'code', 'status', 'rejectNote']
  }
];

export const getStocktakes = async (req, res, next) => {
  try {
    const stocktakes = await Stocktake.findAll({
      include: stocktakeIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(stocktakes);
  } catch (error) {
    next(error);
  }
};

export const createStocktake = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { code, date, items, note } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Phiếu kiểm kê cần ít nhất một dòng sản phẩm' });
    }

    const count = await Stocktake.count();
    const finalCode = code || `ST-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const existingCode = await Stocktake.findOne({ where: { code: finalCode } });
    if (existingCode) {
      await t.rollback();
      return res.status(400).json({ message: `Mã phiếu kiểm kê ${finalCode} đã tồn tại` });
    }

    const stocktake = await Stocktake.create({
      code: finalCode,
      date: date || new Date(),
      status: 'pending_approval',
      note: note || null,
      createdByUserId: req.user._id
    }, { transaction: t });

    for (const item of items) {
      await StocktakeItem.create({
        stocktakeId: stocktake._id,
        productId: item.productId,
        warehouseNodeId: item.warehouseNodeId,
        systemQty: 0,
        countedQty: 0
      }, { transaction: t });
    }

    await t.commit();

    await recordAudit({
      action: 'stocktake.create',
      entity: 'Stocktake',
      entityId: stocktake._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: stocktake.code, status: 'pending_approval' }
    });

    const populated = await Stocktake.findByPk(stocktake._id, { include: stocktakeIncludes });
    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const approveStocktake = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const stocktake = await Stocktake.findByPk(id, {
      include: [{ model: StocktakeItem, as: 'items' }]
    });
    if (!stocktake) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kê' });
    }

    if (stocktake.status !== 'pending_approval') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể phê duyệt phiếu kiểm kê đang ở trạng thái chờ duyệt' });
    }

    // Snapshot current inventory values as systemQty
    // Use raw SQL to bypass Sequelize field-alias mapping (productId → 'product', warehouseNodeId → 'warehouseNode')
    for (const item of stocktake.items) {
      const productIdVal = item.get('productId') ?? item.product?._id ?? item.dataValues?.product;
      const nodeIdVal    = item.get('warehouseNodeId') ?? item.warehouseNode?._id ?? item.dataValues?.warehouseNode;
      const [invRows] = await sequelize.query(
        'SELECT quantity FROM Inventories WHERE `product` = ? AND `warehouseNode` = ? LIMIT 1',
        { replacements: [productIdVal, nodeIdVal], transaction: t }
      );
      item.systemQty = invRows.length > 0 ? Number(invRows[0].quantity) : 0;
      item.countedQty = 0;
      await item.save({ transaction: t });
    }

    stocktake.status = 'counting';
    stocktake.approvedByUserId = req.user._id;
    stocktake.approvedAt = new Date();
    await stocktake.save({ transaction: t });

    await t.commit();

    await recordAudit({
      action: 'stocktake.approve',
      entity: 'Stocktake',
      entityId: stocktake._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: stocktake.code }
    });

    const populated = await Stocktake.findByPk(id, { include: stocktakeIncludes });
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const rejectStocktake = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
    }

    const stocktake = await Stocktake.findByPk(id);
    if (!stocktake) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kê' });
    }

    if (stocktake.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối phiếu kiểm kê đang ở trạng thái chờ duyệt' });
    }

    await stocktake.update({ status: 'rejected', rejectNote: reason.trim() });

    await recordAudit({
      action: 'stocktake.reject',
      entity: 'Stocktake',
      entityId: stocktake._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: stocktake.code, reason: reason.trim() }
    });

    const populated = await Stocktake.findByPk(id, { include: stocktakeIncludes });
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const updateStocktake = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { date, items, note } = req.body;

    const stocktake = await Stocktake.findByPk(id);
    if (!stocktake) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kê' });
    }

    if (stocktake.status !== 'counting') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể cập nhật số liệu khi phiếu đang trong trạng thái "Đang kiểm kê"' });
    }

    if (date) stocktake.date = date;
    if (note !== undefined) stocktake.note = note;

    if (items && items.length > 0) {
      await StocktakeItem.destroy({ where: { stocktakeId: id }, transaction: t });

      for (const item of items) {
        await StocktakeItem.create({
          stocktakeId: id,
          productId: item.productId,
          warehouseNodeId: item.warehouseNodeId,
          systemQty: Number(item.systemQty) || 0,
          countedQty: Number(item.countedQty) || 0
        }, { transaction: t });
      }
    }

    await stocktake.save({ transaction: t });
    await t.commit();

    await recordAudit({
      action: 'stocktake.update',
      entity: 'Stocktake',
      entityId: stocktake._id,
      userId: req.user._id,
      username: req.user.username
    });

    const populated = await Stocktake.findByPk(id, { include: stocktakeIncludes });
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const submitStocktake = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const stocktake = await Stocktake.findByPk(id, {
      include: [{ model: StocktakeItem, as: 'items' }]
    });
    if (!stocktake) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kê' });
    }

    if (stocktake.status !== 'counting') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể gửi phê duyệt phiếu đang trong trạng thái "Đang kiểm kê"' });
    }

    const hasDiff = stocktake.items.some(
      item => Number(item.countedQty) !== Number(item.systemQty)
    );

    stocktake.status = 'submitted';
    stocktake.hasDiff = hasDiff;
    stocktake.submittedByUserId = req.user._id;
    stocktake.submittedAt = new Date();
    await stocktake.save({ transaction: t });

    // Auto-create biên bản kiểm kê
    await StocktakeMinutes.create({
      code: 'BB-' + stocktake.code,
      stocktakeId: stocktake._id,
      summary: hasDiff
        ? 'Phát hiện chênh lệch tồn kho sau kiểm đếm. Vui lòng xem xét biên bản.'
        : 'Số liệu kiểm đếm khớp hoàn toàn với hệ thống.',
      createdByUserId: req.user._id,
      status: 'pending_approval'
    }, { transaction: t });

    await t.commit();

    await recordAudit({
      action: 'stocktake.submit',
      entity: 'Stocktake',
      entityId: stocktake._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: stocktake.code, hasDiff }
    });

    const populated = await Stocktake.findByPk(id, { include: stocktakeIncludes });
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const deleteStocktake = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stocktake = await Stocktake.findByPk(id);
    if (!stocktake) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kê' });
    }

    if (stocktake.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Chỉ có thể xóa phiếu kiểm kê đang chờ phê duyệt' });
    }

    await StocktakeItem.destroy({ where: { stocktakeId: id } });
    await Stocktake.destroy({ where: { _id: id } });

    await recordAudit({
      action: 'stocktake.delete',
      entity: 'Stocktake',
      entityId: Number(id),
      userId: req.user._id,
      username: req.user.username,
      payload: { code: stocktake.code }
    });

    res.json({ message: 'Xóa phiếu kiểm kê thành công' });
  } catch (error) {
    next(error);
  }
};
