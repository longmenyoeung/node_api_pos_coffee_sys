const express = require('express');
const router = express.Router();
const orderController = require('../controller/order.controller');
const { verifyToken, authorize } = require('../middlewares/auth');

// All routes require authentication
router.post('/', verifyToken, orderController.createOrder);
router.get('/', verifyToken, orderController.getAllOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.put('/:id/status', verifyToken, authorize('admin'), orderController.updateOrderStatus);
router.get('/:order_id/payment-status', verifyToken, orderController.checkPaymentStatus);
router.post('/:order_id/confirm-payment', verifyToken, authorize('admin'), orderController.confirmPaymentManually);

module.exports = router;