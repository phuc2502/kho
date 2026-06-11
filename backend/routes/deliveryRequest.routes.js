import express from 'express';
import {
  getDeliveryRequests,
  getDeliveryRequestById,
  createDeliveryRequest,
  cancelDeliveryRequest,
  updateDeliveryRequestStatus
} from '../controllers/deliveryRequest.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const deliveryRequestRouter = express.Router();

deliveryRequestRouter.use(authenticate);

deliveryRequestRouter.get('/',     requirePermission('delivery-request:read'),   getDeliveryRequests);
deliveryRequestRouter.get('/:id',  requirePermission('delivery-request:read'),   getDeliveryRequestById);
deliveryRequestRouter.post('/',    requirePermission('delivery-request:create'),  createDeliveryRequest);
deliveryRequestRouter.patch('/:id/cancel', requirePermission('delivery-request:create'), cancelDeliveryRequest);
deliveryRequestRouter.patch('/:id/status', requirePermission('delivery-request:read'),   updateDeliveryRequestStatus);
