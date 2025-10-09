// src/controllers/auth.controller.js
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const { client: redisClient } = require('../config/redisClient');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const generateToken = (id, role, username) => {
    return jwt.sign({ id, role, username }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        throw new ApiError(401, 'invalid email or password');
    }

    if (user.status === 'Suspended') {
        throw new ApiError(403, 'your account has been suspended');
    }

    if (user.passwordChangeRequired) {
        return res.status(202).json(new ApiResponse(202, { userId: user._id }, 'password change required'));
    }

    const token = generateToken(user._id, user.role, user.username);
    logger.info(`user logged in: ${user.email}`);
    
    const userData = {
        _id: user._id,
        username: user.username,
        role: user.role,
        token,
    };

    res
    .status(200)
    .json(new ApiResponse(200, userData, 'login successful'));
});

const changePassword = asyncHandler(async (req, res, next) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword || newPassword.length < 6) {
        throw new ApiError(400, 'user id and a new password of at least 6 characters are required');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'user not found');
    }

    user.password = newPassword;
    user.passwordChangeRequired = false;
    await user.save();

    logger.info(`password changed for user: ${user.email}`);
    res
    .status(200)
    .json(new ApiResponse(200, null, 'password changed successfully. please log in again.'));
});

const logoutUser = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
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

    logger.info(`user logged out and token blacklisted: ${req.user.email}`);
    res
    .status(200)
    .json(new ApiResponse(200, null, 'logged out successfully'));
});

module.exports = { loginUser, changePassword, logoutUser };