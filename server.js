const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redisClient');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/error.middleware');

// 1. Load env
dotenv.config();

// 2. Connect DB & Redis
connectDB();
connectRedis();

const app = express();

// 3. CORS setup
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // allowed
    } else {
      callback(new Error('Origin not allowed by CORS')); // blocked
    }
  },
  credentials: true,
};

// 4. Middleware
app.use(cors(corsOptions)); // CORS
app.use(helmet());          // Security headers
app.use(express.json());    // JSON parser


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));   // Logging
}

// 5. Routes
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/users', require('./routes/user.routes.js'));
app.use('/api/guests', require('./routes/guest.routes.js'));
app.use('/api/police', require('./routes/police.routes.js'));
app.use('/api/notifications', require('./routes/notification.routes.js'));
app.use('/api/stations', require('./routes/policeStation.routes.js'));
app.use('/api/upload', require('./routes/upload.routes.js'));
app.use('/api/autocomplete', require('./routes/autocomplete.routes.js'));
app.use('/api/ocr', require('./routes/ocr.routes.js'));
app.use('/api/inquiries', require('./routes/inquiry.routes.js'));
app.get('/', (req, res) => res.send('API running'));

// 6. Error handling
app.use(notFound);      // 404
app.use(errorHandler);  // All errors

// 7. Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// 8. Unhandled rejection
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled: ${err.message}`);
  server.close(() => process.exit(1));
});