import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// VaiTro_Quyen — Quyền mặc định theo vai trò
export const RolePermission = sequelize.define('RolePermission', {
  roleCode: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  permissionCode: {
    type: DataTypes.STRING(80),
    allowNull: false
  }
}, {
  tableName: 'RolePermissions',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['roleCode', 'permissionCode'] }
  ]
});
