import { api } from './api.js';

export const UserModel = {
  // ——— Auth ———
  login: async (emailOrUsername, password, rememberMe = false) => {
    return await api.post('/auth/login', { emailOrUsername, password, rememberMe });
  },

  register: async (username, email, password, role) => {
    return await api.post('/auth/register', { username, email, password, role });
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  changePassword: async (currentPassword, newPassword) => {
    return await api.put('/auth/change-password', { currentPassword, newPassword });
  },

  // Quên mật khẩu — gửi link reset qua email
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Đặt lại mật khẩu qua token (từ link email)
  resetPassword: async (token, newPassword) => {
    return await api.post('/auth/reset-password', { token, newPassword });
  },

  // ——— Quản lý tài khoản (Admin) ———
  getAllUsers: async () => {
    return await api.get('/users');
  },

  // Tạo tài khoản — chỉ cần email, role, họ tên, SĐT
  // Password tự động sinh + gửi qua email nhân viên
  createUser: async ({ email, role, fullName, phone }) => {
    return await api.post('/users', { email, role, fullName, phone });
  },

  updateUser: async (userId, updates) => {
    return await api.put(`/users/${userId}`, updates);
  },

  // Admin đặt lại mật khẩu cho nhân viên (sinh mới + gửi email)
  adminResetPassword: async (userId) => {
    return await api.post(`/users/${userId}/reset-password`);
  },

  // Vô hiệu hóa (bắt buộc có lý do — không bao giờ xóa tài khoản)
  deactivateUser: async (userId, reason) => {
    return await api.put(`/users/${userId}/deactivate`, { reason });
  },

  // Kích hoạt lại
  reactivateUser: async (userId) => {
    return await api.put(`/users/${userId}/reactivate`, {});
  },

  // ——— Phân công kho (NguoiDung_Kho) ———
  getUserWarehouses: async (userId) => {
    return await api.get(`/users/${userId}/warehouses`);
  },

  assignWarehouse: async (userId, warehouseNodeId) => {
    return await api.post(`/users/${userId}/warehouses`, { warehouseNodeId });
  },

  removeWarehouse: async (userId, warehouseNodeId) => {
    return await api.delete(`/users/${userId}/warehouses/${warehouseNodeId}`);
  },

  // ——— Phân quyền chi tiết (NguoiDung_Quyen) ———
  getUserPermissions: async (userId) => {
    return await api.get(`/users/${userId}/permissions`);
  },

  saveUserPermissions: async (userId, grants, revokes) => {
    return await api.put(`/users/${userId}/permissions`, { grants, revokes });
  },

  resetUserPermissions: async (userId) => {
    return await api.delete(`/users/${userId}/permissions`);
  },
};
