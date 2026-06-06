import { api } from './api.js';

export const UserModel = {
  login: async (emailOrUsername, password) => {
    return await api.post('/auth/login', { emailOrUsername, password });
  },

  register: async (username, email, password, role) => {
    return await api.post('/auth/register', { username, email, password, role });
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  getAllUsers: async () => {
    return await api.get('/users');
  },

  updatePermissions: async (userId, role, permissions) => {
    return await api.put(`/users/${userId}/permissions`, { role, permissions });
  },

  deleteUser: async (userId) => {
    return await api.delete(`/users/${userId}`);
  }
};
