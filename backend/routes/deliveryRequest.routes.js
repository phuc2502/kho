import express from 'express';
import {
  getDeliveryRequests,
  getDeliveryRequestById,
  createDeliveryRequest,
  cancelDeliveryRequest,
  updateDeliveryRequestStatus,
  checkDeliveryRequestStock
} from '../controllers/deliveryRequest.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const deliveryRequestRouter = express.Router();

deliveryRequestRouter.use(authenticate);

deliveryRequestRouter.get('/',     requirePermission('delivery-request:read'),   getDeliveryRequests);
deliveryRequestRouter.get('/:id',  requirePermission('delivery-request:read'),   getDeliveryRequestById);
deliveryRequestRouter.post('/',    requirePermission('delivery-request:create'),  createDeliveryRequest);

// Kế toán kiểm tra tồn kho trước khi lập phiếu xuất
deliveryRequestRouter.post('/:id/check-stock', requirePermission('delivery:create'), checkDeliveryRequestStock);

// Sale huỷ yêu cầu của mình
deliveryRequestRouter.patch('/:id/cancel', requirePermission('delivery-request:create'), cancelDeliveryRequest);

// Kế toán/Quản lý cập nhật trạng thái yêu cầu (processing / completed)
deliveryRequestRouter.patch('/:id/status', requirePermission('delivery-request:read'), updateDeliveryRequestStatus);
