const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');
const { verifyToken } = require('../middlewares/auth');

// Public callback (khqr.cc redirects here)
router.get('/payment/success', paymentController.paymentSuccess);

// Protected routes
router.post('/khqr/initiate', verifyToken, paymentController.initiateKhqrPayment);
router.get('/payments', verifyToken, paymentController.getAllPayments);
router.get('/payments/order/:orderId', verifyToken, paymentController.getPaymentByOrderId);

module.exports = router;