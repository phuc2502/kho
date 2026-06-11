import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from './product.model.js';
import { User } from './user.model.js';
import { Customer } from './customer.model.js';

export const DeliveryRequest = sequelize.define('DeliveryRequest', {
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
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Customer, key: '_id' }
  },
  tenKhachHang: {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: ''
  },
  expectedDeliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'insufficient_stock', 'processing', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
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

export const DeliveryRequestItem = sequelize.define('DeliveryRequestItem', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deliveryRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'deliveryRequest',
    references: {
      model: DeliveryRequest,
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
    validate: { min: 1 }
  },
  priceEstimate: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: false
});

// Relationships
DeliveryRequest.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(DeliveryRequest, { foreignKey: 'customerId', as: 'deliveryRequests' });
DeliveryRequest.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
DeliveryRequest.hasMany(DeliveryRequestItem, { foreignKey: 'deliveryRequestId', as: 'items', onDelete: 'CASCADE' });

DeliveryRequestItem.belongsTo(DeliveryRequest, { foreignKey: 'deliveryRequestId', as: 'deliveryRequest' });
DeliveryRequestItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
