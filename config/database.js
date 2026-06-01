const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
if (process.env.DATABASE_URL) {
    // Production (Render) – use TiDB Cloud
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false   // required for TiDB Cloud
            }
        },
        logging: false
    });
} else {
    // Local development (fallback to your local MySQL)
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: 'mysql',
            logging: false
        }
    );
}

module.exports = sequelize;