const express = require("express");
const router = express.Router();
const orderController = require("../controller/order.controller"); 

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id/status", orderController.updateOrderStatus);

module.exports = router;