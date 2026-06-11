import { StockCard } from '../models/stockCard.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { Op } from 'sequelize';

// ── GET /api/v1/stock-cards ────────────────────────────────────
export const getStockCards = async (req, res, next) => {
  try {
    const { productId, warehouseNodeId, type, startDate, endDate, refCode } = req.query;

    const where = {};

    if (productId) {
      where.productId = productId;
    }
    if (warehouseNodeId) {
      where.warehouseNodeId = warehouseNodeId;
    }
    if (type) {
      where.type = type;
    }
    if (refCode) {
      where.refCode = { [Op.like]: `%${refCode.trim()}%` };
    }
    if (startDate && endDate) {
      where.recordedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.recordedAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.recordedAt = {
        [Op.lte]: new Date(endDate)
      };
    }

    const stockCards = await StockCard.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] },
        { model: WarehouseNode, as: 'warehouseNode', attributes: ['_id', 'code', 'name', 'type'] },
        { model: User, as: 'createdByUser', attributes: ['_id', 'username', 'fullName', 'role'] }
      ],
      order: [['recordedAt', 'DESC'], ['_id', 'DESC']]
    });

    res.json(stockCards);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/stock-cards (Lập thủ công) ───────────────────
export const createManualStockCard = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { productId, warehouseNodeId, qtyChange, note, recordedAt } = req.body;

    if (!productId || !warehouseNodeId || qtyChange === undefined || qtyChange === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng điền đủ sản phẩm, vị trí kho và số lượng biến động khác 0' });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const node = await WarehouseNode.findByPk(warehouseNodeId, { transaction: t });
    if (!node) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy vị trí khay chứa' });
    }

    // Lấy tồn kho hiện tại
    const inventory = await Inventory.findOne({
      where: { productId, warehouseNodeId },
      transaction: t
    });

    const qtyBefore = inventory ? inventory.quantity : 0;
    const qtyAfter = qtyBefore + Number(qtyChange);

    if (qtyAfter < 0) {
      await t.rollback();
      return res.status(400).json({ message: `Số lượng tồn kho không thể âm. (Hiện tại: ${qtyBefore}, Yêu cầu thay đổi: ${qtyChange})` });
    }

    // Cập nhật tồn kho
    if (inventory) {
      inventory.quantity = qtyAfter;
      await inventory.save({ transaction: t });
    } else {
      await Inventory.create({
        productId,
        warehouseNodeId,
        quantity: qtyAfter
      }, { transaction: t });
    }

    // Sinh mã thẻ kho tự động
    const count = await StockCard.count({ transaction: t });
    const code = `TK-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const stockCard = await StockCard.create({
      code,
      productId,
      warehouseNodeId,
      refCode: 'MANUAL',
      type: 'manual',
      qtyBefore,
      qtyChange: Number(qtyChange),
      qtyAfter,
      note: note || 'Lập thẻ kho thủ công',
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      createdByUserId: req.user._id
    }, { transaction: t });

    await t.commit();

    const populated = await StockCard.findByPk(stockCard._id, {
      include: [
        { model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] },
        { model: WarehouseNode, as: 'warehouseNode', attributes: ['_id', 'code', 'name', 'type'] },
        { model: User, as: 'createdByUser', attributes: ['_id', 'username', 'fullName', 'role'] }
      ]
    });

    await recordAudit({
      action: 'stockcard.create_manual',
      userId: req.user._id,
      username: req.user.username,
      entity: 'stockcard',
      entityId: stockCard._id,
      payload: { code, qtyChange: Number(qtyChange), sku: product.sku }
    });

    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ── PUT /api/v1/stock-cards/:id (Sửa thẻ thủ công) ─────────────
export const updateManualStockCard = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { qtyChange, note, recordedAt } = req.body;

    const stockCard = await StockCard.findByPk(id, { transaction: t });
    if (!stockCard) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy thẻ kho' });
    }

    if (stockCard.type !== 'manual') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể sửa thẻ kho được lập thủ công' });
    }

    if (qtyChange === undefined || qtyChange === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Số lượng thay đổi phải khác 0' });
    }

    const diff = Number(qtyChange) - stockCard.qtyChange;

    const inventory = await Inventory.findOne({
      where: { productId: stockCard.productId, warehouseNodeId: stockCard.warehouseNodeId },
      transaction: t
    });

    const currentQty = inventory ? inventory.quantity : 0;
    const newInventoryQty = currentQty + diff;

    if (newInventoryQty < 0) {
      await t.rollback();
      return res.status(400).json({ message: `Số lượng tồn kho không thể âm. (Hiện có: ${currentQty}, chênh lệch điều chỉnh: ${diff})` });
    }

    // Cập nhật tồn kho
    if (inventory) {
      inventory.quantity = newInventoryQty;
      await inventory.save({ transaction: t });
    } else {
      await Inventory.create({
        productId: stockCard.productId,
        warehouseNodeId: stockCard.warehouseNodeId,
        quantity: newInventoryQty
      }, { transaction: t });
    }

    // Cập nhật thẻ kho
    stockCard.qtyChange = Number(qtyChange);
    stockCard.qtyAfter = stockCard.qtyBefore + Number(qtyChange);
    if (note !== undefined) stockCard.note = note;
    if (recordedAt !== undefined) stockCard.recordedAt = new Date(recordedAt);

    await stockCard.save({ transaction: t });
    await t.commit();

    const populated = await StockCard.findByPk(id, {
      include: [
        { model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] },
        { model: WarehouseNode, as: 'warehouseNode', attributes: ['_id', 'code', 'name', 'type'] },
        { model: User, as: 'createdByUser', attributes: ['_id', 'username', 'fullName', 'role'] }
      ]
    });

    await recordAudit({
      action: 'stockcard.update_manual',
      userId: req.user._id,
      username: req.user.username,
      entity: 'stockcard',
      entityId: Number(id),
      payload: { code: stockCard.code, oldQty: stockCard.qtyChange, newQty: Number(qtyChange) }
    });

    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ── DELETE /api/v1/stock-cards/:id (Xóa thẻ thủ công) ───────────
export const deleteManualStockCard = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const stockCard = await StockCard.findByPk(id, { transaction: t });
    if (!stockCard) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy thẻ kho' });
    }

    if (stockCard.type !== 'manual') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể xóa thẻ kho được lập thủ công' });
    }

    // Hoàn trả tồn kho (trừ lượng đã cộng hoặc cộng lại lượng đã trừ)
    const revertQty = -stockCard.qtyChange;

    const inventory = await Inventory.findOne({
      where: { productId: stockCard.productId, warehouseNodeId: stockCard.warehouseNodeId },
      transaction: t
    });

    const currentQty = inventory ? inventory.quantity : 0;
    const newInventoryQty = currentQty + revertQty;

    if (newInventoryQty < 0) {
      await t.rollback();
      return res.status(400).json({ message: `Không thể xóa thẻ kho vì số lượng tồn sẽ bị âm. (Hiện có: ${currentQty}, yêu cầu hoàn trả: ${revertQty})` });
    }

    if (inventory) {
      inventory.quantity = newInventoryQty;
      await inventory.save({ transaction: t });
    }

    await stockCard.destroy({ transaction: t });
    await t.commit();

    await recordAudit({
      action: 'stockcard.delete_manual',
      userId: req.user._id,
      username: req.user.username,
      entity: 'stockcard',
      entityId: Number(id),
      payload: { code: stockCard.code, revertedQty: revertQty }
    });

    res.json({ message: 'Xóa thẻ kho thủ công và khôi phục tồn kho thành công' });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
