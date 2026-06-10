// [THÊM MỚI] — Routes nhật ký email (chỉ Admin)
import express from 'express';
import {
  getEmailStats,
  getEmailLogs,
  deleteFailedLogs,
  deleteEmailLog
} from '../controllers/email-log.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const emailLogRouter = express.Router();

// Tất cả routes yêu cầu đăng nhập + quyền user:manage (chỉ Admin có quyền này)
emailLogRouter.use(authenticate);
emailLogRouter.use(requirePermission('user:manage'));

emailLogRouter.get('/stats',      getEmailStats);    // GET /email-logs/stats
emailLogRouter.get('/',           getEmailLogs);     // GET /email-logs?type=&status=&page=
emailLogRouter.delete('/failed',  deleteFailedLogs); // DELETE /email-logs/failed
emailLogRouter.delete('/:logId',  deleteEmailLog);   // DELETE /email-logs/:id
