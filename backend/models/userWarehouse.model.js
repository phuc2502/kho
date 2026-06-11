import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { WarehouseNode } from './warehouseNode.model.js';

// NguoiDung_Kho — Phân công người dùng phụ trách kho
// Chỉ assign với WarehouseNode type='warehouse' (cấp kho cao nhất)
export const UserWarehouse = sequelize.define('UserWarehouse', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: '_id' }
  },
  warehouseNodeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'WarehouseNodes', key: '_id' }
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Admin nào đã phân công (null nếu tự tạo)'
  }
}, {
  tableName: 'UserWarehouses',
  timestamps: true,
  updatedAt: false,
  indexes: [{ unique: true, fields: ['userId', 'warehouseNodeId'] }]
});

// Associations
UserWarehouse.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
WarehouseNode.hasMany(UserWarehouse, { foreignKey: 'warehouseNodeId', as: 'userAssignments' });
