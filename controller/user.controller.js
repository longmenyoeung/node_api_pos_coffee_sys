const User = require('../model/user.model');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper: hash password
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// ========== REGISTER new staff user ==========
exports.register = async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check existing user
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const password_hash = await hashPassword(password);
        const user = await User.create({
            username,
            email,
            password_hash,
            full_name,
            role: role || 'cashier'
        });

        // Remove password from response
        const { password_hash: _, ...userData } = user.toJSON();
        res.status(201).json({ message: 'User created successfully', user: userData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== LOGIN ==========
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await User.findOne({ where: { email, is_active: true } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        // Update last login
        await user.update({ last_login: new Date() });

        // Generate JWT
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== GET all users (admin only, but we'll protect in route) ==========
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== GET user by ID ==========
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== UPDATE user ==========
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { username, email, full_name, role, is_active } = req.body;
        await user.update({ username, email, full_name, role, is_active });
        
        const { password_hash, ...userData } = user.toJSON();
        res.json({ message: 'User updated', user: userData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== DELETE user (soft delete – deactivate) ==========
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await user.update({ is_active: false });
        res.json({ message: 'User deactivated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== CHANGE password ==========
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.user_id;  // from auth middleware

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        const newHash = await hashPassword(newPassword);
        await user.update({ password_hash: newHash });
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};