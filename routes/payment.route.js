const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');
const { verifyToken } = require('../middlewares/auth');

// Accept order_id in the URL path (so it's captured even if query params are missing)
router.get('/payment/success/:order_id', paymentController.paymentSuccess);
// Also keep the plain version for compatibility
router.get('/payment/success', paymentController.paymentSuccess);

// Protected routes
router.post('/khqr/initiate', verifyToken, paymentController.initiateKhqrPayment);
router.get('/payments', verifyToken, paymentController.getAllPayments);
router.get('/payments/order/:orderId', verifyToken, paymentController.getPaymentByOrderId);

module.exports = router;