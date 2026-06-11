import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import bcrypt from 'bcryptjs';

// TaiKhoan + NguoiDung — kết hợp tài khoản đăng nhập và hồ sơ nhân viên
// Phân quyền được quản lý qua RolePermission (vai trò) và UserPermission (ghi đè cá nhân)
export const User = sequelize.define('User', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // ——— Thông tin đăng nhập (TaiKhoan) ———
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Admin', 'QuanLyKho', 'KeToanKho', 'NhanVienKho', 'QC', 'Sale'),
    defaultValue: 'NhanVienKho'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // ——— Hồ sơ nhân viên (NguoiDung) ———
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Chức vụ hiển thị — chỉ mang tính mô tả, phân quyền thực sự do RBAC quyết định'
  },

  // ——— Bảo mật đăng nhập ———
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // ——— Audit ———
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID Admin đã tạo tài khoản này'
  },

  // ——— Yêu cầu cấp lại mật khẩu (quên mật khẩu — chờ admin xử lý) ———
  passwordResetRequested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true = nhân viên đã gửi yêu cầu quên MK, chờ admin đặt lại'
  },

  // ——— Buộc đổi mật khẩu ———
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true = bắt buộc đổi MK ngay khi đăng nhập (sau khi admin tạo TK hoặc reset MK)'
  },

  // ——— Đặt lại mật khẩu (forgot password flow) ———
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'SHA-256 hash của token đặt lại mật khẩu'
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời điểm hết hạn token (60 phút)'
  },

  // ——— Vô hiệu hóa (không bao giờ xóa tài khoản) ———
  deactivationReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Lý do vô hiệu hóa — bắt buộc khi isActive=false'
  },
  deactivatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID Admin đã vô hiệu hóa tài khoản'
  },
  deactivatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời điểm vô hiệu hóa'
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
