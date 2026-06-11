import { api } from './api.js';

export const CustomerModel = {
  getAll:    async ()        => await api.get('/customers'),
  getById:   async (id)      => await api.get(`/customers/${id}`),
  create:    async (data)    => await api.post('/customers', data),
  update:    async (id, data) => await api.put(`/customers/${id}`, data),
};
