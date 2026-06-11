import express from 'express';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';
import { getCustomers, getCustomerById, createCustomer, updateCustomer } from '../controllers/customer.controller.js';

export const customerRouter = express.Router();
customerRouter.use(authenticate);

customerRouter.get('/',    requirePermission('customer:read'),   getCustomers);
customerRouter.get('/:id', requirePermission('customer:read'),   getCustomerById);
customerRouter.post('/',   requirePermission('customer:create'), createCustomer);
customerRouter.put('/:id', requirePermission('customer:update'), updateCustomer);
