import { Op } from 'sequelize';
import { User } from '../models/user.model.js';
import { UserPermission } from '../models/userPermission.model.js';
import { UserWarehouse } from '../models/userWarehouse.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { PERMISSION_CATALOG, ROLE_DEFAULTS, getEffectivePermissions } from '../utils/permission.helper.js';
import { recordAudit } from '../utils/audit.helper.js';
import { generatePassword, sendMail, buildWelcomeEmail, buildAdminResetEmail } from '../utils/mailer.js';

const VALID_ROLES = ['Admin', 'QuanLyKho', 'KeToanKho', 'NhanVienKho', 'QC', 'Sale'];

// ——— Danh sách tất cả tài khoản ———
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
      order: [['_id', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// ——— Đếm số tài khoản đang yêu cầu cấp lại MK ———
export const getResetRequestsCount = async (req, res, next) => {
  try {
    const count = await User.count({ where: { passwordResetRequested: true, isActive: true } });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

// ——— Admin tạo tài khoản mới — password tự sinh + gửi email ———
export const createUser = async (req, res, next) => {
  try {
    const { email, role, fullName, phone } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email công ty của nhân viên' });
    }

    const emailNormalized = email.toLowerCase().trim();

    const exists = await User.findOne({
      where: { [Op.or]: [{ email: emailNormalized }, { username: emailNormalized }] }
    });
    if (exists) {
      return res.status(400).json({ message: 'Email này đã được đăng ký trong hệ thống' });
    }

    const userRole = VALID_ROLES.includes(role) ? role : 'NhanVienKho';

    // Tự động sinh mật khẩu — không nhận từ client
    const plainPassword = generatePassword();

    const user = await User.create({
      username: emailNormalized,  // dùng email làm username
      email: emailNormalized,
      password: plainPassword,    // model hook sẽ hash trước khi lưu
      role: userRole,
      fullName: fullName?.trim() || null,
      phone: phone?.trim() || null,
      isActive: true,
      mustChangePassword: true,   // bắt buộc đổi MK ngay khi đăng nhập lần đầu
      createdBy: req.user._id
    });

    // Gửi email thông tin đăng nhập
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const { subject, html } = buildWelcomeEmail({
      fullName: user.fullName,
      email: emailNormalized,
      password: plainPassword,
      loginUrl
    });

    let emailSent = false;
    try {
      // [THAY ĐỔI] Thêm logType/logUserId/logSentBy để ghi EmailLog tự động
      await sendMail({ to: emailNormalized, subject, html, logType: 'welcome', logUserId: user._id, logSentBy: req.user?.email });
      emailSent = true;
    } catch (mailErr) {
      console.warn('[createUser] Không thể gửi email chào mừng:', mailErr.message);
    }

    await recordAudit({
      action: 'user.create',
      userId: req.user._id,
      username: req.user.username,
      entity: 'user',
      entityId: user._id,
      payload: { username: user.username, fullName: user.fullName, role: user.role, createdBy: req.user.username, emailSent }
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      emailSent
    });
  } catch (error) {
    next(error);
  }
};

// ——— Cập nhật vai trò / hồ sơ tài khoản ———
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, fullName, phone } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    // Bảo vệ Admin cuối cùng
    if (user.role === 'Admin' && role && role !== 'Admin') {
      const adminCount = await User.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Hệ thống cần ít nhất một tài khoản Admin' });
      }
    }

    if (role !== undefined && VALID_ROLES.includes(role)) user.role = role;
    if (fullName !== undefined) user.fullName = fullName?.trim() || null;
    if (phone !== undefined) user.phone = phone?.trim() || null;

    await user.save();

    await recordAudit({
      action: 'user.update',
      userId: req.user._id,
      username: req.user.username,
      entity: 'user',
      entityId: user._id,
      payload: { targetUser: user.username, targetFullName: user.fullName, role: user.role }
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

// ——— Admin đặt lại mật khẩu nhân viên — sinh mới + gửi email ———
export const adminResetPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    // Không cho phép Admin reset password của Admin khác (trừ chính mình)
    if (user.role === 'Admin' && req.user._id !== user._id) {
      return res.status(403).json({ message: 'Không thể đặt lại mật khẩu của tài khoản Admin khác' });
    }

    const plainPassword = generatePassword();
    user.password = plainPassword;
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.mustChangePassword = true;        // bắt buộc đổi MK sau khi admin reset
    user.passwordResetRequested = false;   // xóa cờ yêu cầu (đã được xử lý)
    await user.save();

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const { subject, html } = buildAdminResetEmail({
      fullName: user.fullName,
      email: user.email,
      password: plainPassword,
      loginUrl
    });

    let emailSent = false;
    try {
      // [THAY ĐỔI] Thêm logType/logUserId/logSentBy để ghi EmailLog tự động
      await sendMail({ to: user.email, subject, html, logType: 'adminReset', logUserId: user._id, logSentBy: req.user?.email });
      emailSent = true;
    } catch (mailErr) {
      console.warn('[adminResetPassword] Không thể gửi email:', mailErr.message);
    }

    await recordAudit({
      action: 'user.adminResetPassword',
      userId: req.user._id,
      username: req.user.username,
      entity: 'user',
      entityId: user._id,
      payload: { targetUser: user.username, resetBy: req.user.username, emailSent }
    });

    res.json({
      message: emailSent
        ? `Đã đặt lại mật khẩu và gửi thông báo tới ${user.email}`
        : `Đã đặt lại mật khẩu (email chưa được gửi — kiểm tra cấu hình SMTP)`,
      emailSent
    });
  } catch (error) {
    next(error);
  }
};

// ——— Vô hiệu hóa tài khoản (bắt buộc có lý do) ———
export const deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do vô hiệu hóa tài khoản' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    if (!user.isActive) {
      return res.status(400).json({ message: 'Tài khoản này đã bị vô hiệu hóa rồi' });
    }

    if (user.role === 'Admin') {
      const activeAdminCount = await User.count({ where: { role: 'Admin', isActive: true } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: 'Không thể vô hiệu hóa tài khoản Admin duy nhất đang hoạt động' });
      }
    }

    await user.update({
      isActive: false,
      deactivationReason: reason.trim(),
      deactivatedBy: req.user._id,
      deactivatedAt: new Date()
    });

    await recordAudit({
      action: 'user.deactivate',
      userId: req.user._id,
      username: req.user.username,
      entity: 'user',
      entityId: user._id,
      payload: { targetUser: user.username, targetFullName: user.fullName, reason: reason.trim(), deactivatedBy: req.user.username }
    });

    res.json({
      message: `Đã vô hiệu hóa tài khoản "${user.username}"`,
      _id: user._id,
      isActive: false,
      deactivationReason: reason.trim(),
      deactivatedAt: user.deactivatedAt
    });
  } catch (error) {
    next(error);
  }
};

