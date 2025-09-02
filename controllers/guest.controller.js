// guest.controller.js (Final Resolved Version)
const Guest = require('../models/Guest.model');
const PoliceStation = require('../models/PoliceStation.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const generateGuestPDF = require('../utils/pdfGenerator');
const { sendCheckoutEmail } = require('../utils/sendEmail');
const { verifyGuestIdText } = require('./verification.controller');

/**
 * @desc    Register a new guest
 * @route   POST /api/guests/register
 * @access  Private/Hotel
 */
const registerGuest = asyncHandler(async (req, res) => {
  const hotelUserId = req.user._id;

  // Create a map of files by their fieldname for easy lookup
  const filesMap = (req.files || []).reduce((map, file) => {
    map[file.fieldname] = file;
    return map;
  }, {});

  const parseMaybeJson = (value, fallback) => {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return fallback; }
    }
    return value ?? fallback;
  };

  const processGuests = (guestList, type) => {
    return (guestList || []).map((guest, index) => {
      // Find the correct files from our map
      return {
        ...guest,
        idImageFrontURL: filesMap[`${type}_${index}_idImageFront`]?.path,
        idImageBackURL: filesMap[`${type}_${index}_idImageBack`]?.path,
        livePhotoURL: filesMap[`${type}_${index}_livePhoto`]?.path,
      };
    });
  };

  const primaryGuestData = {
    name: req.body.primaryGuestName,
    dob: req.body.primaryGuestDob,
    gender: req.body.primaryGuestGender,
    phone: req.body.primaryGuestPhone,
    email: req.body.primaryGuestEmail,
    // Construct the address object from individual fields
    address: {
        street: req.body.primaryGuestAddressStreet,
        city: req.body.primaryGuestAddressCity,
        state: req.body.primaryGuestAddressState,
        zipCode: req.body.primaryGuestAddressZipCode,
        country: req.body.primaryGuestAddressCountry
    },
    // Add the new nationality field
    nationality: req.body.primaryGuestNationality
  };
  // -- END OF REPLACEMENT --

  const stayDetails = {
    purposeOfVisit: req.body.purposeOfVisit,
    checkIn: req.body.checkIn,
    expectedCheckout: req.body.expectedCheckout,
    roomNumber: req.body.roomNumber,
  };

  const accompanyingGuestsRaw = parseMaybeJson(req.body.accompanyingGuests, { adults: [], children: [] });
  const accompanyingGuests = {
    adults: processGuests(accompanyingGuestsRaw.adults, 'adult'),
    children: processGuests(accompanyingGuestsRaw.children, 'child'),
  };

  const idType = req.body.idType;
  const idNumber = req.body.idNumber;
  
  // Get file paths from our new filesMap
  const idImageFrontURL = filesMap['idImageFront']?.path;
  const idImageBackURL = filesMap['idImageBack']?.path;
  const livePhotoURL = filesMap['livePhoto']?.path;

  if (!idImageFrontURL || !idImageBackURL || !livePhotoURL) {
    res.status(400);
    throw new Error('Image upload failed. idImageFront, idImageBack, and livePhoto are required');
  }

  // --- TEMPORARY BYPASS FOR BILLING ISSUE ---
  // The following verification logic is commented out to prevent the Google Vision API error.
  // Remember to re-enable this after you set up billing on your Google Cloud project.
  
  logger.warn('Google Vision ID verification is temporarily bypassed.'); // Added a warning log
  
  /*     Hold This for now 
  const verificationResult = await verifyGuestIdText(idImageFrontURL, primaryGuestData.name);
  if (!verificationResult.match) {
    // If verification fails, send a 400 error and stop the registration
    res.status(400);
    throw new Error(verificationResult.message);
  }
           */

  const guest = await Guest.create({
    primaryGuest: primaryGuestData,
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
  // Return a clear success message along with the guest object
  res.status(201).json({ message: "Guest registered successfully!", guest });
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
    res.status(400);
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
    const searchingOfficer = await User.findById(Ireq.user._id).populate('policeStation');
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
