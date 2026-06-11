import { api } from './api.js';

export const StockCardModel = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.productId) query.append('productId', params.productId);
    if (params.warehouseNodeId) query.append('warehouseNodeId', params.warehouseNodeId);
    if (params.type) query.append('type', params.type);
    if (params.refCode) query.append('refCode', params.refCode);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    
    const queryString = query.toString();
    return await api.get(`/stock-cards${queryString ? `?${queryString}` : ''}`);
  },
  createManual: async (data) => {
    return await api.post('/stock-cards', data);
  },
  updateManual: async (id, data) => {
    return await api.put(`/stock-cards/${id}`, data);
  },
  deleteManual: async (id) => {
    return await api.delete(`/stock-cards/${id}`);
  }
};
