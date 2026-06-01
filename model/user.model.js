const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define('User', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: false,
        validate: { isEmail: true }
    },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
    loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
    image_url: { type: DataTypes.STRING(500), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'users', timestamps: true });

module.exports = User;