// models/Notification.model.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PoliceStation',
        required: true,
    },
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