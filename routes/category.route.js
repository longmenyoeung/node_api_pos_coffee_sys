const express = require('express');
const { getAllCategories, getCategoryById, createCategory, updateCategory, removeCategory  } = require('../controller/category.controller');
const router = express.Router();


router.get('/',getAllCategories )
router.get('/:id', getCategoryById)
router.post('/', createCategory)
router.put('/:id', updateCategory)
router.delete('/:id', removeCategory)

module.exports = router