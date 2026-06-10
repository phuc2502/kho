import express from 'express';
import { register, login, getMe, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.put('/change-password', authenticate, changePassword);

// ——— Quên / đặt lại mật khẩu (không cần đăng nhập) ———
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
