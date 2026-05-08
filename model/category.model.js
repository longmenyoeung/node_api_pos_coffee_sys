const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Category  = sequelize.define('Category', {
    category_id :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category_name :{
        type: DataTypes.STRING(50),
        allowNull: false,
        // validate:{
        //     isIn: [["Espresso", "Tea", "Pastry", "Coffee",]]
        // }
    }
},{
    tableName: 'product_categories',
    timestamps: false
})

module.exports = Category;