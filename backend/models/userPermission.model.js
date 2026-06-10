import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// NguoiDung_Quyen — Ghi đè quyền trực tiếp cho từng người dùng
// type = 'grant'  → cấp thêm quyền dù vai trò không có
// type = 'revoke' → thu hồi quyền dù vai trò mặc định có
export const UserPermission = sequelize.define('UserPermission', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permissionCode: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('grant', 'revoke'),
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(300),
    allowNull: true
  }
}, {
  tableName: 'UserPermissions',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['userId', 'permissionCode'] }
  ]
});
