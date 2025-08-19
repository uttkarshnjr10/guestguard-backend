// models/Alert.model.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest',
        required: true,
    },
    // The police officer who created the alert
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reason: {
        type: String,
        required: [true, 'A reason for the alert is required.'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Open', 'Resolved'],
        default: 'Open',
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;