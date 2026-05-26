const express = require('express');
const { getAllProducts, createProduct, getProductById, updateProduct, removeProduct } = require('../controller/product.controller');
const router = express.Router();
const upload = require('../middlewares/uploadCloudinary');



router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', upload.single('image'), createProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', removeProduct);

module.exports = router;