import { api } from './api.js';

export const StocktakeModel = {
  getAll: async () => {
    return await api.get('/stocktakes');
  },
  create: async (data) => {
    return await api.post('/stocktakes', data);
  },
  update: async (id, data) => {
    return await api.put(`/stocktakes/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/stocktakes/${id}`);
  }
};
