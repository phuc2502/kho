import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/user.model.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_key_change_me_in_production', {
    expiresIn: '7d'
  });
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    if (userExists) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc Email đã được sử dụng' });
    }

    // Set default permissions based on role for a smooth start
    let defaultPermissions = [];
    if (role === 'Manager') {
      defaultPermissions = [
        'product:read', 'product:create', 'product:update',
        'category:read', 'category:create', 'category:update',
        'warehouse:read', 'warehouse:create', 'warehouse:update',
        'partner:read', 'partner:create', 'partner:update',
        'receipt:read', 'receipt:create', 'receipt:approve',
        'delivery:read', 'delivery:create', 'delivery:approve',
        'inventory:read'
      ];
    } else if (role === 'Staff') {
      defaultPermissions = [
        'product:read',
        'category:read',
        'warehouse:read',
        'partner:read',
        'receipt:read', 'receipt:create',
        'delivery:read', 'delivery:create',
        'inventory:read'
      ];
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'Staff',
      permissions: defaultPermissions
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: emailOrUsername?.toLowerCase() || '' },
          { username: emailOrUsername || '' }
        ]
      }
    });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Thông tin tài khoản hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user._id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};
