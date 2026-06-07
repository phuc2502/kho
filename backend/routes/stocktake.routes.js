import express from 'express';
import { getStocktakes, createStocktake, updateStocktake, deleteStocktake } from '../controllers/stocktake.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const stocktakeRouter = express.Router();

stocktakeRouter.use(authenticate);

stocktakeRouter.get('/', requirePermission('stocktake:read'), getStocktakes);
stocktakeRouter.post('/', requirePermission('stocktake:create'), createStocktake);
stocktakeRouter.put('/:id', requirePermission('stocktake:create'), updateStocktake);
stocktakeRouter.delete('/:id', requirePermission('stocktake:create'), deleteStocktake);
