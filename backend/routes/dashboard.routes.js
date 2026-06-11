import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const dashboardRouter = express.Router();

dashboardRouter.use(authenticate);

// GET /api/v1/dashboard/stats
// 5 widget phân tích trang Tổng Quan (Gap 5 v2.0)
dashboardRouter.get('/stats', getDashboardStats);
