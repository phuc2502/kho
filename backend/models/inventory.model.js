import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from './product.model.js';
import { WarehouseNode } from './warehouseNode.model.js';

export const Inventory = sequelize.define('Inventory', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product',
    references: {
      model: Product,
      key: '_id'
    }
  },
  warehouseNodeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'warehouseNode',
    references: {
      model: WarehouseNode,
      key: '_id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  minStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['product', 'warehouseNode']
    }
  ]
});

Inventory.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Inventory.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
Product.hasMany(Inventory, { foreignKey: 'productId', as: 'inventories' });
WarehouseNode.hasMany(Inventory, { foreignKey: 'warehouseNodeId', as: 'inventories' });
