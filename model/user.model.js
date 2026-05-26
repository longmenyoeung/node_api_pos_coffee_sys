const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define('User', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    role: {
        type: DataTypes.ENUM('customer', 'cashier', 'manager', 'admin'),
        defaultValue: 'customer'
    },
    loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'users', timestamps: true });

module.exports = User;