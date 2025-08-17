// controllers/auth.controller.js
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const { client: redisClient } = require('../config/redisClient');

// Helper function to generate a JWT with the user's role
const generateToken = (id, role, username) => {
    return jwt.sign({ id, role, username }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Login
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {

        // ✅ NEW: Check if the user's account is suspended
        if (user.status === 'Suspended') {
            res.status(403); // Forbidden
            throw new Error('Your account has been suspended. Please contact the administrator.');
        }

        // This status code tells the frontend to redirect to the reset page
        if (user.passwordChangeRequired) {
            return res.status(202).json({
                message: 'Password change required',
                userId: user._id,
            });
        }
        
        logger.info(`User logged in: ${user.email}`);
        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            token: generateToken(user._id, user.role, user.username),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// Public reset password page
const changePassword = asyncHandler(async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword || newPassword.length < 6) {
        res.status(400);
        throw new Error('User ID and a valid new password (min 6 chars) are required');
    }

    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.password = newPassword;
    user.passwordChangeRequired = false; // Clear the flag
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    res.status(200).json({ message: 'Password changed successfully. Please log in again.' });
});

// Logout
const logoutUser = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);

    if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
            await redisClient.set(`blacklist:${token}`, 'true', {
                EX: expiresIn,
            });
        }
    }

    logger.info(`User logged out and token blacklisted: ${req.user.email}`);
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = { loginUser, changePassword, logoutUser };
