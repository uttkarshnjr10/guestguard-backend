// controllers/guest.controller.js

const Guest = require('../models/Guest.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const generateGuestPDF = require('../utils/pdfGenerator');
// 1. Import the new email function
const { sendCheckoutEmail } = require('../utils/sendEmail');

/**
 * @desc    Register a new guest
 * @route   POST /api/guests/register
 * @access  Private/Hotel
 */
const registerGuest = asyncHandler(async (req, res) => {
  const hotelUserId = req.user._id;

  const parseMaybeJson = (value, fallback) => {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return fallback; }
    }
    return value ?? fallback;
  };

  const primaryGuest = parseMaybeJson(req.body.primaryGuest, req.body.primaryGuest);
  const stayDetails = parseMaybeJson(req.body.stayDetails, req.body.stayDetails);
  const accompanyingGuests = parseMaybeJson(req.body.accompanyingGuests, { adults: [], children: [] });

  const idType = req.body.idType;
  const idNumber = req.body.idNumber;

  const idImageFile = req.files?.idImage?.[0];
  const livePhotoFile = req.files?.livePhoto?.[0];

  const idImageURL = idImageFile?.path || idImageFile?.secure_url;
  const livePhotoURL = livePhotoFile?.path || livePhotoFile?.secure_url;

  if (!idImageURL || !livePhotoURL) {
    res.status(400);
    throw new Error('Image upload failed. idImage and livePhoto are required');
  }

  const guest = await Guest.create({
    primaryGuest,
    idType,
    idNumber,
    idImageURL,
    livePhotoURL,
    accompanyingGuests,
    stayDetails,
    hotel: hotelUserId,
  });

  logger.info(`New guest registered (${guest.customerId}) at ${req.user.username}`);
  res.status(201).json(guest);
});

/**
 * @desc    Get ALL guests for the logged-in hotel
 * @route   GET /api/guests/all
 * @access  Private (Hotel)
 */
const getAllGuests = asyncHandler(async (req, res) => {
    const hotelUserId = req.user._id;
    const guests = await Guest.find({ hotel: hotelUserId })
        .sort({ registrationTimestamp: -1 });
    res.json(guests);
});

/**
 * @desc    Get guests registered today by the logged-in hotel
 * @route   GET /api/guests/today
 * @access  Private (Hotel)
 */
const getTodaysGuests = asyncHandler(async (req, res) => {
    const hotelUserId = req.user._id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const guests = await Guest.find({
        hotel: hotelUserId,
        registrationTimestamp: { $gte: startOfToday, $lte: endOfToday }
    })
    .select('primaryGuest.name stayDetails.roomNumber')
    .sort({ registrationTimestamp: -1 });
    const formattedGuests = guests.map(g => ({
        name: g.primaryGuest.name,
        roomNumber: g.stayDetails.roomNumber
    }));
    res.json(formattedGuests);
});

/**
 * @desc    Checkout a guest, generate PDF, and email it
 * @route   PUT /api/guests/:id/checkout
 * @access  Private/Hotel
 */
const checkoutGuest = asyncHandler(async (req, res) => {
    const guestId = req.params.id;
    // Populate the hotel's user details, including their email
    const guest = await Guest.findById(guestId).populate('hotel', 'username email details');

    if (!guest) {
        res.status(404);
        throw new Error('Guest not found');
    }

    // Prevent checking out a guest who is already checked out
    if (guest.status === 'Checked-Out') {
        res.status(400);
        throw new Error('This guest has already been checked out.');
    }

    guest.status = 'Checked-Out';
    await guest.save();

    // 2. Generate the PDF in memory
    const pdfBuffer = await generateGuestPDF(guest);

    // 3. Email the PDF to the guest and the hotel
    const guestEmail = guest.primaryGuest.email;
    const hotelEmail = guest.hotel.email;
    if (guestEmail && hotelEmail) {
        sendCheckoutEmail(guestEmail, hotelEmail, guest.primaryGuest.name, pdfBuffer);
    }

    logger.info(`Guest ${guest.customerId} checked out by ${req.user.username}`);

    // 4. Send a simple success response to the frontend
    res.json({ message: 'Guest checked out successfully. Receipt has been emailed.' });
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
    const guest = await Guest.findOne({ customerId }).populate('hotel', 'username details.city');
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
    getTodaysGuests,
    getAllGuests,
};
