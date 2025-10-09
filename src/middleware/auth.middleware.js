const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');
const logger = require('../utils/logger');
const { client: redisClient } = require('../config/redisClient');
const ApiError = require('../utils/ApiError');

const protect = asyncHandler(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (!(authHeader && authHeader.startsWith('Bearer '))) {
        return next(new ApiError(401, 'not authorized, no token provided'));
    }

    try {
        token = authHeader.split(' ')[1];

        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return next(new ApiError(401, 'not authorized, token has been invalidated'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return next(new ApiError(401, 'not authorized, user not found'));
        }
        next();

    } catch (error) {
        logger.error(`token verification failed: ${error.message}`);
        return next(new ApiError(401, 'not authorized, token failed'));
    }
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, `user role '${req.user.role}' is not authorized for this resource`));
        }
        next();
    };
};

module.exports = { protect, authorize };