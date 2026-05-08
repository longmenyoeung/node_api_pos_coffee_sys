const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Inventory = sequelize.define('Inventory', {
    inventory_id : {
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    item_name : {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    stock_quantity : {
        type: DataTypes.DECIMAL(10,2),
        defaultValue: 0,
        validate: {
            min:0
        }
    },
    unit_of_measure : {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'unit'
    }
},{
    tableName : 'inventory',
    timestamps: false
})

module.exports = Inventory