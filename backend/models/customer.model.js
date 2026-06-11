import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Customer = sequelize.define('Customer', {
  _id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code:    { type: DataTypes.STRING(50),  allowNull: false, unique: true },
  name:    { type: DataTypes.STRING(200), allowNull: false },
  phone:   { type: DataTypes.STRING(30),  allowNull: true },
  address: { type: DataTypes.TEXT,        allowNull: true },
}, { timestamps: true });
