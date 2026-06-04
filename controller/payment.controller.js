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
// ========== Callback after khqr.cc payment settles successfully ==========
exports.paymentSuccess = async (req, res, next) => {
    // Intercept target order key identifier across mapping locations safely
    const orderId = req.params.order_id || req.query.transaction_id || req.query.order_id;
    
    // Fallback UI if the gateway drops parameters unexpectedly
    if (!orderId) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>POS System - Issue Encountered</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    .card { max-width: 400px; padding: 32px; background: white; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; }
                    h1 { color: #e11d48; margin: 0 0 12px 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; }
                    p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; font-medium; }
                    .btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px; background: #0f172a; color: white; text-decoration: none; border-radius: 12px; font-size: 13px; font-weight: 700; uppercase; tracking-wider; transition: opacity 0.2s; }
                    .btn:hover { opacity: 0.9; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>⚠️ Session Unresolved</h1>
                    <p>We recorded the payment but could not cross-reference your exact order reference ID number. Please crosscheck terminal logs manually.</p>
                    <a href="http://localhost:5173/orders" class="btn">Return to Shop</a>
                </div>
            </body>
            </html>
        `);
    }

    try {
        // 🛠️ Finalize transaction records inside your system tables (Idempotent call guard active)
        await exports.finalizeOrderPayment(orderId, 'KHQR');
        
        // Return a sleek, modern, standalone HTML receipt framework directly to browser viewport
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Settled Successfully</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                    .card { w-full; max-width: 400px; background: white; border-radius: 32px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08); padding: 36px; text-align: center; border-top: 8px solid #10b981; position: relative; }
                    .icon-circle { width: 64px; height: 64px; background: #ecfdf5; border: 1px solid #d1fae5; color: #10b981; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 32px; font-weight: bold; }
                    h1 { color: #0f172a; font-size: 22px; font-black; text-transform: uppercase; letter-spacing: -0.025em; margin: 0 0 6px 0; }
                    .subtitle { color: #94a3b8; font-size: 13px; font-weight: 500; margin: 0 0 28px 0; }
                    .receipt-box { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; padding: 20px; text-align: left; margin-bottom: 28px; position: relative; }
                    .receipt-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 12px; color: #64748b; font-weight: 500; }
                    .receipt-row:last-child { margin-bottom: 0; padding-top: 12px; border-t: 1px dashed #e2e8f0; font-size: 14px; font-weight: 900; color: #0f172a; }
                    .hash-tag { font-family: monospace; font-weight: 700; color: #0f172a; }
                    .status-badge { background: #e6fcf5; color: #0ca678; font-size: 10px; font-weight: 900; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; border: 1px solid #c3fae8; }
                    .btn-back { display: block; width: 100%; box-sizing: border-box; padding: 16px; background: #d97706; color: white; text-decoration: none; border-radius: 16px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.2s; shadow: 0 4px 12px rgba(217,119,6,0.15); }
                    .btn-back:hover { background: #b45309; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon-circle">✓</div>
                    <h1>Payment Successful</h1>
                    <p class="subtitle">Thank you for your purchase! ☕</p>
                    
                    <div class="receipt-box">
                        <div class="receipt-row">
                            <span>Order Reference</span>
                            <span class="hash-tag">#${orderId}</span>
                        </div>
                        <div class="receipt-row">
                            <span>Settlement Gateway</span>
                            <span class="status-badge">KHQR Paid</span>
                        </div>
                        <div class="receipt-row">
                            <span>Terminal Pipeline</span>
                            <span style="color: #0f172a; font-weight: 700;">Live Production</span>
                        </div>
                    </div>

                    <a href="http://localhost:5173/orders" class="btn-back">Return to POS Terminal</a>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        console.error('❌ Finalize order transactional sequence crash:', err);
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