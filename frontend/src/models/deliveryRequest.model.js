import { api } from './api.js';

export const DeliveryRequestModel = {
  getAll: async () => {
    return await api.get('/delivery-requests');
  },
  getById: async (id) => {
    return await api.get(`/delivery-requests/${id}`);
  },
  create: async (data) => {
    return await api.post('/delivery-requests', data);
  },
  cancel: async (id) => {
    return await api.patch(`/delivery-requests/${id}/cancel`, {});
  },
  updateStatus: async (id, status) => {
    return await api.patch(`/delivery-requests/${id}/status`, { status });
  }
};
