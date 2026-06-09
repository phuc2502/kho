import { api } from './api.js';

export const AdjustmentModel = {
  getAll: async () => {
    return await api.get('/adjustments');
  },
  create: async (data) => {
    return await api.post('/adjustments', data);
  },
  approve: async (id) => {
    return await api.put(`/adjustments/${id}/approve`, {});
  },
  delete: async (id) => {
    return await api.delete(`/adjustments/${id}`);
  }
};
