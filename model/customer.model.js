const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Customer = sequelize.define('Customer', {
    customer_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name : {type: DataTypes.STRING(25), allowNull: false},
    last_name : {type: DataTypes.STRING(25), allowNull: false},
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // unique: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(50),
        allowNull:false
    },
    phone : {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    loyalty_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    image_url: {                    
        type: DataTypes.STRING(500),
        allowNull: true
    }

}, {
    tableName: 'customers',
    timestamps: true
})

module.exports = Customer