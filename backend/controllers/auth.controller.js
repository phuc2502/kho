import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User } from '../models/user.model.js';
import { recordAudit } from '../utils/audit.helper.js';
import { getEffectivePermissions } from '../utils/permission.helper.js';
import { sendMail, buildResetPasswordEmail } from '../utils/mailer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

const generateToken = (id, rememberMe = false) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: rememberMe ? '30d' : '8h' });

// ——— Tạo tài khoản đầu tiên (mở, không cần auth) ———
export const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });
    if (userExists) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc Email đã được sử dụng' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'NhanVienKho',
      isActive: true
    });

    await recordAudit({
      action: 'auth.register',
      userId: user._id,
      username: user.username,
      entity: 'user',
      entityId: user._id,
      payload: { username: user.username, role: user.role }
    });

    const permissions = await getEffectivePermissions(user._id, user.role);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: permissions || [],
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// ——— Đăng nhập (email công ty hoặc username cũ) ———
export const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password, rememberMe } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: emailOrUsername?.toLowerCase().trim() || '' },
          { username: emailOrUsername || '' }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Thông tin tài khoản hoặc mật khẩu không chính xác.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        message: `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${minutesLeft} phút.`,
        locked: true,
        minutesLeft
      });
    }

    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      await user.update({ loginAttempts: 0, lockedUntil: null });

      await recordAudit({
        action: 'auth.login',
        userId: user._id,
        username: user.username,
        entity: 'user',
        entityId: user._id,
        payload: { role: user.role }
      });

      const permissions = await getEffectivePermissions(user._id, user.role);
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: permissions || [],
        token: generateToken(user._id, !!rememberMe)
      });
    } else {
      const newAttempts = (user.loginAttempts || 0) + 1;
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await user.update({ loginAttempts: newAttempts, lockedUntil: lockUntil });
        return res.status(423).json({
          message: `Tài khoản bị khóa ${LOCKOUT_MINUTES} phút do nhập sai mật khẩu ${MAX_LOGIN_ATTEMPTS} lần liên tiếp.`,
          locked: true,
          minutesLeft: LOCKOUT_MINUTES
        });
      }
      await user.update({ loginAttempts: newAttempts });
      const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
      return res.status(401).json({
        message: `Mật khẩu không chính xác. Còn ${remaining} lần thử trước khi tài khoản bị khóa.`
      });
    }
  } catch (error) {
    next(error);
  }
};

// ——— Lấy thông tin tài khoản hiện tại ———
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user._id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    const permissions = await getEffectivePermissions(user._id, user.role);
    res.json({ ...user.toJSON(), permissions: permissions || [] });
  } catch (error) {
    next(error);
  }
};

// ——— Đổi mật khẩu (người dùng tự đổi khi đã đăng nhập) ———
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findByPk(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    await recordAudit({
      action: 'auth.changePassword',
      userId: user._id,
      username: user.username,
      entity: 'user',
      entityId: user._id,
      payload: { note: 'Đổi mật khẩu thành công' }
    });

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    next(error);
  }
};

// ——— Quên mật khẩu — gửi link đặt lại qua email ———
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email công ty' });
    }

    // Luôn trả cùng một response — không lộ tài khoản tồn tại hay không
    const genericOk = {
      message: 'Nếu email hợp lệ, link đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (cả thư mục Spam).'
    };

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.isActive) return res.json(genericOk);

    // Sinh token ngẫu nhiên, lưu hash SHA-256
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 phút

    await user.update({ resetPasswordToken: hashedToken, resetPasswordExpires: expiresAt });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
    const { subject, html } = buildResetPasswordEmail({ fullName: user.fullName, resetUrl });

    // [THAY ĐỔI] Thêm logType/logUserId/logSentBy để ghi EmailLog tự động
    await sendMail({ to: user.email, subject, html, logType: 'forgotPassword', logUserId: user._id, logSentBy: 'system' });

    res.json(genericOk);
  } catch (error) {
    next(error);
  }
};

// ——— Đặt lại mật khẩu qua token (từ link email) ———
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Thiếu token hoặc mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: new Date() } // chưa hết hạn
      }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu.'
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.loginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    await recordAudit({
      action: 'auth.resetPassword',
      userId: user._id,
      username: user.username,
      entity: 'user',
      entityId: user._id,
      payload: { note: 'Đặt lại mật khẩu qua link email' }
    });

    res.json({ message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.' });
  } catch (error) {
    next(error);
  }
};
