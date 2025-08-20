// models/Notification.model.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // The police station that should receive the notification
    recipientStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PoliceStation',
        required: true,
    },
    // The user (police officer) who will see the notification
    recipientUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;