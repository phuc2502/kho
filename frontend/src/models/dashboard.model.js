import { api } from './api.js';

export const DashboardModel = {
  /**
   * GET /api/v1/dashboard/stats
   * Trả về 5 widget phân tích trang Tổng Quan (Gap 5 v2.0):
   *  - lowStock:         { threshold, items[] }
   *  - consumption30d:   { days, items[] }
   *  - warrantyExpiring: { days, items[] }  ← stub cho đến khi migrate Han_bao_hanh
   *  - slowMoving:       { days, items[] }
   *  - top10Deliveries:  { items[] }
   */
  getStats: () => api.get('/dashboard/stats'),
};
