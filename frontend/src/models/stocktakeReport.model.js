import { api } from './api.js';

export const StocktakeReportModel = {
  getAll:   async ()   => await api.get('/stocktake-reports'),
  getById:  async (id) => await api.get(`/stocktake-reports/${id}`),
};
