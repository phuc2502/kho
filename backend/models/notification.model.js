import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.model.js';

// ThongBao — lưu thông báo nội bộ cho từng người dùng
export const Notification = sequelize.define('Notification', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userId',
    references: {
      model: User,
      key: '_id'
    },
    comment: 'Người nhận thông báo'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Tiêu đề thông báo ngắn gọn'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Nội dung chi tiết'
  },
  type: {
    type: DataTypes.ENUM(
      'receipt',
      'delivery_request',
      'delivery',
      'adjustment',
      'incident',
      'stocktake',
      'system'
    ),
    allowNull: false,
    defaultValue: 'system',
    comment: 'Loại thông báo — dùng để hiển thị icon và điều hướng'
  },
  refId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID tham chiếu đến bản ghi gốc (phiếu nhập, phiếu xuất, ...) để click xem chi tiết'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Trạng thái đã đọc'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isRead'] },
    { fields: ['userId', 'createdAt'] }
  ]
});

// Relationships
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
