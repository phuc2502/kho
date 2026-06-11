import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Product } from './product.model.js';

/**
 * SoSerial — Số serial linh kiện điện tử
 * Ghi nhận từng đơn vị sản phẩm nhập kho, kèm hạn bảo hành.
 *
 * Columns:
 *   Ma_serial    — mã serial duy nhất ghi trên linh kiện
 *   Ma_san_pham  — FK → Products._id
 *   Han_bao_hanh — ngày hết hạn bảo hành (NULL = không theo dõi)
 *   Ngay_nhap    — ngày nhập kho
 *   So_phieu_nhap — mã phiếu nhập liên quan
 */
export const SoSerial = sequelize.define('SoSerial', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Ma_serial: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Mã số serial của linh kiện'
  },
  Ma_san_pham: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK → Products._id'
  },
  Han_bao_hanh: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Ngày hết hạn bảo hành'
  },
  Ngay_nhap: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Ngày nhập kho linh kiện này'
  },
  So_phieu_nhap: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Mã phiếu nhập kho liên quan'
  }
}, {
  tableName: 'SoSerial',
  timestamps: true,
  comment: 'Bảng số serial linh kiện điện tử (v2.0)'
});

// ── Quan hệ ──────────────────────────────────────────────────
SoSerial.belongsTo(Product, { foreignKey: 'Ma_san_pham', as: 'product' });
Product.hasMany(SoSerial,   { foreignKey: 'Ma_san_pham', as: 'serials'  });
