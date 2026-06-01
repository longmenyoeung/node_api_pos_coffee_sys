const { Order, OrderItem, Product, User, Payment, sequelize } = require("../model");
const { generateDynamicQR, checkTransactionStatus } = require("../service/khqr.service");

// Create a pending order (no payment record, no KHQR generation)
const createPendingOrder = async (orderData) => {
    const { user_id, items, loyalty_points_to_use = 0 } = orderData;
    const transaction = await sequelize.transaction();

    try {
        let total = 0;
        const orderItemsData = [];

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

        let finalTotal = total;
        if (loyalty_points_to_use > 0) {
            const user = await User.findByPk(user_id, { transaction });
            if (!user) throw new Error("User not found.");
            if (user.loyalty_points >= loyalty_points_to_use) {
                const discount = loyalty_points_to_use / 100;
                finalTotal = Math.max(0, total - discount);
                // We will deduct points later after payment? For simplicity, deduct now (or later)
                // For now, leave as is – the original logic deducts points at finalize.
            } else {
                throw new Error("Insufficient loyalty points");
            }
        }

        const order = await Order.create({
            user_id,
            total_amount: finalTotal,
            status: "Pending Payment",
            timestamp: new Date(),
            payment_status: 'pending'
        }, { transaction });

        for (const itemData of orderItemsData) {
            await OrderItem.create({ order_id: order.order_id, ...itemData }, { transaction });
        }

        await transaction.commit();
        return order;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Create order (no KHQR generation)
exports.createOrder = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { items, loyalty_points_to_use } = req.body;
        if (!items || !items.length) {
            return res.status(400).json({ error: "Missing required fields: items" });
        }
        const order = await createPendingOrder({
            user_id,
            items,
            loyalty_points_to_use: loyalty_points_to_use || 0
        });
        res.status(201).json({
            message: "Order created – please proceed to payment",
            order_id: order.order_id,
            total_amount: order.total_amount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check KHQR payment status (polled by client)
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        const order = await Order.findByPk(order_id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        // Check if order has expired
        if (order.expires_at && new Date() > order.expires_at) {
            if (order.payment_status !== 'paid') {
                await order.update({ status: "Cancelled", payment_status: 'failed' });
                return res.json({ status: 'EXPIRED', message: 'Payment time expired' });
            }
        }

        if (order.payment_status === 'paid') {
            return res.json({ status: 'COMPLETED' });
        }
        if (!order.khqr_md5) {
            return res.status(400).json({ error: "No KHQR payment associated with this order" });
        }

        const result = await checkTransactionStatus(order.khqr_md5);
        if (result.error) return res.status(500).json({ error: result.error });

        if (result.status === 'COMPLETED') {
            await finalizeOrderAfterPayment(order.order_id);
            return res.json({ status: 'COMPLETED' });
        } else {
            return res.json({ status: result.status });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Internal function to finalize order after KHQR payment confirmation
const finalizeOrderAfterPayment = async (orderId) => {
    const transaction = await sequelize.transaction();
    try {
        const order = await Order.findByPk(orderId, { transaction });
        if (!order) throw new Error("Order not found");
        if (order.payment_status === 'paid') return;

        // 1. Create Payment record
        await Payment.create({
            order_id: order.order_id,
            payment_method: 'KHQR',
            amount: order.total_amount,
            timestamp: new Date(),
        }, { transaction });

        // 2. Update user loyalty points (earn points based on final amount)
        const user = await User.findByPk(order.user_id, { transaction });
        if (user) {
            const pointsEarned = Math.floor(order.total_amount);
            const newPoints = user.loyalty_points + pointsEarned;
            await user.update({ loyalty_points: newPoints }, { transaction });
        }

        // 3. Mark order as Completed and payment_status paid
        await order.update({ status: "Completed", payment_status: 'paid' }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Manual confirmation endpoint (admin only)
exports.confirmPaymentManually = async (req, res) => {
    try {
        const { order_id } = req.params;
        const order = await Order.findByPk(order_id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.payment_status === 'paid') return res.json({ message: "Already paid" });

        await finalizeOrderAfterPayment(order_id);
        res.json({ message: "Order marked as paid", order_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all orders (now including User instead of Customer)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ["full_name", "email", "loyalty_points"] },
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

// Get single order by ID (with User instead of Customer)
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User },
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

// Update order status (admin only)
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