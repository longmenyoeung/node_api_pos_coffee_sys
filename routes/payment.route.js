const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');
const { verifyToken } = require('../middlewares/auth');

// Specific parameterized route intercepts callback first
router.get('/payment/success/:order_id', paymentController.paymentSuccess);
// Fallback route handling for legacy parameter passing shapes
router.get('/payment/success', paymentController.paymentSuccess);

// Protected Core Operational Endpoints
router.post('/khqr/initiate', verifyToken, paymentController.initiateKhqrPayment);
router.get('/payments', verifyToken, paymentController.getAllPayments);
router.get('/payments/order/:orderId', verifyToken, paymentController.getPaymentByOrderId);

module.exports = router;