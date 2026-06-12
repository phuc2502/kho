import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const notificationRouter = express.Router();

// Tất cả endpoints yêu cầu đăng nhập
notificationRouter.use(authenticate);

notificationRouter.get('/', getNotifications);
notificationRouter.patch('/read-all', markAllAsRead);
notificationRouter.patch('/:id/read', markAsRead);
notificationRouter.delete('/:id', deleteNotification);
