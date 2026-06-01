const { generateDynamicQR, checkTransactionStatus } = require('../service/khqr.service');
const { Order } = require('../model'); // adjust path to your models

const initiatePayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        if (!orderId || !amount) {
            return res.status(400).json({ error: 'orderId and amount are required' });
        }

        // Verify the order exists and is not already paid
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (order.payment_status === 'paid') {
            return res.status(400).json({ error: 'Order already paid' });
        }

        // Convert amount to whole number (KHR has no cents) and set expiration (15 minutes)
        const amountKHR = Math.round(amount);
        const expirationTimestamp = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        const result = await generateDynamicQR(orderId, amountKHR, expirationTimestamp);
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        // Store the MD5 hash in the order record for later polling
        await order.update({ khqr_md5: result.md5Hash, payment_status: 'pending' });

        res.json({
            qrString: result.qrString,
            md5Hash: result.md5Hash,
        });
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ error: error.message });
    }
};

const checkPayment = async (req, res) => {
    try {
        const { md5Hash } = req.query;
        if (!md5Hash) {
            return res.status(400).json({ error: 'md5Hash is required' });
        }

        const result = await checkTransactionStatus(md5Hash);
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        if (result.status === 'COMPLETED') {
            // Payment confirmed – update your order status
            // (You can also mark it as paid here, or do it in a webhook)
            // For now, just return the status.
        }

        res.json({ status: result.status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    initiatePayment,
    checkPayment,
};