// [THÊM MỚI] — API calls cho EmailLogs
import { api } from './api.js';

export const EmailLogModel = {
  // Thống kê 24h
  getStats: () => api.get('/email-logs/stats'),

  // Danh sách (có filter + phân trang)
  getLogs: ({ type = 'all', status = 'all', page = 1, limit = 50 } = {}) =>
    api.get('/email-logs', { params: { type, status, page, limit } }),

  // Xóa tất cả email thất bại
  deleteFailedLogs: () => api.delete('/email-logs/failed'),

  // Xóa một bản ghi
  deleteLog: (logId) => api.delete(`/email-logs/${logId}`),
};
