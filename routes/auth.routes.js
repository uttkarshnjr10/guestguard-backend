// routes/auth.routes.js

const express = require('express');
const rateLimit = require('express-rate-limit'); // ✅ Import rate-limit
const router = express.Router();
const { loginUser, changePassword, logoutUser } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// ✅ Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 attempts per IP per window
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return info in RateLimit-* headers
    legacyHeaders: false,  // Disable X-RateLimit-* headers
});

// --- Public Routes ---
router.post('/login', loginLimiter, loginUser);

// NOTE: change-password should remain public (no token) so new users can set initial password
router.post('/change-password', changePassword);

// --- Private Routes ---
// Logout requires a valid token (to know who is logging out)
router.post('/logout', protect, logoutUser);

module.exports = router;
