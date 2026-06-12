import { api } from './api.js';

export const IncidentModel = {
  getAll: async () => {
    return await api.get('/incidents');
  },
  create: async (data) => {
    return await api.post('/incidents', data);
  },
  approve: async (id) => {
    return await api.post(`/incidents/${id}/approve`, {});
  },
  reject: async (id, reason) => {
    return await api.post(`/incidents/${id}/reject`, { reason });
  },
  update: async (id, data) => {
    return await api.put(`/incidents/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/incidents/${id}`);
  }
};
