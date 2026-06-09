import { api } from './api.js';

export const IncidentModel = {
  getAll: async () => {
    return await api.get('/incidents');
  },
  create: async (data) => {
    return await api.post('/incidents', data);
  },
  update: async (id, data) => {
    return await api.put(`/incidents/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/incidents/${id}`);
  }
};
