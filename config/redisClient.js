const redis = require('redis');
const logger = require('../utils/logger');


const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Handle Redis error events
client.on('error', (err) => {
  logger.error(` Redis Client Error: ${err.message}`);
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect();
    logger.info(' Redis connected.');
  } catch (err) {
    logger.error(` Failed to connect to Redis: ${err.message}`);
    process.exit(1); 
  }
};

module.exports = { client, connectRedis };
