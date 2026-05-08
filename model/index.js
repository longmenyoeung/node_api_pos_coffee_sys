const { FORCE } = require("sequelize/lib/index-hints");
const Category = require("./category.model");
const Product = require("./product.model");
const sequelize = require("../config/database");
const Order = require("./order.model");
const Customer = require("./customer.model");
const OrderItem = require("./orderItem.model");
const Inventory = require("./inventory.model");
const Payment = require("./payment.model");



// Define assosication 
Category.hasMany(Product,{foreignKey:'category_id'});
Product.belongsTo(Category, {foreignKey: 'category_id'});

Order.belongsTo(Customer, {foreignKey: 'customer_id'});
Customer.hasMany(Order, {foreignKey: 'customer_id'})

Order.hasMany(OrderItem, {foreignKey: 'order_id'})
OrderItem.belongsTo(Order, {foreignKey: 'order_id'})

Product.hasMany(OrderItem, {foreignKey: 'product_id'});
OrderItem.belongsTo(Product, {foreignKey: 'product_id'});

Order.hasOne(Payment, {foreignKey:'order_id'});
Payment.belongsTo(Order, {foreignKey:'order_id'});


// Automatically sync all tables on start
const syncDatabase  = async (force = false) => {
    try {
        await sequelize.authenticate();
        console.log("Connection to MySQL established");

        //force: true will drop tables if they exits (use only in development)
        await sequelize.sync({alter:true, force: false});
        console.log('Table synchronized migration completed.');
    } catch (error) {
        console.error("Database sync error: ", error);
        throw error;
    }
}

// Optional: define any many-to-many through table for inventory/product if needed
module.exports = {
    sequelize,
    syncDatabase,
    Category,
    Product,
    Customer,
    Order,
    OrderItem,
    Inventory,
    Payment
}