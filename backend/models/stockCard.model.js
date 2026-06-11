import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from './product.model.js';
import { WarehouseNode } from './warehouseNode.model.js';
import { User } from './user.model.js';

export const StockCard = sequelize.define('StockCard', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Mã số thẻ kho tự động sinh'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product',
    references: {
      model: Product,
      key: '_id'
    },
    comment: 'FK → Products._id'
  },
  warehouseNodeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'warehouseNode',
    references: {
      model: WarehouseNode,
      key: '_id'
    },
    comment: 'FK → WarehouseNodes._id'
  },
  refCode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Mã chứng từ tham chiếu (phiếu nhập, xuất, điều chỉnh, hoặc MANUAL)'
  },
  type: {
    type: DataTypes.ENUM('import', 'export', 'adjustment', 'manual'),
    allowNull: false,
    defaultValue: 'manual',
    comment: 'Loại biến động: import (nhập), export (xuất), adjustment (kiểm kê/điều chỉnh), manual (thủ công)'
  },
  qtyBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Số lượng sản phẩm trước biến động'
  },
  qtyChange: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Số lượng biến động (dương = tăng, âm = giảm)'
  },
  qtyAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Số lượng sản phẩm sau biến động'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ghi chú lý do biến động'
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Ngày giờ ghi nhận biến động vào thẻ kho'
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'createdByUser',
    references: {
      model: User,
      key: '_id'
    },
    comment: 'FK → Users._id (Người ghi nhận giao dịch)'
  }
}, {
  tableName: 'StockCards',
  timestamps: true,
  comment: 'Bảng Thẻ kho (Stock Card) lưu vết biến động tồn kho (v2.0)'
});

// ── Thiết lập mối quan hệ ──────────────────────────────────
StockCard.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(StockCard, { foreignKey: 'productId', as: 'stockCards' });

StockCard.belongsTo(WarehouseNode, { foreignKey: 'warehouseNodeId', as: 'warehouseNode' });
WarehouseNode.hasMany(StockCard, { foreignKey: 'warehouseNodeId', as: 'stockCards' });

StockCard.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
User.hasMany(StockCard, { foreignKey: 'createdByUserId', as: 'stockCards' });
