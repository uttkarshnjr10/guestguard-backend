// routes/verification.routes.js
const express = require('express');
const router = express.Router();
const { verifyIdText } = require('../controllers/verification.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/id-text', protect, authorize('Hotel'), verifyIdText);

module.exports = router;