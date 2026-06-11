import { api } from './api.js';

export const StocktakeModel = {
  getAll:   async ()           => await api.get('/stocktakes'),
  create:   async (data)       => await api.post('/stocktakes', data),
  approve:  async (id)         => await api.put(`/stocktakes/${id}/approve`, {}),
  reject:   async (id, reason) => await api.patch(`/stocktakes/${id}/reject`, { reason }),
  update:   async (id, data)   => await api.put(`/stocktakes/${id}`, data),
  submit:   async (id)         => await api.patch(`/stocktakes/${id}/submit`),
  delete:   async (id)         => await api.delete(`/stocktakes/${id}`)
};
