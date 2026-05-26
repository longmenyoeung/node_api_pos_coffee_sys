const { Payment, Order } = require("../models");

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [
                { model: Order, attributes: ["order_id", "total_amount", "status"] },
            ],
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPaymentByOrderId = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            where: { order_id: req.params.orderId },
        });
        if (!payment)
            return res
                .status(404)
                .json({ error: "Payment not found for this order" });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
