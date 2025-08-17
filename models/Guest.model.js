// models/Guest.model.js

const mongoose = require('mongoose');
const { randomBytes } = require('crypto');

const individualGuestSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
}, { _id: false });

const guestSchema = new mongoose.Schema({
    customerId: {
        type: String,
        unique: true,
        required: true,
    },
    primaryGuest: {
        type: individualGuestSchema,
        required: true,
    },
    idType: { type: String, required: true },
    idNumber: { type: String, required: true, trim: true },
    idImageURL: { type: String, required: true },
    livePhotoURL: { type: String, required: true },
    accompanyingGuests: {
        adults: [{
            name: { type: String, required: true, trim: true },
            gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
            livePhotoURL: { type: String }, 
            _id: false
        }],
        children: [{
            name: { type: String, required: true, trim: true },
            gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
            livePhotoURL: { type: String },
            _id: false
        }]
    },
    stayDetails: {
        purposeOfVisit: { type: String, required: true, trim: true },
        checkIn: { type: Date, default: Date.now },
        expectedCheckout: { type: Date, required: true },
        roomNumber: { type: String, trim: true },
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        // >> FIX: Changed 'Hotel' to 'User' to correctly reference your users collection.
        ref: 'User', 
        required: true,
    },
    status: {
        type: String,
        enum: ['Checked-In', 'Checked-Out'],
        default: 'Checked-In',
    },
    registrationTimestamp: {
        type: Date,
        default: Date.now,
    },
});

// Before saving a new guest, automatically generate a unique customerId
guestSchema.pre('validate', function(next) {
    if (this.isNew) {
        this.customerId = `G-${randomBytes(3).toString('hex').toUpperCase()}`;
    }
    next();
});

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;
