import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const WarehouseNode = sequelize.define('WarehouseNode', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('warehouse', 'zone', 'aisle', 'rack', 'bin'),
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent',
    references: {
      model: 'WarehouseNodes',
      key: '_id'
    }
  }
}, {
  timestamps: true
});

WarehouseNode.belongsTo(WarehouseNode, { foreignKey: 'parentId', as: 'parent' });
WarehouseNode.hasMany(WarehouseNode, { foreignKey: 'parentId', as: 'children' });

// Quan hệ với UserWarehouse được thiết lập ở userWarehouse.model.js để tránh circular import
