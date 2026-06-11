import express from 'express';
import {
  getDeliveries,
  createDelivery,
  updateDelivery,
  submitDelivery,
  approveDelivery,
  rejectDelivery,
  shipDelivery,
  completeDelivery
} from '../controllers/delivery.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const deliveryRouter = express.Router();

deliveryRouter.use(authenticate);

// Xem danh sách phiếu xuất
deliveryRouter.get('/', requirePermission('delivery:read'), getDeliveries);

// Kế toán lập phiếu xuất nháp
deliveryRouter.post('/', requirePermission('delivery:create'), createDelivery);

// Kế toán sửa nội dung phiếu (chỉ khi draft)
deliveryRouter.put('/:id', requirePermission('delivery:create'), updateDelivery);

// Kế toán gửi phiếu lên để Quản lý phê duyệt
deliveryRouter.patch('/:id/submit', requirePermission('delivery:create'), submitDelivery);

// Quản lý kho phê duyệt phiếu xuất (draft → approved)
deliveryRouter.patch('/:id/approve', requirePermission('delivery:approve'), approveDelivery);

// Quản lý kho từ chối phiếu xuất (draft → rejected)
deliveryRouter.patch('/:id/reject', requirePermission('delivery:approve'), rejectDelivery);

// Nhân viên kho xác nhận xuất hàng vật lý (approved → shipping)
deliveryRouter.patch('/:id/ship', requirePermission('delivery:ship'), shipDelivery);

// Nhân viên kho hoàn tất sau khi nhận phiếu ký nhận (shipping → completed)
// Hệ thống tự động trừ tồn kho và ghi lịch sử giao dịch
deliveryRouter.patch('/:id/complete', requirePermission('delivery:ship'), completeDelivery);
