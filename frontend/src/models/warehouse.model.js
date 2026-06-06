import { api } from './api.js';

export const WarehouseModel = {
  getAll: async () => {
    return await api.get('/warehouses');
  },
  create: async (nodeData) => {
    return await api.post('/warehouses', nodeData);
  },
  update: async (id, nodeData) => {
    return await api.put(`/warehouses/${id}`, nodeData);
  },
  delete: async (id) => {
    return await api.delete(`/warehouses/${id}`);
  }
};
