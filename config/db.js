// config/db.js

const mongoose = require('mongoose');
const logger = require('../utils/logger'); 

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * It uses the MONGO_URI from the environment variables.
 *
 * This function is designed to be called once when the application starts.
 * It includes robust error handling and logs the connection status.
 */
const connectDB = async () => {
  try {
    // Mongoose connection options for production-grade reliability.
    // These help in maintaining a stable connection.
    const connOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, connOptions);

    logger.info(`MongoDB Connected: ${conn.connection.host} `);

    // Listen for the 'disconnected' event for graceful shutdown handling
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected!');
    });

    // Listen for the 'reconnected' event
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected!');
    });

  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit the process with a failure code if the initial connection fails.
    // This is crucial for production because the app is useless without the DB.
    process.exit(1);
  }
};

module.exports = connectDB;