import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.model.js';
import { Product } from './product.model.js';
import { WarehouseNode } from './warehouseNode.model.js';

export const Stocktake = sequelize.define('Stocktake', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending_approval', 'counting', 'submitted', 'completed', 'rejected'),
    allowNull: false,
    defaultValue: 'pending_approval'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hasDiff: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  rejectNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'submittedByUser',
    references: {
      model: User,
      key: '_id'
    }
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
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
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'createdByUser',
    references: {
      model: User,
      key: '_id'
    }
  }
}, {
  timestamps: true
});

export const StocktakeItem = sequelize.define('StocktakeItem', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  stocktakeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'stocktake',
    references: {
      model: Stocktake,
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
  systemQty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  countedQty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  discrepancyQty: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  discrepancyCategory: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  discrepancyReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false
});

// Relationships
Stocktake.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
Stocktake.belongsTo(User, { foreignKey: 'approvedByUserId', as: 'approvedByUser' });
Stocktake.belongsTo(User, { foreignKey: 'submittedByUserId', as: 'submittedByUser' });
Stocktake.hasMany(StocktakeItem, { foreignKey: 'stocktakeId', as: 'items', onDelete: 'CASCADE' });

StocktakeItem.belongsTo(Stocktake, { foreignKey: 'stocktakeId', as: 'stocktake' });
StocktakeItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
StocktakeItem.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
