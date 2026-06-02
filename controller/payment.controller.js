const crypto = require('crypto');
const { Payment, Order, User, sequelize } = require("../model");

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
        if (order.payment_status === 'paid') return;

        await Payment.create({
            order_id: order.order_id,
            payment_method: paymentMethod,
            amount: order.total_amount,
            timestamp: new Date(),
        }, { transaction });

        const user = await User.findByPk(order.user_id, { transaction });
        if (user) {
            const pointsEarned = Math.floor(order.total_amount);
            await user.update({ loyalty_points: user.loyalty_points + pointsEarned }, { transaction });
        }

        await order.update({ status: "Completed", payment_status: 'paid' }, { transaction });
        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// ========== 1. Initiate KHQR payment ==========
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

        const successUrl = `${process.env.APP_URL}/api/payment/success`;
        const remarkStr = remark || '';  
        const amountStr = Number(amount).toFixed(2);

        // Hash uses exact same values as URL
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
exports.paymentSuccess = async (req, res) => {
    console.log('✅ Callback received:', req.query);
    const { transaction_id, status } = req.query;

    if (!transaction_id || !status) {
        console.log('❌ Missing required parameters. Full query:', req.query);
        return res.status(400).send(`
            <html>
            <body style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1>⚠️ Invalid Callback</h1>
                <p>Missing transaction_id or status. Please contact support.</p>
                <p>Received: ${JSON.stringify(req.query)}</p>
                <a href="/">Return to home</a>
            </body>
            </html>
        `);
    }

    if (status === 'success' && transaction_id) {
        try {
            await exports.finalizeOrderPayment(transaction_id, 'KHQR');
            return res.send(`
                <html>
                <body style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h1>✅ Payment Successful!</h1>
                    <p>Order <strong>#${transaction_id}</strong> has been completed.</p>
                    <p>Thank you for your purchase ☕</p>
                </body>
                </html>
            `);
        } catch (err) {
            console.error('❌ Finalize order error:', err);
            return res.status(500).send(`Error finalizing order: ${err.message}`);
        }
    } else {
        console.log('❌ Invalid callback - status:', status, 'transaction_id:', transaction_id);
        return res.status(400).send(`
            <html>
            <body style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1>⚠️ Payment not completed</h1>
                <p>Status: ${status}</p>
                <p>Order ID: ${transaction_id}</p>
                <a href="/">Return to home</a>
            </body>
            </html>
        `);
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