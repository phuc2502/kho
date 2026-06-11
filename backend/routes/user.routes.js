import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  adminResetPassword,
  deactivateUser,
  reactivateUser,
  getUserWarehouses,
  assignUserWarehouse,
  removeUserWarehouse,
  getUserPermissions,
  saveUserPermissions,
  resetUserPermissions,
  getResetRequestsCount
} from '../controllers/user.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const userRouter = express.Router();

userRouter.use(authenticate);
userRouter.use(requirePermission('user:manage'));

// Đếm yêu cầu cấp lại MK (đặt TRƯỚC /:userId để tránh bị nhận nhầm là userId)
userRouter.get('/reset-requests-count', getResetRequestsCount);

// CRUD tài khoản
userRouter.get('/', getAllUsers);
userRouter.post('/', createUser);
userRouter.put('/:userId', updateUser);

// Admin đặt lại mật khẩu nhân viên (sinh mới + gửi email)
userRouter.post('/:userId/reset-password', adminResetPassword);

// Vô hiệu hóa / Kích hoạt (không bao giờ xóa tài khoản)
userRouter.put('/:userId/deactivate', deactivateUser);
userRouter.put('/:userId/reactivate', reactivateUser);

// Phân công kho (NguoiDung_Kho)
userRouter.get('/:userId/warehouses', getUserWarehouses);
userRouter.post('/:userId/warehouses', assignUserWarehouse);
userRouter.delete('/:userId/warehouses/:warehouseNodeId', removeUserWarehouse);

// Phân quyền chi tiết (NguoiDung_Quyen)
userRouter.get('/:userId/permissions', getUserPermissions);
userRouter.put('/:userId/permissions', saveUserPermissions);
userRouter.delete('/:userId/permissions', resetUserPermissions);
