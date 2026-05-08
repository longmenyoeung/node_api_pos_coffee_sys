const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const OrderItem = sequelize.define('OrderItem' , {
    item_id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model:'orders',
            key: 'order_id'
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'product_id'
        }
    },
    quantity: {
        type:DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    customerzation_points : {
        type: DataTypes.TEXT,
        allowNull: true
    },
    subtotal : {
        type : DataTypes.DECIMAL(10,2),
        allowNull:false
    }
},{
    tableName: 'order_items',
    timestamps: false
})

module.exports  = OrderItem