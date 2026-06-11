import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from './product.model.js';
import { User } from './user.model.js';
import { WarehouseNode } from './warehouseNode.model.js';
import { DeliveryRequest } from './deliveryRequest.model.js';
import { Customer } from './customer.model.js';

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
  // Tên khách hàng dạng văn bản tự do (theo thiết kế FOSITEK — không có bảng đối tác)
  tenKhachHang: {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM('preparing', 'draft', 'approved', 'shipping', 'completed', 'rejected', 'cancelled'),
    defaultValue: 'preparing'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Customer, key: '_id' }
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Thông tin ký nhận từ bên nhận hàng
  signerName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  signedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  signatureNote: {
    type: DataTypes.TEXT,
    allowNull: true
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
  requestId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: DeliveryRequest,
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
Delivery.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Delivery, { foreignKey: 'customerId', as: 'deliveries' });
Delivery.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
Delivery.hasMany(DeliveryItem, { foreignKey: 'deliveryId', as: 'items', onDelete: 'CASCADE' });
Delivery.belongsTo(DeliveryRequest, { foreignKey: 'requestId', as: 'fromRequest' });
DeliveryRequest.hasMany(Delivery, { foreignKey: 'requestId', as: 'deliveries' });

DeliveryItem.belongsTo(Delivery, { foreignKey: 'deliveryId', as: 'delivery' });
DeliveryItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
DeliveryItem.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
