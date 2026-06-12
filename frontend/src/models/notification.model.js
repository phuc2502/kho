import { api } from './api.js';

export const NotificationModel = {
  /**
   * Lấy danh sách thông báo của user hiện tại
   * @returns {{ notifications: Array, unreadCount: number }}
   */
  getNotifications: () => api.get('/notifications'),

  /**
   * Đánh dấu một thông báo là đã đọc
   * @param {number} id
   */
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: () => api.patch('/notifications/read-all'),

  /**
   * Xóa một thông báo
   * @param {number} id
   */
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};
