import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.model.js';
import { Product } from './product.model.js';
import { WarehouseNode } from './warehouseNode.model.js';

export const Adjustment = sequelize.define('Adjustment', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  reason: {
    type: DataTypes.ENUM(
      'count_correction',
      'damaged',
      'expired',
      'lost',
      'found',
      'return_supplier',
      'other'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'completed'),
    defaultValue: 'draft'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'createdByUser',
    references: {
      model: User,
      key: '_id'
    }
  },
  approvedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'approvedByUser',
    references: {
      model: User,
      key: '_id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

export const AdjustmentItem = sequelize.define('AdjustmentItem', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adjustmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'adjustment',
    references: {
      model: Adjustment,
      key: '_id'
    },
    onDelete: 'CASCADE'
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
  // Positive = increase stock, Negative = decrease stock
  delta: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false
});

// Relationships
Adjustment.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
Adjustment.belongsTo(User, { foreignKey: 'approvedByUserId', as: 'approvedByUser' });
Adjustment.hasMany(AdjustmentItem, { foreignKey: 'adjustmentId', as: 'items', onDelete: 'CASCADE' });

AdjustmentItem.belongsTo(Adjustment, { foreignKey: 'adjustmentId', as: 'adjustment' });
AdjustmentItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
AdjustmentItem.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
