const express = require('express');
const userController = require('../controller/user.controller');
const router = express.Router();
const { verifyToken, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/uploadCloudinary');

// ==================== Public Routes ====================
router.post('/register', upload.single('image'), userController.register);
router.post('/login', userController.login);

// ==================== Protected Routes (require token) ====================
router.use(verifyToken); 
router.get('/me', userController.getCurrentUser);

// Change own password
router.put('/change-password', userController.changePassword);

// ==================== Admin-Only Routes ====================
router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/:id', authorize('admin'), userController.getUserById);
router.put('/:id', authorize('admin'), upload.single('image'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;