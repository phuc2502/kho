import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from './product.model.js';
import { User } from './user.model.js';
import { WarehouseNode } from './warehouseNode.model.js';

export const Receipt = sequelize.define('Receipt', {
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
  // Ghi chú lô hàng / đợt nhập (không có nhà cung cấp riêng theo thiết kế FOSITEK)
  ghiChu: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  status: {
    type: DataTypes.ENUM('draft', 'approved', 'completed', 'rejected'),
    defaultValue: 'draft'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
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
  }
}, {
  timestamps: true
});

export const ReceiptItem = sequelize.define('ReceiptItem', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  receiptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'receipt',
    references: {
      model: Receipt,
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
    allowNull: true,
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
Receipt.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
Receipt.hasMany(ReceiptItem, { foreignKey: 'receiptId', as: 'items', onDelete: 'CASCADE' });

ReceiptItem.belongsTo(Receipt, { foreignKey: 'receiptId', as: 'receipt' });
ReceiptItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
ReceiptItem.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
