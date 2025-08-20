// routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead } = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
    .get(protect, authorize('Police'), getMyNotifications);

router.route('/:id/read')
    .put(protect, authorize('Police'), markAsRead);

module.exports = router;