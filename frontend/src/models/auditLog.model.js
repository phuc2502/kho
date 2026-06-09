import { api } from './api.js';

export const AuditLogModel = {
  getAll: async () => {
    return await api.get('/audit-logs');
  }
};
