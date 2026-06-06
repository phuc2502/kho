import { User } from '../models/user.model.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Protect the last Admin from demoting themselves or getting deleted
    if (user.role === 'Admin' && role !== 'Admin') {
      const adminCount = await User.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Hệ thống cần ít nhất một tài khoản Admin' });
      }
    }

    if (role) user.role = role;
    if (permissions) user.permissions = permissions;

    await user.save();

    res.json({
      message: 'Cập nhật thông tin phân quyền thành công',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'Admin') {
      const adminCount = await User.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Không thể xóa tài khoản Admin duy nhất của hệ thống' });
      }
    }

    await User.destroy({ where: { _id: userId } });
    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    next(error);
  }
};
