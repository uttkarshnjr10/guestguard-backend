const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');
const logger = require('../utils/logger');
const { client: redisClient } = require('../config/redisClient');

const protect = asyncHandler(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            token = authHeader.split(' ')[1];

            // 1. Check if token is blacklisted in Redis
            const isBlacklisted = await redisClient.get(`blacklist:${token}`);
            if (isBlacklisted) {
                res.status(401);
                throw new Error('Not authorized, token has been invalidated (logged out)');
            }

            // 2. Verify the token's signature
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Attach user to the request object
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } catch (error) {
            logger.error(`Token verification failed: ${error.message}`);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
});

// >> THIS IS THE MISSING FUNCTION
const authorize = (...roles) => {
    return (req, res, next) => {
        // The 'protect' middleware must run first to attach `req.user`
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403); // 403 Forbidden is more appropriate for authorization errors
            throw new Error(`User role '${req.user.role}' is not authorized for this resource`);
        }
        next();
    };
};

// >> Now both functions are defined and can be exported
module.exports = { protect, authorize };
