import express from 'express';
import { getIncidents, createIncident, approveIncident, rejectIncident, updateIncident, deleteIncident } from '../controllers/incident.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const incidentRouter = express.Router();

incidentRouter.use(authenticate);

incidentRouter.get('/', requirePermission('incident:read'), getIncidents);
incidentRouter.post('/', requirePermission('incident:create'), createIncident);
incidentRouter.post('/:id/approve', requirePermission('incident:approve'), approveIncident);
incidentRouter.post('/:id/reject', requirePermission('incident:approve'), rejectIncident);
incidentRouter.put('/:id', requirePermission('incident:create'), updateIncident);
incidentRouter.delete('/:id', requirePermission('incident:create'), deleteIncident);
