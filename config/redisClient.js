const redis = require('redis');
const logger = require('../utils/logger');

// >> Use environment variable for the Redis URL for production flexibility.
const client = redis.createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => logger.error(`Redis Client Error: ${err}`));

const connectRedis = async () => {
  try {
    await client.connect();
    logger.info('Redis connected successfully. ⚡');
  } catch (err) {
    logger.error(`Could not establish a connection with Redis: ${err}`);
    // >> In production, you might want the app to exit if Redis is critical.
    process.exit(1);
  }
};

module.exports = { client, connectRedis };