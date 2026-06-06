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
  } catch (error) {
    console.error(`Error connection: ${error.message}`);
    process.exit(1);
  }
};
