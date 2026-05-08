const express = require('express');
const { getAllProducts, createProduct, getProductById, updateProduct, removeProduct } = require('../controller/product.controller');
const router = express.Router();


router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', removeProduct);


module.exports = router;