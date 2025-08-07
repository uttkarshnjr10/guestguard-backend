// models/AccessLog.model.js

const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        // Example: "Logged in", "Registered guest: [Guest Name]", "Searched for: [Query]"
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog;