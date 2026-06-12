import express from 'express';
import { getIncidents, createIncident, updateIncident, deleteIncident } from '../controllers/incident.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const incidentRouter = express.Router();

incidentRouter.use(authenticate);

incidentRouter.get('/', requirePermission('incident:read'), getIncidents);
incidentRouter.post('/', requirePermission('incident:create'), createIncident);
incidentRouter.put('/:id', requirePermission('incident:approve'), updateIncident);
incidentRouter.delete('/:id', requirePermission('incident:create'), deleteIncident);
