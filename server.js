const express = require("express");
const path = require('path');   
const dotenv = require("dotenv");
const { syncDatabase } = require("./model");
const categoryRoute = require('./routes/category.route')
const productRoute = require('./routes/product.route')
const customerRoute = require('./routes/customer.route')
const orderRoute = require('./routes/order.route')
const userRoutes = require('./routes/user.route');
const inventoryRoute = require("./routes/inventory.route")
const khqrRoutes = require('./routes/khqr.route');
const cors = require('cors');
const paymentRoutes = require('./routes/payment.route');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3306;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware 
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api/categories', categoryRoute)
app.use('/api/products', productRoute)
app.use('/api/customers', customerRoute)
app.use('/api/orders', orderRoute)
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoute);
app.use('/api/khqr', khqrRoutes);
app.use('/api', paymentRoutes);



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
