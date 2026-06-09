import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'DB_KHO';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;

export const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false
  }
);

export const connectDB = async () => {
  try {
    // Ensure database exists
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();

    await sequelize.authenticate();
    console.log('MySQL Connected successfully.');

    // Import all models to register them (order matters for FK references)
    await import('../models/user.model.js');
    await import('../models/category.model.js');
    await import('../models/product.model.js');
    await import('../models/warehouseNode.model.js');
    await import('../models/partner.model.js');
    await import('../models/inventory.model.js');
    await import('../models/receipt.model.js');
    await import('../models/delivery.model.js');
    await import('../models/auditLog.model.js');
    await import('../models/stocktake.model.js');
    await import('../models/adjustment.model.js');
    await import('../models/incident.model.js');

    // Sync all models (alter: safe update without data loss)
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');
  } catch (error) {
    console.error(`Error connection: ${error.message}`);
    process.exit(1);
  }
};
