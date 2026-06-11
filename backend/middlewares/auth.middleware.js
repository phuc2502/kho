import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { UserWarehouse } from '../models/userWarehouse.model.js';
import { getEffectivePermissions } from '../utils/permission.helper.js';

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

    // Kiểm tra tài khoản còn hoạt động không
    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' });
    }

    // Tính toán quyền hiệu lực (null = Admin toàn quyền, array = danh sách quyền)
    const effectivePermissions = await getEffectivePermissions(user._id, user.role);

    // Lấy danh sách kho được phân công (Admin không cần — toàn quyền)
    let assignedWarehouseIds = null; // null = Admin (toàn bộ kho)
    if (user.role !== 'Admin') {
      const assignments = await UserWarehouse.findAll({ where: { userId: user._id } });
      assignedWarehouseIds = assignments.map(a => a.warehouseNodeId);
    }

    // Lưu vào req.user dưới dạng plain object để dễ thao tác
    req.user = user.toJSON();
    req.user.effectivePermissions = effectivePermissions;
    req.user.assignedWarehouseIds = assignedWarehouseIds; // null=admin(tất cả), []=[]=chưa phân công

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

/**
 * Kiểm tra quyền tại route-level.
 * Admin (role = 'Admin') tự động bypass toàn bộ kiểm tra.
 * Các vai trò khác kiểm tra dựa trên effectivePermissions đã tính toán.
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực người dùng' });
    }

    // Admin bypass toàn bộ
    if (req.user.role === 'Admin') {
      return next();
    }

    // Kiểm tra trong danh sách quyền hiệu lực
    if (req.user.effectivePermissions && req.user.effectivePermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      message: `Bạn không có quyền thực hiện thao tác này (Yêu cầu quyền: ${permission})`
    });
  };
};
