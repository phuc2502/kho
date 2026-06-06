import express from 'express';
import { getPartners, createPartner, updatePartner, deletePartner } from '../controllers/partner.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const partnerRouter = express.Router();

partnerRouter.use(authenticate);

partnerRouter.get('/', requirePermission('partner:read'), getPartners);
partnerRouter.post('/', requirePermission('partner:create'), createPartner);
partnerRouter.put('/:id', requirePermission('partner:update'), updatePartner);
partnerRouter.delete('/:id', requirePermission('partner:delete'), deletePartner);
