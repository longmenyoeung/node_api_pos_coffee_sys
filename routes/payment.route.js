const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');
const { verifyToken } = require('../middlewares/auth');

// This route will capture the order_id from the URL path
router.get('/payment/success/:order_id', paymentController.paymentSuccess);
// Keep a fallback for old callbacks (optional)
router.get('/payment/success', paymentController.paymentSuccess);

router.post('/khqr/initiate', verifyToken, paymentController.initiateKhqrPayment);
router.get('/payments', verifyToken, paymentController.getAllPayments);
router.get('/payments/order/:orderId', verifyToken, paymentController.getPaymentByOrderId);

module.exports = router;