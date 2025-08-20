// controllers/guest.controller.js

const Guest = require('../models/Guest.model');
const PoliceStation = require('../models/PoliceStation.model'); // ✅ NEW
const Notification = require('../models/Notification.model');   // ✅ NEW
const User = require('../models/User.model');                   // ✅ NEW
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const generateGuestPDF = require('../utils/pdfGenerator');
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

  // Handle front + back ID images and live photo
  const idImageFrontFile = req.files?.idImageFront?.[0];
  const idImageBackFile = req.files?.idImageBack?.[0];
  const livePhotoFile = req.files?.livePhoto?.[0];

  const idImageFrontURL = idImageFrontFile?.path || idImageFrontFile?.secure_url;
  const idImageBackURL = idImageBackFile?.path || idImageBackFile?.secure_url;
  const livePhotoURL = livePhotoFile?.path || livePhotoFile?.secure_url;

  if (!idImageFrontURL || !idImageBackURL || !livePhotoURL) {
    res.status(400);
    throw new Error('Image upload failed. idImageFront, idImageBack, and livePhoto are required');
  }

  const guest = await Guest.create({
    primaryGuest,
    idType,
    idNumber,
    idImageFrontURL,
    idImageBackURL,
    livePhotoURL,
    accompanyingGuests,
    stayDetails,
    hotel: hotelUserId,
  });

  logger.info(`New guest registered (${guest.customerId}) at ${req.user.username}`);
  res.status(201).json(guest);
});

/**
 * @desc    Get ALL guests for the logged-in hotel (with total accompanying count)
 * @route   GET /api/guests/all
 * @access  Private/Hotel
 */
const getAllGuests = asyncHandler(async (req, res) => {
  const hotelUserId = req.user._id;

  const guests = await Guest.aggregate([
    { $match: { hotel: hotelUserId } },
    {
      $addFields: {
        totalAccompanyingGuests: {
          $add: [
            { $size: "$accompanyingGuests.adults" },
            { $size: "$accompanyingGuests.children" }
          ]
        }
      }
    },
    { $sort: { registrationTimestamp: -1 } }
  ]);

  res.json(guests);
});

/**
 * @desc    Get today's registered guests
 * @route   GET /api/guests/today
 * @access  Private/Hotel
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
  const guest = await Guest.findById(guestId).populate('hotel', 'username email details');

  if (!guest) {
    res.status(404);
    throw new Error('Guest not found');
  }

  if (guest.status === 'Checked-Out') {
    res.status(400);
    throw new Error('This guest has already been checked out.');
  }

  guest.status = 'Checked-Out';
  await guest.save();

  const pdfBuffer = await generateGuestPDF(guest);

  // Email PDF to both guest and hotel
  const guestEmail = guest.primaryGuest.email;
  const hotelEmail = guest.hotel.email;
  if (guestEmail && hotelEmail) {
    sendCheckoutEmail(guestEmail, hotelEmail, guest.primaryGuest.name, pdfBuffer);
  }

  logger.info(`Guest ${guest.customerId} checked out by ${req.user.username}`);
  res.json({ message: 'Guest checked out successfully. Receipt has been emailed.' });
});

/**
 * @desc    Search guest by customerId (with jurisdiction notifications)
 * @route   GET /api/guests/search
 * @access  Private/Police
 */
const searchGuests = asyncHandler(async (req, res) => {
  const { customerId } = req.query;
  if (!customerId) {
    res.status(400);
    throw new Error('A customerId is required for search');
  }

  const guest = await Guest.findOne({ customerId })
    .populate('hotel', 'username details.city');

  if (!guest) {
    res.status(404);
    throw new Error('No guest found with that Customer ID');
  }

  logger.info(`Guest search for ${customerId} performed by ${req.user.username}`);

  // --- Notification logic ---
  try {
    const searchingOfficer = await User.findById(req.user._id).populate('policeStation');
    const guestAddress = guest.primaryGuest.address;
    const guestPincode = guestAddress?.split('-').pop().trim(); // assumes last part is pincode

    if (guestPincode && searchingOfficer.policeStation) {
      const targetStation = await PoliceStation.findOne({ pincodes: guestPincode });

      if (targetStation && targetStation._id.toString() !== searchingOfficer.policeStation._id.toString()) {
        const officersToNotify = await User.find({ policeStation: targetStation._id });

        for (const officer of officersToNotify) {
          const message = `Alert: Officer ${searchingOfficer.username} from ${searchingOfficer.policeStation.name} searched for ${guest.primaryGuest.name}, a resident from your jurisdiction (Pincode: ${guestPincode}).`;

          await Notification.create({
            recipientStation: targetStation._id,
            recipientUser: officer._id,
            message,
          });
        }

        logger.info(`Notification sent to ${targetStation.name} for search on guest ${customerId}.`);
      }
    }
  } catch (err) {
    logger.error('Failed to process notification logic:', err);
  }
  // --- End Notification logic ---

  res.status(200).json(guest);
});

module.exports = {
  registerGuest,
  checkoutGuest,
  searchGuests,
  getTodaysGuests,
  getAllGuests,
};
