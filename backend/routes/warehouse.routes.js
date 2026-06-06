import express from 'express';
import { getWarehouseNodes, createWarehouseNode, updateWarehouseNode, deleteWarehouseNode } from '../controllers/warehouse.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const warehouseRouter = express.Router();

warehouseRouter.use(authenticate);

warehouseRouter.get('/', requirePermission('warehouse:read'), getWarehouseNodes);
warehouseRouter.post('/', requirePermission('warehouse:create'), createWarehouseNode);
warehouseRouter.put('/:id', requirePermission('warehouse:update'), updateWarehouseNode);
warehouseRouter.delete('/:id', requirePermission('warehouse:delete'), deleteWarehouseNode);
