import express from 'express';
import {
  getStockCards,
  createManualStockCard,
  updateManualStockCard,
  deleteManualStockCard
} from '../controllers/stockCard.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const stockCardRouter = express.Router();

stockCardRouter.use(authenticate);

stockCardRouter.get('/',       requirePermission('inventory:read'),    getStockCards);
stockCardRouter.post('/',      requirePermission('adjustment:create'), createManualStockCard);
stockCardRouter.put('/:id',    requirePermission('adjustment:create'), updateManualStockCard);
stockCardRouter.delete('/:id', requirePermission('adjustment:create'), deleteManualStockCard);
