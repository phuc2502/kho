import express from 'express';
import { StocktakeReport } from '../models/stocktakeReport.model.js';
import { Stocktake, StocktakeItem } from '../models/stocktake.model.js';
import { Adjustment } from '../models/adjustment.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const stocktakeReportRouter = express.Router();

stocktakeReportRouter.use(authenticate);

stocktakeReportRouter.get('/', requirePermission('stocktake:read'), async (req, res, next) => {
  try {
    const reports = await StocktakeReport.findAll({
      include: [
        { model: Stocktake, as: 'stocktake', attributes: ['_id', 'code', 'date', 'status', 'hasDiff', 'note'] },
        { model: User, as: 'generatedByUser', attributes: ['username', 'role'] },
        { model: Adjustment, as: 'adjustment', attributes: ['_id', 'code', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

stocktakeReportRouter.get('/:id', requirePermission('stocktake:read'), async (req, res, next) => {
  try {
    const report = await StocktakeReport.findByPk(req.params.id, {
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
        { model: User, as: 'generatedByUser', attributes: ['username', 'role'] },
        { model: Adjustment, as: 'adjustment', attributes: ['_id', 'code', 'status'] }
      ]
    });

    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo kiểm kê' });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});
