const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventory.controller');
const { verifyToken, authorize } = require('../middlewares/auth');


router.get('/', verifyToken, inventoryController.getAllInventory);
router.get('/low-stock/:threshold', verifyToken, inventoryController.getLowStock);
router.get('/:id', verifyToken, inventoryController.getInventoryById);

// Admin-only write operations
router.post('/', verifyToken, authorize('admin'), inventoryController.createInventory);
router.put('/:id', verifyToken, authorize('admin'), inventoryController.updateInventory);
router.delete('/:id', verifyToken, authorize('admin'), inventoryController.deleteInventory);

module.exports = router;