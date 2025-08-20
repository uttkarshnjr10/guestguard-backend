// controllers/notification.controller.js
const Notification = require('../models/Notification.model');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get unread notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private/Police
 */
const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipientUser: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20); // Get latest 20
    res.json(notifications);
});

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private/Police
 */
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification && notification.recipientUser.toString() === req.user._id.toString()) {
        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Notification marked as read' });
    } else {
        res.status(404);
        throw new Error('Notification not found or user not authorized');
    }
});

module.exports = { getMyNotifications, markAsRead };