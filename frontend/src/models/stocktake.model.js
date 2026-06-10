import { api } from './api.js';

export const StocktakeModel = {
  getAll: async () => {
    return await api.get('/stocktakes');
  },
  create: async (data) => {
    return await api.post('/stocktakes', data);
  },
  approve: async (id) => {
    return await api.put(`/stocktakes/${id}/approve`, {});
  },
  update: async (id, data) => {
    return await api.put(`/stocktakes/${id}`, data);
  },
  complete: async (id) => {
    return await api.put(`/stocktakes/${id}/complete`, {});
  },
  delete: async (id) => {
    return await api.delete(`/stocktakes/${id}`);
  }
};
