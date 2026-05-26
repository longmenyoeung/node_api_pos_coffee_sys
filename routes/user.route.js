const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const { verifyToken, authorize } = require('../middlewares/auth');
const User = require('../model/user.model'); 

// Public routes
router.post('/register', userController.register);   // maybe restrict to admin only? decide.
router.post('/login', userController.login);

// Protected routes (require authentication)
router.use(verifyToken);   // all routes below require token

// Anyone logged in can see own profile (optional) – we'll use /me
router.get('/me', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.user_id, { attributes: { exclude: ['password_hash'] } });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/change-password', userController.changePassword);

// Admin-only routes
router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/:id', authorize('admin'), userController.getUserById);
router.put('/:id', authorize('admin'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;