const express = require('express');
const { 
    getAllCategories, 
    getCategoryById, 
    createCategory, 
    updateCategory, 
    removeCategory 
} = require('../controller/category.controller');
const { verifyToken, authorize } = require('../middlewares/auth'); 
const router = express.Router();

// public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin-only 
router.post('/', verifyToken, authorize('admin'), createCategory);
router.put('/:id', verifyToken, authorize('admin'), updateCategory);
router.delete('/:id', verifyToken, authorize('admin'), removeCategory);

module.exports = router;