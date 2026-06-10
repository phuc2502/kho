// [THÊM MỚI] — Bảng EmailLogs: nhật ký gửi email hệ thống
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const EmailLog = sequelize.define('EmailLog', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Loại email: tạo tài khoản / admin đặt lại MK / quên mật khẩu
  type: {
    type: DataTypes.ENUM('welcome', 'adminReset', 'forgotPassword'),
    allowNull: false,
    comment: 'welcome=tạo TK mới, adminReset=admin đặt lại MK, forgotPassword=quên mật khẩu'
  },

  // Email người nhận
  recipient: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Địa chỉ email người nhận'
  },

  // Tiêu đề email
  subject: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Subject của email'
  },

  // Kết quả gửi
  status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false,
    defaultValue: 'success',
    comment: 'success=gửi thành công, failed=gửi thất bại'
  },

  // Thông báo lỗi nếu thất bại
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả lỗi khi status=failed'
  },

  // User liên quan (nullable — user có thể bị xóa sau)
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK tới Users._id (nullable)'
  },

  // Ai trigger email này (email admin hoặc "system")
  sentBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Email/username của người kích hoạt (admin) hoặc "system"'
  }
}, {
  tableName: 'EmailLogs',
  timestamps: true,
  updatedAt: false  // Chỉ cần createdAt — log không bao giờ bị sửa
});
