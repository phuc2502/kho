import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const productRouter = express.Router();

productRouter.use(authenticate);

productRouter.get('/', requirePermission('product:read'), getProducts);
productRouter.post('/', requirePermission('product:create'), createProduct);
productRouter.put('/:id', requirePermission('product:update'), updateProduct);
productRouter.delete('/:id', requirePermission('product:delete'), deleteProduct);
