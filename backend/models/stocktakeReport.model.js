import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.model.js';
import { Stocktake } from './stocktake.model.js';
import { Adjustment } from './adjustment.model.js';

export const StocktakeReport = sequelize.define('StocktakeReport', {
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
  adjustmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'adjustment',
    references: {
      model: Adjustment,
      key: '_id'
    }
  },
  totalItems: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  matchedItems: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  discrepancyItems: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  totalShortage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  totalSurplus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  generatedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'generatedByUser',
    references: {
      model: User,
      key: '_id'
    }
  }
}, {
  timestamps: true
});

// Relationships
StocktakeReport.belongsTo(Stocktake, { foreignKey: 'stocktakeId', as: 'stocktake' });
StocktakeReport.belongsTo(User, { foreignKey: 'generatedByUserId', as: 'generatedByUser' });
StocktakeReport.belongsTo(Adjustment, { foreignKey: 'adjustmentId', as: 'adjustment' });
Stocktake.hasOne(StocktakeReport, { foreignKey: 'stocktakeId', as: 'report' });
