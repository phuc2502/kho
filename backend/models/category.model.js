import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Category = sequelize.define('Category', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});
