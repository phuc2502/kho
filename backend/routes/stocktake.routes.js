import express from 'express';
import {
  getStocktakes,
  createStocktake,
  approveStocktake,
  rejectStocktake,
  updateStocktake,
  submitStocktake,
  deleteStocktake,
  completeCounting
} from '../controllers/stocktake.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const stocktakeRouter = express.Router();

stocktakeRouter.use(authenticate);

stocktakeRouter.get('/', requirePermission('stocktake:read'), getStocktakes);
stocktakeRouter.post('/', requirePermission('stocktake:create'), createStocktake);
stocktakeRouter.put('/:id/approve', requirePermission('stocktake:approve'), approveStocktake);
stocktakeRouter.patch('/:id/reject', requirePermission('stocktake:approve'), rejectStocktake);
stocktakeRouter.patch('/:id/submit', requirePermission('stocktake:create'), submitStocktake);
stocktakeRouter.patch('/:id/complete-counting', requirePermission('stocktake:count'), completeCounting);
stocktakeRouter.put('/:id', requirePermission('stocktake:count'), updateStocktake);
stocktakeRouter.delete('/:id', requirePermission('stocktake:create'), deleteStocktake);
