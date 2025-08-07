// utils/logger.js

/**
 * A simple logger utility for the application.
 * It provides color-coded, timestamped logging for different levels:
 * INFO, WARN, and ERROR.
 */

const getTimestamp = () => new Date().toISOString();

// ANSI escape codes for colors
const colors = {
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m', // Reset color
};

const info = (message) => {
  console.log(`${colors.info}[INFO] ${getTimestamp()}: ${message}${colors.reset}`);
};

const warn = (message) => {
  console.warn(`${colors.warn}[WARN] ${getTimestamp()}: ${message}${colors.reset}`);
};

const error = (message) => {
  console.error(`${colors.error}[ERROR] ${getTimestamp()}: ${message}${colors.reset}`);
};

module.exports = {
  info,
  warn,
  error,
};