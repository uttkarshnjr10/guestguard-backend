const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redisClient');
const logger = require('./src/utils/logger');
const { notFound, errorHandler } = require('./src/middleware/error.middleware');
const mainRouter = require('./src/routes/index'); //central router


connectDB();
connectRedis();

const app = express();

//CORS Setup
const allowedOrigins =
        process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];


const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  },
  credentials: true,
};

//core Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', mainRouter); 

// health check endpoint
app.get('/', (req, res) => res.send('GuestGuard API is running...'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});