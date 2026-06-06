import { api } from './api.js';

export const PartnerModel = {
  getAll: async (type) => {
    const query = type ? `?type=${type}` : '';
    return await api.get(`/partners${query}`);
  },
  create: async (partnerData) => {
    return await api.post('/partners', partnerData);
  },
  update: async (id, partnerData) => {
    return await api.put(`/partners/${id}`, partnerData);
  },
  delete: async (id) => {
    return await api.delete(`/partners/${id}`);
  }
};
