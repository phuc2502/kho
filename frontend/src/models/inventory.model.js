import { api } from './api.js';

export const InventoryModel = {
  getStock: async (productId, warehouseNodeId) => {
    let query = '';
    const params = [];
    if (productId) params.push(`productId=${productId}`);
    if (warehouseNodeId) params.push(`warehouseNodeId=${warehouseNodeId}`);
    if (params.length > 0) query = `?${params.join('&')}`;

    return await api.get(`/inventory${query}`);
  }
};
