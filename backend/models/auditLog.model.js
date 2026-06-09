import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.model.js';

export const AuditLog = sequelize.define('AuditLog', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user',
    references: {
      model: User,
      key: '_id'
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('payload');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(val) {
      this.setDataValue('payload', val ? JSON.stringify(val) : null);
    }
  }
}, {
  timestamps: true,
  updatedAt: false // Audit logs are append-only
});

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
