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
  // hang_loi: hàng không đạt chất lượng (QC lập); hang_thieu: hàng thiếu số lượng (NhanVienKho lập)
  type: {
    type: DataTypes.ENUM('hang_loi', 'hang_thieu'),
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
    type: DataTypes.ENUM('pending_approval', 'approved', 'rejected'),
    defaultValue: 'pending_approval'
  },
  rejectNote: {
    type: DataTypes.TEXT,
    allowNull: true
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
  },
  // Nguyên nhân lỗi / mô tả chi tiết (dùng cho hang_loi)
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false
});

// Relationships
Incident.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });
Incident.belongsTo(User, { foreignKey: 'approvedByUserId', as: 'approvedByUser' });
Incident.hasMany(IncidentItem, { foreignKey: 'incidentId', as: 'items', onDelete: 'CASCADE' });

IncidentItem.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });
IncidentItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
