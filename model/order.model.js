const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define('Order', {
    order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    user_id: {                       
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',            
            key: 'user_id'
        }
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    status: {
        type: DataTypes.ENUM("Pending", "Completed", "Cancelled", "Pending Payment"),
        defaultValue: "Pending"
    },
    khqr_md5: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
    },
    expires_at: {
    type: DataTypes.DATE,
    allowNull: true
}
}, {
    tableName: 'orders',
    timestamps: false
});

module.exports = Order;