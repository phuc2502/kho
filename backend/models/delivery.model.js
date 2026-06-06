import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from './product.model.js';
import { Partner } from './partner.model.js';
import { User } from './user.model.js';
import { WarehouseNode } from './warehouseNode.model.js';

export const Delivery = sequelize.define('Delivery', {
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
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'partner',
    references: {
      model: Partner,
      key: '_id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'approved', 'completed', 'rejected', 'cancelled'),
    defaultValue: 'draft'
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

export const DeliveryItem = sequelize.define('DeliveryItem', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deliveryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'delivery',
    references: {
      model: Delivery,
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
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
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
  }
}, {
  timestamps: false
});

// Setup relationships
Delivery.belongsTo(Partner, { foreignKey: 'partnerId', as: 'partner' });
Delivery.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
Delivery.hasMany(DeliveryItem, { foreignKey: 'deliveryId', as: 'items', onDelete: 'CASCADE' });

DeliveryItem.belongsTo(Delivery, { foreignKey: 'deliveryId', as: 'delivery' });
DeliveryItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
DeliveryItem.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