// ——— Kích hoạt lại tài khoản ———
export const reactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    if (user.isActive) {
      return res.status(400).json({ message: 'Tài khoản này đang hoạt động bình thường' });
    }

    await user.update({
      isActive: true,
      deactivationReason: null,
      deactivatedBy: null,
      deactivatedAt: null
    });

    await recordAudit({
      action: 'user.reactivate',
      userId: req.user._id,
      username: req.user.username,
      entity: 'user',
      entityId: user._id,
      payload: { targetUser: user.username, targetFullName: user.fullName, reactivatedBy: req.user.username }
    });

    res.json({ message: `Đã kích hoạt lại tài khoản "${user.username}"`, _id: user._id, isActive: true });
  } catch (error) {
    next(error);
  }
};

// ——— Kho phụ trách ———
export const getUserWarehouses = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, { attributes: ['_id', 'username', 'fullName', 'role'] });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    if (user.role === 'Admin') return res.json({ userId: user._id, isAdmin: true, warehouses: [] });

    const assignments = await UserWarehouse.findAll({
      where: { userId },
      include: [{ model: WarehouseNode, as: 'warehouseNode', attributes: ['_id', 'name', 'code', 'type'] }]
    });

    res.json({
      userId: user._id, isAdmin: false,
      warehouses: assignments.map(a => ({
        warehouseNodeId: a.warehouseNodeId,
        name: a.warehouseNode?.name || '—',
        code: a.warehouseNode?.code || '—',
        assignedAt: a.createdAt
      }))
    });
  } catch (error) { next(error); }
};

