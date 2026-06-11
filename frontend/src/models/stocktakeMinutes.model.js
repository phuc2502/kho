import { api } from './api.js';

export const StocktakeMinutesModel = {
  getAll:   async ()           => await api.get('/stocktake-minutes'),
  getById:  async (id)         => await api.get(`/stocktake-minutes/${id}`),
  approve:  async (id)         => await api.patch(`/stocktake-minutes/${id}/approve`),
  reject:   async (id, reason) => await api.patch(`/stocktake-minutes/${id}/reject`, { reason }),
};
