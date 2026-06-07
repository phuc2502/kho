import express from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const auditLogRouter = express.Router();

auditLogRouter.use(authenticate);
auditLogRouter.use(requirePermission('audit:read'));

auditLogRouter.get('/', getAuditLogs);
