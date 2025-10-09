const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
    const error = new ApiError(404, `not found - ${req.originalUrl}`);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'internal server error';

    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    logger.error(err.stack);

    res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };