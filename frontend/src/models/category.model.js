import { api } from './api.js';

export const CategoryModel = {
  getAll: async () => {
    return await api.get('/categories');
  },
  create: async (categoryData) => {
    return await api.post('/categories', categoryData);
  },
  update: async (id, categoryData) => {
    return await api.put(`/categories/${id}`, categoryData);
  },
  delete: async (id) => {
    return await api.delete(`/categories/${id}`);
  }
};
