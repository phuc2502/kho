import { api } from './api.js';

export const AuditLogModel = {
  getAll: async ({ limit = 100, offset = 0 } = {}) => {
    return await api.get(`/audit-logs?limit=${limit}&offset=${offset}`);
  }
};
