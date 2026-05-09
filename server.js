const express = require("express");
const dotenv = require("dotenv");
const { syncDatabase } = require("./model");
const categoryRoute = require('./routes/category.route')
const productRoute = require('./routes/product.route')
const customerRoute = require('./routes/customer.route')
const orderRoute = require('./routes/order.route')

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3306;

// Middleware 
app.use(express.json());
app.use('/api/categories', categoryRoute)
app.use('/api/products', productRoute)
app.use('/api/customers', customerRoute)
app.use('/api/orders', orderRoute)



syncDatabase()
    .then(() => {
        app.listen(port,() => {
            console.log(`Server running on http://localhost:${port}`)
        });
    })
    .catch((err) => {
        console.error("Failed to sync database:", err);
        process.exit(1);
    })
