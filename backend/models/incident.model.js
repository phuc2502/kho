import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.model.js';
import { Product } from './product.model.js';

export const Incident = sequelize.define('Incident', {
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
  type: {
    type: DataTypes.ENUM('shortage', 'damage', 'wrong_product', 'expired', 'other'),
    allowNull: false
  },
  refType: {
    type: DataTypes.ENUM('receipt', 'delivery'),
    allowNull: true
  },
  refId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  action: {
    type: DataTypes.ENUM('reorder', 'dispose', 'return_supplier', 'write_off', 'pending'),
    defaultValue: 'pending'
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
  }
}, {
  timestamps: true
});

export const IncidentItem = sequelize.define('IncidentItem', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  incidentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'incident',
    references: {
      model: Incident,
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  timestamps: false
});

// Relationships
Incident.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
Incident.hasMany(IncidentItem, { foreignKey: 'incidentId', as: 'items', onDelete: 'CASCADE' });

IncidentItem.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });
IncidentItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
