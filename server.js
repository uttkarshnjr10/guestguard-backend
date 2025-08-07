const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet'); // >> For security headers
const morgan = require('morgan'); // >> For request logging
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redisClient');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/error.middleware'); // >> Import centralized handlers

dotenv.config();
connectDB();
connectRedis();

const app = express();

// --- Core Middleware ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(helmet()); // >> Use Helmet to set secure HTTP headers
app.use(express.json());

// >> Use Morgan for logging in development mode
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- API Routes ---
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/users', require('./routes/user.routes.js'));
// ... other routes

app.get('/', (req, res) => {
  res.send('API is running successfully.');
});

// --- Centralized Error Handling ---
// >> Use custom middleware for 404 and other errors. This should be LAST.
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