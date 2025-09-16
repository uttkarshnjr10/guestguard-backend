
const mongoose = require('mongoose');

const hotelInquirySchema = new mongoose.Schema({
    hotelName: { type: String, required: true },
    gstNumber: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    mobileNumber: { type: String, required: true },

    // Address Details
    nationality: { type: String, default: 'Indian' },
    state: { type: String, required: true },
    district: { type: String, required: true },
    postOffice: { type: String, required: true },
    pinCode: { type: String, required: true },
    localThana: { type: String, required: true },
    fullAddress: { type: String, required: true },
    pinLocation: { type: String }, // For Google Maps link or coordinates

    // File Uploads from Cloudinary
    ownerSignature: {
        public_id: String,
        url: String,
    },
    hotelStamp: {
        public_id: String,
        url: String,
    },
    
    // Status for Admin Tracking
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });

const HotelInquiry = mongoose.model('HotelInquiry', hotelInquirySchema);

module.exports = HotelInquiry;