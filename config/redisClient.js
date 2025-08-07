const redis = require('redis');
const logger = require('../utils/logger');

// Create the Redis client with fallback to localhost if REDIS_URL is not set
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Handle Redis error events
client.on('error', (err) => {
  logger.error(`❌ Redis Client Error: ${err.message}`);
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect();
    logger.info('✅ Redis connected successfully.');
  } catch (err) {
    logger.error(`❌ Failed to connect to Redis: ${err.message}`);
    process.exit(1); // Exit the app if Redis is critical
  }
};

module.exports = { client, connectRedis };
