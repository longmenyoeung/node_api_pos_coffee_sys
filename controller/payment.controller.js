const crypto = require('crypto');
const { Payment, Order, User, sequelize } = require("../models");

// ========== HELPER: Generate SHA1 hash for khqr.cc ==========
function generateHash(secret, transactionId, amount, successUrl, remark) {
    const raw = secret + String(transactionId) + String(amount) + successUrl + (remark || '');
    return crypto.createHash('sha1').update(raw).digest('hex');
}

// ========== INTERNAL: Finalize order after successful payment ==========
exports.finalizeOrderPayment = async (orderId, paymentMethod = 'KHQR') => {
    const transaction = await sequelize.transaction();
    try {
        const order = await Order.findByPk(orderId, { transaction });
        if (!order) throw new Error("Order not found");
        if (order.payment_status === 'paid') return; // already paid

        await Payment.create({
            order_id: order.order_id,
            payment_method: paymentMethod,
            amount: order.total_amount,
            timstamp: new Date(),      
        }, { transaction });

        // Update loyalty points
        const user = await User.findByPk(order.user_id, { transaction });
        if (user) {
            const pointsEarned = Math.floor(order.total_amount);
            await user.update({ loyalty_points: user.loyalty_points + pointsEarned }, { transaction });
        }

        // Mark order as completed
        await order.update({ status: "Completed", payment_status: 'paid' }, { transaction });
        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// ========== 1. Initiate KHQR payment (redirect) ==========
exports.initiateKhqrPayment = async (req, res) => {
    try {
        const { order_id, amount, remark } = req.body;
        if (!order_id || !amount) {
            return res.status(400).json({ error: 'order_id and amount are required' });
        }

        const profileId = process.env.KHQR_PROFILE_ID;
        const secretKey = process.env.KHQR_SECRET_KEY;
        if (!profileId || !secretKey) {
            return res.status(500).json({ error: 'KHQR credentials missing' });
        }

        // Include order_id in the success URL path (captures it even if query params missing)
        const successUrl = `${process.env.APP_URL}/api/payment/success/${order_id}`;
        const remarkStr = remark || '';
        const amountStr = Number(amount).toFixed(2);

        const rawString = secretKey + String(order_id) + amountStr + successUrl + remarkStr;
        const hash = crypto.createHash('sha1').update(rawString).digest('hex');

        console.log('✅ Profile ID:', profileId);
        console.log('✅ Order ID:', order_id);
        console.log('✅ Amount:', amountStr);
        console.log('✅ Success URL:', successUrl);
        console.log('✅ Remark:', remarkStr);
        console.log('✅ RAW STRING:', rawString);
        console.log('✅ Generated hash:', hash);

        const redirectUrl = `https://khqr.cc/api/payment/request/${profileId}?transaction_id=${order_id}&amount=${amountStr}&success_url=${encodeURIComponent(successUrl)}&remark=${encodeURIComponent(remarkStr)}&hash=${hash}`;

        console.log('🔗 Full redirect URL:', redirectUrl);
        res.json({ redirect_url: redirectUrl });
    } catch (error) {
        console.error('Initiate KHQR payment error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========== 2. Callback after khqr.cc payment ==========
exports.paymentSuccess = async (req, res, next) => {
    console.log('✅ req.params:', req.params);
    console.log('✅ req.query:', req.query);

    // Priority: query params, then URL path param, then nothing
    const orderId = req.query.transaction_id || req.query.order_id || req.params.order_id;
    if (!orderId) {
        return res.status(400).send(`<h1>⚠️ Invalid Callback</h1><p>Missing order ID.</p>`);
    }

    try {
        await exports.finalizeOrderPayment(orderId, 'KHQR');
        return res.send(`<h1>✅ Payment Successful!</h1><p>Order #${orderId} completed.</p>`);
    } catch (err) {
        console.error('Finalize error:', err);
        return next(err);
    }
};

// ========== 3. Get all payments (admin) ==========
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [{ model: Order, attributes: ["order_id", "total_amount", "status"] }],
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== 4. Get payment by order ID ==========
exports.getPaymentByOrderId = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            where: { order_id: req.params.orderId },
        });
        if (!payment) return res.status(404).json({ error: "Payment not found for this order" });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};