// routes/auth.routes.js

const express = require('express');
const router = express.Router();
const { loginUser, changePassword, logoutUser } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// --- Public Routes ---
router.post('/login', loginUser);

// >> CRITICAL FIX: The 'protect' middleware has been removed from this line.
// This makes the route public, allowing users to set their initial password
// without needing a valid token.
router.post('/change-password', changePassword);


// --- Private Routes ---
// Logout still requires a valid token to know WHO is logging out.
router.post('/logout', protect, logoutUser);

module.exports = router;
