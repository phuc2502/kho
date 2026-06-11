import express from 'express';
import {
  getStocktakeMinutes,
  getStocktakeMinutesById,
  approveMinutes,
  rejectMinutes
} from '../controllers/stocktakeMinutes.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const stocktakeMinutesRouter = express.Router();

stocktakeMinutesRouter.use(authenticate);

stocktakeMinutesRouter.get('/', requirePermission('stocktake:read'), getStocktakeMinutes);
stocktakeMinutesRouter.get('/:id', requirePermission('stocktake:read'), getStocktakeMinutesById);
stocktakeMinutesRouter.patch('/:id/approve', requirePermission('stocktake:approve'), approveMinutes);
stocktakeMinutesRouter.patch('/:id/reject', requirePermission('stocktake:approve'), rejectMinutes);
