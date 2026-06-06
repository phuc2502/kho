import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_me_in_production');

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị xóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực người dùng' });
    }

    // Admin has all permissions automatically
    if (req.user.role === 'Admin') {
      return next();
    }

    // Check if user has the specific permission
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      message: `Bạn không có quyền thực hiện thao tác này (Yêu cầu quyền: ${permission})`
    });
  };
};
