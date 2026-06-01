const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: false,
        dialectOptions: process.env.DB_SSL === 'true' ? {
            ssl: { rejectUnauthorized: false }
        } : {},
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
    }
);

module.exports = sequelize;