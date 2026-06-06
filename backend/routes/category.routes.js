import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const categoryRouter = express.Router();

categoryRouter.use(authenticate);

categoryRouter.get('/', requirePermission('category:read'), getCategories);
categoryRouter.post('/', requirePermission('category:create'), createCategory);
categoryRouter.put('/:id', requirePermission('category:update'), updateCategory);
categoryRouter.delete('/:id', requirePermission('category:delete'), deleteCategory);
