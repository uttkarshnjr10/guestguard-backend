// models/Hotel.model.js

const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Suspended'],
        default: 'Active',
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link to the admin who registered the hotel
        required: true,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
});

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;