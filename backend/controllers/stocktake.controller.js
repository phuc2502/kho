import { Stocktake, StocktakeItem } from '../models/stocktake.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { Op } from 'sequelize';

const computeStatus = (items) => {
  return items.some(item => Number(item.countedQty) !== Number(item.systemQty)) ? 'diff' : 'pass';
};

const stocktakeIncludes = [
  { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
  {
    model: StocktakeItem,
    as: 'items',
    include: [
      { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
      { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
    ]
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

    // Generate auto code if not provided
    const count = await Stocktake.count();
    const finalCode = code || `ST-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const existingCode = await Stocktake.findOne({ where: { code: finalCode } });
    if (existingCode) {
      await t.rollback();
      return res.status(400).json({ message: `Mã phiếu kiểm kê ${finalCode} đã tồn tại` });
    }

    // Enrich items with systemQty from Inventory
    const enrichedItems = [];
    for (const item of items) {
      const inventoryRecord = await Inventory.findOne({
        where: { productId: item.productId, warehouseNodeId: item.warehouseNodeId },
        transaction: t
      });
      enrichedItems.push({
        productId: item.productId,
        warehouseNodeId: item.warehouseNodeId,
        systemQty: inventoryRecord ? Number(inventoryRecord.quantity) : 0,
        countedQty: Number(item.countedQty) || 0
      });
    }

    const status = computeStatus(enrichedItems);

    const stocktake = await Stocktake.create({
      code: finalCode,
      date: date || new Date(),
      status,
      note: note || null,
      createdByUserId: req.user._id
    }, { transaction: t });

    for (const item of enrichedItems) {
      await StocktakeItem.create({
        stocktakeId: stocktake._id,
        productId: item.productId,
        warehouseNodeId: item.warehouseNodeId,
        systemQty: item.systemQty,
        countedQty: item.countedQty
      }, { transaction: t });
    }

    await t.commit();

    await recordAudit({
      action: 'stocktake.create',
      entity: 'Stocktake',
      entityId: stocktake._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: stocktake.code, status }
    });

    const populated = await Stocktake.findByPk(stocktake._id, { include: stocktakeIncludes });
    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
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

    if (date) stocktake.date = date;
    if (note !== undefined) stocktake.note = note;

    if (items && items.length > 0) {
      await StocktakeItem.destroy({ where: { stocktakeId: id }, transaction: t });

      const enrichedItems = [];
      for (const item of items) {
        const inventoryRecord = await Inventory.findOne({
          where: { productId: item.productId, warehouseNodeId: item.warehouseNodeId },
          transaction: t
        });
        enrichedItems.push({
          productId: item.productId,
          warehouseNodeId: item.warehouseNodeId,
          systemQty: item.systemQty !== undefined ? Number(item.systemQty) : (inventoryRecord ? Number(inventoryRecord.quantity) : 0),
          countedQty: Number(item.countedQty) || 0
        });
      }

      for (const item of enrichedItems) {
        await StocktakeItem.create({
          stocktakeId: id,
          productId: item.productId,
          warehouseNodeId: item.warehouseNodeId,
          systemQty: item.systemQty,
          countedQty: item.countedQty
        }, { transaction: t });
      }

      stocktake.status = computeStatus(enrichedItems);
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

export const deleteStocktake = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stocktake = await Stocktake.findByPk(id);
    if (!stocktake) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kê' });
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
