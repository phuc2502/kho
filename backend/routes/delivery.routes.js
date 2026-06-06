import express from 'express';
import { getDeliveries, createDelivery, updateDelivery } from '../controllers/delivery.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const deliveryRouter = express.Router();

deliveryRouter.use(authenticate);

deliveryRouter.get('/', requirePermission('delivery:read'), getDeliveries);
deliveryRouter.post('/', requirePermission('delivery:create'), createDelivery);
deliveryRouter.put('/:id', requirePermission('delivery:update'), updateDelivery);
