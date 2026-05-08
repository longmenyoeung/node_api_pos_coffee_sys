const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { allow } = require("joi");


const Payment = sequelize.define('Payment',{
    payment_id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'order_id'
        }
    },
    payment_method:{
        type:DataTypes.ENUM("Credit Card", "ABA", "WING", "ACELEDA", "BAKONG"),
        allowNull:false
    },
    amount: {
        type:DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    timstamp:{
        type:DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
},{
    tableName: 'payments',
    timstamp: false
});

module.exports = Payment