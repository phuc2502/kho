import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.model.js';
import { Stocktake } from './stocktake.model.js';

export const StocktakeMinutes = sequelize.define('StocktakeMinutes', {
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
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending_approval', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending_approval'
  },
  rejectNote: {
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

// Relationships
StocktakeMinutes.belongsTo(Stocktake, { foreignKey: 'stocktakeId', as: 'stocktake' });
StocktakeMinutes.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
StocktakeMinutes.belongsTo(User, { foreignKey: 'approvedByUserId', as: 'approvedByUser' });
Stocktake.hasMany(StocktakeMinutes, { foreignKey: 'stocktakeId', as: 'minutes' });
