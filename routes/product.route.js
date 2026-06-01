const express = require('express');
const { getAllProducts, createProduct, getProductById, updateProduct, removeProduct } = require('../controller/product.controller');
const { verifyToken, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/uploadCloudinary');
const router = express.Router();

// Public routes anyone can view products
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin-only routes
router.post('/', verifyToken, authorize('admin'), upload.single('image'), createProduct);
router.put('/:id', verifyToken, authorize('admin'), upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, authorize('admin'), removeProduct);

module.exports = router;