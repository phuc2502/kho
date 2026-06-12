import { api } from './api.js';

export const ReceiptModel = {
  getAll: async () => {
    return await api.get('/receipts');
  },
  create: async (receiptData) => {
    return await api.post('/receipts', receiptData);
  },
  update: async (id, receiptData) => {
    return await api.put(`/receipts/${id}`, receiptData);
  },
  complete: async (id, data) => {
    return await api.put(`/receipts/${id}/complete`, data);
  }
};
