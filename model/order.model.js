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
        defaultValue:DataTypes.NOW
    },
    customer_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'customers',
            key: 'customer_id'
        }
    },
    total_amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate : {
            min: 0
        }
    },
    status:{
        type: DataTypes.ENUM("Pending", "Completed", "Cancelled"),
        defaultValue: 'Pending'
    }
}, {
    tableName: 'orders',
    timestamps: false
})

module.exports = Order