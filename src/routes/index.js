// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const guestRoutes = require('./guest.routes');
const inquiryRoutes = require('./inquiry.routes');
const notificationRoutes = require('./notification.routes');
const ocrRoutes = require('./ocr.routes');
const policeRoutes = require('./police.routes');
const policeStationRoutes = require('./policeStation.routes');
const uploadRoutes = require('./upload.routes');
const userRoutes = require('./user.routes');
const autocompleteRoutes = require('./autocomplete.routes');

router.use('/auth', authRoutes);
router.use('/guests', guestRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ocr', ocrRoutes);
router.use('/police', policeRoutes);
router.use('/stations', policeStationRoutes);
router.use('/upload', uploadRoutes);
router.use('/users', userRoutes);
router.use('/autocomplete', autocompleteRoutes);

module.exports = router;