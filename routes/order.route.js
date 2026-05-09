const express = require('express');
const { getAllOrders } = require('../controller/order.controller');
const router = express.Router();


router.get('/', getAllOrders);



module.exports = router;