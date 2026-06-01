const express = require('express');
const router = express.Router();
const orderController = require('../controller/order.controller');
const { verifyToken, authorize } = require('../middlewares/auth');

// Public routes (if any – but orders are protected)
// All routes below require authentication

// Create a new order (now returns KHQR code)
router.post('/', verifyToken, orderController.createOrder);

// Get all orders (admin only – or you can allow cashier view)
router.get('/', verifyToken, orderController.getAllOrders);

// Get a single order by ID
router.get('/:id', verifyToken, orderController.getOrderById);

// Update order status (e.g., cancel) – only admin
router.put('/:id/status', verifyToken, authorize('admin'), orderController.updateOrderStatus);

// KHQR payment‑status polling (customer / frontend)
router.get('/:order_id/payment-status', verifyToken, orderController.checkPaymentStatus);

// Manual payment confirmation (admin only, fallback)
router.post('/:order_id/confirm-payment', verifyToken, authorize('admin'), orderController.confirmPaymentManually);

module.exports = router;