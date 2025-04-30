// Authentication routes
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', AuthController.register);

// Login a user
router.post('/login', AuthController.login);

// Get user profile (protected route)
router.get('/profile', auth, AuthController.getProfile);

// Update user profile (protected route)
router.put('/profile', auth, AuthController.updateProfile);

module.exports = router;
