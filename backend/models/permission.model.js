import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// Quyen — Danh mục quyền hạn của hệ thống
export const Permission = sequelize.define('Permission', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  group: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'Permissions',
  timestamps: false
});
