import { api } from './api.js';

export const DeliveryModel = {
  getAll:   async ()           => await api.get('/deliveries'),
  create:   async (data)       => await api.post('/deliveries', data),
  update:   async (id, data)   => await api.put(`/deliveries/${id}`, data),
  submit:   async (id)         => await api.patch(`/deliveries/${id}/submit`),
  approve:  async (id)         => await api.patch(`/deliveries/${id}/approve`),
  reject:   async (id, reason) => await api.patch(`/deliveries/${id}/reject`, { reason }),
  ship:     async (id)         => await api.patch(`/deliveries/${id}/ship`),
  complete: async (id, signatureData) => await api.patch(`/deliveries/${id}/complete`, signatureData || {}),
};
