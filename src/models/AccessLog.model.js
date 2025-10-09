
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
    },
    searchQuery: {
        type: String,
        trim: true,
    },
    reason: {
        type: String,
        trim: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog;