import { api } from './api.js';

export const DeliveryModel = {
  getAll: async () => {
    return await api.get('/deliveries');
  },
  create: async (deliveryData) => {
    return await api.post('/deliveries', deliveryData);
  },
  update: async (id, deliveryData) => {
    return await api.put(`/deliveries/${id}`, deliveryData);
  }
};
