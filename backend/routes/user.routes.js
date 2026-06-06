import express from 'express';
import { getAllUsers, updateUserPermissions, deleteUser } from '../controllers/user.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

export const userRouter = express.Router();

userRouter.use(authenticate);
userRouter.use(requirePermission('user:manage'));

userRouter.get('/', getAllUsers);
userRouter.put('/:userId/permissions', updateUserPermissions);
userRouter.delete('/:userId', deleteUser);
