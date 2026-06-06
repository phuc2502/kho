import { api } from './api.js';

export const ProductModel = {
  getAll: async () => {
    return await api.get('/products');
  },
  create: async (productData) => {
    return await api.post('/products', productData);
  },
  update: async (id, productData) => {
    return await api.put(`/products/${id}`, productData);
  },
  delete: async (id) => {
    return await api.delete(`/products/${id}`);
  }
};
