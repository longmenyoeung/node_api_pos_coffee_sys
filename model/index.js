const Category = require("./category.model");
const Product = require("./product.model");
const sequelize = require("../config/database");
const Order = require("./order.model");
const OrderItem = require("./orderItem.model");
const Inventory = require("./inventory.model");
const Payment = require("./payment.model");
const User = require("./user.model");

// Associations
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Order belongs to User (instead of Customer)
Order.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Order, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Order.hasOne(Payment, { foreignKey: 'order_id' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

// Sync function
const syncDatabase = async (force = false) => {
    try {
        await sequelize.authenticate();
        console.log("Connection to MySQL established");
        await sequelize.sync({ alter: true, force: false });
        console.log('Table synchronized migration completed.');
    } catch (error) {
        console.error("Database sync error: ", error);
        throw error;
    }
};

module.exports = {
    sequelize,
    syncDatabase,
    Category,
    Product,
    Order,
    OrderItem,
    Inventory,
    Payment,
    User
};