import express from 'express';
import { getInventory } from '../controllers/inventory.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const inventoryRouter = express.Router();

inventoryRouter.use(authenticate);

inventoryRouter.get('/', requirePermission('inventory:read'), getInventory);
