const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');
const { verifyToken } = require('../middlewares/auth');

// Support both with and without order_id in path
router.get('/payment/success', paymentController.paymentSuccess);
router.get('/payment/success/:order_id', paymentController.paymentSuccess);
router.post('/payment/success', paymentController.paymentSuccess);
router.post('/payment/success/:order_id', paymentController.paymentSuccess);

// Protected routes
router.post('/khqr/initiate', verifyToken, paymentController.initiateKhqrPayment);
router.get('/payments', verifyToken, paymentController.getAllPayments);
router.get('/payments/order/:orderId', verifyToken, paymentController.getPaymentByOrderId);

module.exports = router;