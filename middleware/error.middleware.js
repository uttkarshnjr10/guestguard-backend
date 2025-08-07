const logger = require('../utils/logger');

// Handles requests to routes that do not exist (404)
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the next middleware
};

// A generic error handler that catches all errors passed via next(error)
const errorHandler = (err, req, res, next) => {
    // If the status code is 200, it might be an unhandled error, so set it to 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    logger.error(`Error: ${err.message}\nStack: ${process.env.NODE_ENV === 'production' ? 'hidden' : err.stack}`);
    
    res.json({
        message: err.message,
        // Only show the stack trace in development mode for security reasons
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };