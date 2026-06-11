import express from 'express';
import { register, login, getMe, changePassword, forceChangePassword, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.put('/change-password', authenticate, changePassword);
authRouter.put('/force-change-password', authenticate, forceChangePassword); // buộc đổi MK lần đầu

// ——— Quên / đặt lại mật khẩu (không cần đăng nhập) ———
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
