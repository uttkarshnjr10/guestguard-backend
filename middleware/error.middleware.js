const logger = require("../utils/logger");

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler
const errorHandler = (err, req, res, next) => {
  // CORS error
  if (err.message === "Origin not allowed by CORS") {
    logger.warn(`CORS Blocked: ${req.get("origin")}`);
    return res.status(403).json({
      message: "Origin not allowed",
    });
  }

  // Other errors
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  logger.error(
    `Error: ${err.message}\nStack: ${
      process.env.NODE_ENV === "production" ? "hidden" : err.stack
    }`
  );

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
