import express from 'express';
import { getReceipts, createReceipt, updateReceipt } from '../controllers/receipt.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const receiptRouter = express.Router();

receiptRouter.use(authenticate);

receiptRouter.get('/', requirePermission('receipt:read'), getReceipts);
receiptRouter.post('/', requirePermission('receipt:create'), createReceipt);
receiptRouter.put('/:id', requirePermission('receipt:update'), updateReceipt);