export const assignUserWarehouse = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { warehouseNodeId } = req.body;
    if (!warehouseNodeId) return res.status(400).json({ message: 'Vui lòng chọn kho cần phân công' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    const warehouse = await WarehouseNode.findByPk(warehouseNodeId);
    if (!warehouse || warehouse.type !== 'warehouse') {
      return res.status(400).json({ message: 'Kho không hợp lệ (phải là node cấp "warehouse")' });
    }

    const existing = await UserWarehouse.findOne({ where: { userId, warehouseNodeId } });
    if (existing) return res.status(400).json({ message: `Tài khoản đã được phân công kho "${warehouse.name}" rồi` });

    await UserWarehouse.create({ userId, warehouseNodeId, assignedBy: req.user._id });

    await recordAudit({
      action: 'user.assignWarehouse', userId: req.user._id, username: req.user.username,
      entity: 'user', entityId: Number(userId),
      payload: { targetUser: user.username, targetFullName: user.fullName, warehouse: warehouse.name }
    });

    res.status(201).json({ message: `Đã phân công kho "${warehouse.name}" cho tài khoản "${user.username}"` });
  } catch (error) { next(error); }
};

export const removeUserWarehouse = async (req, res, next) => {
  try {
    const { userId, warehouseNodeId } = req.params;
    const assignment = await UserWarehouse.findOne({ where: { userId, warehouseNodeId } });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy phân công này' });
    await assignment.destroy();

    await recordAudit({
      action: 'user.removeWarehouse', userId: req.user._id, username: req.user.username,
      entity: 'user', entityId: Number(userId),
      payload: { warehouseNodeId: Number(warehouseNodeId) }
    });

    res.json({ message: 'Đã xóa phân công kho' });
  } catch (error) { next(error); }
};

// ——— Phân quyền chi tiết ———
export const getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, { attributes: ['_id', 'username', 'fullName', 'role', 'isActive'] });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    if (user.role === 'Admin') {
      return res.json({
        userId: user._id, username: user.username, fullName: user.fullName, role: user.role,
        isAdmin: true, roleDefaults: [], granted: [], revoked: [], effective: null,
        catalog: PERMISSION_CATALOG
      });
    }

    const roleDefaults = ROLE_DEFAULTS[user.role] || [];
    const overrides = await UserPermission.findAll({ where: { userId } });
    const granted = overrides.filter(o => o.type === 'grant').map(o => o.permissionCode);
    const revoked = overrides.filter(o => o.type === 'revoke').map(o => o.permissionCode);
    const effective = await getEffectivePermissions(user._id, user.role);

    res.json({
      userId: user._id, username: user.username, fullName: user.fullName, role: user.role,
      isAdmin: false, roleDefaults, granted, revoked, effective, catalog: PERMISSION_CATALOG
    });
  } catch (error) { next(error); }
};

export const saveUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { grants = [], revokes = [] } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    if (user.role === 'Admin') {
      return res.status(400).json({ message: 'Tài khoản Admin có toàn quyền, không cần cấu hình phân quyền' });
    }

    // Bảo vệ: không cho grant/revoke quyền admin-only
    const ADMIN_ONLY = new Set(['audit:read', 'user:manage', 'emaillog:read']);
    const safeGrants = grants.filter(c => !ADMIN_ONLY.has(c));
    const safeRevokes = revokes.filter(c => !ADMIN_ONLY.has(c));

    await UserPermission.destroy({ where: { userId } });
    for (const code of safeGrants) await UserPermission.create({ userId, permissionCode: code, type: 'grant' });
    for (const code of safeRevokes) await UserPermission.create({ userId, permissionCode: code, type: 'revoke' });

    await recordAudit({
      action: 'user.updatePermissions',
      userId: req.user._id, username: req.user.username, entity: 'user', entityId: user._id,
      payload: { targetUser: user.username, grantCount: safeGrants.length, revokeCount: safeRevokes.length }
    });

    const effective = await getEffectivePermissions(user._id, user.role);
    res.json({ message: 'Cập nhật phân quyền thành công', effective });
  } catch (error) { next(error); }
};

export const resetUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    await UserPermission.destroy({ where: { userId } });

    await recordAudit({
      action: 'user.resetPermissions',
      userId: req.user._id, username: req.user.username, entity: 'user', entityId: user._id,
      payload: { targetUser: user.username, note: 'Reset về quyền mặc định của vai trò' }
    });

    res.json({ message: `Đã reset về quyền mặc định của vai trò ${user.role}`, effective: ROLE_DEFAULTS[user.role] || [] });
  } catch (error) { next(error); }
};
