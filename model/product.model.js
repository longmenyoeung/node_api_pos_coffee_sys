const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Product = sequelize.define('Product', {
    product_id :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name :{
        type: DataTypes.STRING,
        allowNull: false
    },
    description:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    category_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: "product_categories",
            key: "category_id"
        }
    },
    price:{
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate :{
            min: 0
        }
    },
    is_active:{
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    image_url: {                   
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
    }
},{
    tableName: "products",
    timestamps: false
})

module.exports = Product