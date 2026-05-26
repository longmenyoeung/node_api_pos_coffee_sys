const { Order, OrderItem, Product, Customer, Payment, sequelize } = require("../model");

// Helper: create full order with transaction
const createFullOrder = async (orderData) => {
    const { customer_id, items, payment_method, loyalty_points_to_use = 0 } = orderData;
    const transaction = await sequelize.transaction();

    try {
        let total = 0;
        const orderItemsData = [];

        // 1. Validate products and calculate subtotals
        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction });
            if (!product) throw new Error(`Product ${item.product_id} not found.`);
            const subtotal = product.price * item.quantity;
            total += subtotal;
            orderItemsData.push({
                product_id: item.product_id,
                quantity: item.quantity,
                customization_points: item.customization_points || null,
                subtotal,
            });
        }

        // 2. Apply loyalty discount
        let finalTotal = total;
        let pointsUsed = 0;
        if (loyalty_points_to_use > 0) {
            const customer = await Customer.findByPk(customer_id, { transaction });
            if (!customer) throw new Error("Customer not found.");
            if (customer.loyalty_points >= loyalty_points_to_use) {
                const discount = loyalty_points_to_use / 100;
                finalTotal = Math.max(0, total - discount);
                pointsUsed = loyalty_points_to_use;
            } else {
                throw new Error("Insufficient loyalty points");
            }
        }

        // 3. Create Order (this was missing)
        const order = await Order.create(
            {
                customer_id,
                total_amount: finalTotal,
                status: "Pending",
                timestamp: new Date(),
            },
            { transaction }
        );

        // 4. Create Order Items
        for (const itemData of orderItemsData) {
            await OrderItem.create(
                {
                    order_id: order.order_id,
                    ...itemData,
                },
                { transaction }
            );
        }

        // 5. Create Payment
        await Payment.create(
            {
                order_id: order.order_id,
                payment_method,
                amount: finalTotal,
                timestamp: new Date(),
            },
            { transaction }
        );

        // 6. Update customer loyalty points
        const customer = await Customer.findByPk(customer_id, { transaction });
        const pointsEarned = Math.floor(finalTotal);
        const newPoints = customer.loyalty_points - pointsUsed + pointsEarned;
        await customer.update({ loyalty_points: newPoints }, { transaction });

        // 7. Mark order as completed
        await order.update({ status: "Completed" }, { transaction });

        await transaction.commit();
        return order;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// ========== CONTROLLER FUNCTIONS ==========

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { customer_id, items, payment_method, loyalty_points_to_use } = req.body;
        if (!customer_id || !items || !items.length || !payment_method) {
            return res.status(400).json({
                error: "Missing required fields: customer_id, items, payment_method",
            });
        }
        const order = await createFullOrder({
            customer_id,
            items,
            payment_method,
            loyalty_points_to_use,
        });
        res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: Customer, attributes: ["first_name", "last_name", "loyalty_points"] },
                { model: OrderItem, include: [{ model: Product, attributes: ["name", "price"] }] },
                { model: Payment },
            ],
            order: [["timestamp", "DESC"]],
        });
        res.status(200).json({
            message: "Orders retrieved successfully",
            list: orders,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: Customer },
                { model: OrderItem, include: [Product] },
                { model: Payment },
            ],
        });
        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update order status (e.g., cancel)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Pending", "Completed", "Cancelled"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        await order.update({ status });
        res.json({ message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};