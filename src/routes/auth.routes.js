// src/routes/auth.routes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { loginUser, changePassword, logoutUser } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'too many login attempts from this ip, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, loginUser);
router.post('/change-password', changePassword);
router.post('/logout', protect, logoutUser);

module.exports = router;