import express from 'express';
import { getAdjustments, createAdjustment, approveAdjustment, deleteAdjustment } from '../controllers/adjustment.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const adjustmentRouter = express.Router();

adjustmentRouter.use(authenticate);

adjustmentRouter.get('/', requirePermission('adjustment:read'), getAdjustments);
adjustmentRouter.post('/', requirePermission('adjustment:create'), createAdjustment);
adjustmentRouter.put('/:id/approve', requirePermission('adjustment:approve'), approveAdjustment);
adjustmentRouter.delete('/:id', requirePermission('adjustment:create'), deleteAdjustment);
