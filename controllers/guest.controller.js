// controllers/guest.controller.js

const Guest = require('../models/Guest.model');
const Hotel = require('../models/Hotel.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const generateGuestPDF = require('../utils/pdfGenerator'); // We will create this utility next

/**
 * @desc    Register a new guest
 * @route   POST /api/guests/register
 * @access  Private/Hotel
 */
const registerGuest = asyncHandler(async (req, res) => {
    // NOTE: In the next step, we will add middleware to handle file uploads.
    // For now, we assume the URLs of the uploaded photos are in the request body.
    const { primaryGuest, idType, idNumber, idImageURL, livePhotoURL, accompanyingGuests, stayDetails } = req.body;

    // The logged-in hotel staff's user ID is on req.user from the 'protect' middleware
    const hotelStaffId = req.user._id;

    // Find the hotel that this staff member is assigned to
    const hotel = await Hotel.findOne({ registeredBy: hotelStaffId });

    if (!hotel) {
        res.status(404);
        throw new Error('No hotel is associated with your account. Please contact your administrator.');
    }

    const guest = await Guest.create({
        // The customerId is generated automatically by the model's pre-save hook
        primaryGuest,
        idType,
        idNumber,
        idImageURL,
        livePhotoURL,
        accompanyingGuests,
        stayDetails,
        hotel: hotel._id, // Link the guest to the hotel
    });

    logger.info(`New guest registered (${guest.customerId}) at ${hotel.name} by ${req.user.username}`);
    res.status(201).json(guest);
});

/**
 * @desc    Checkout a guest and generate a PDF
 * @route   PUT /api/guests/:id/checkout
 * @access  Private/Hotel
 */
const checkoutGuest = asyncHandler(async (req, res) => {
    const guestId = req.params.id;
    const guest = await Guest.findById(guestId).populate('hotel', 'name city address');

    if (!guest) {
        res.status(404);
        throw new Error('Guest not found');
    }

    // Update the guest's status to 'Checked-Out'
    guest.status = 'Checked-Out';
    await guest.save();

    logger.info(`Guest ${guest.customerId} checked out by ${req.user.username}`);

    // Set headers for PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=checkout_${guest.customerId}.pdf`);

    // Generate the PDF and stream it directly to the response
    generateGuestPDF(guest, res);
});


/**
 * @desc    Search for guests by customerId
 * @route   GET /api/guests/search
 * @access  Private/Police
 */
const searchGuests = asyncHandler(async (req, res) => {
    const { customerId } = req.query;

    if (!customerId) {
        res.status(400);
        throw new Error('A customerId is required for search');
    }

    const guest = await Guest.findOne({ customerId }).populate('hotel', 'name city');

    if (!guest) {
        res.status(404);
        throw new Error('No guest found with that Customer ID');
    }

    logger.info(`Guest search for ${customerId} performed by ${req.user.username}`);
    res.status(200).json(guest);
});


module.exports = {
    registerGuest,
    checkoutGuest,
    searchGuests,
};