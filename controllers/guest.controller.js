// controllers/guest.controller.js

const Guest = require('../models/Guest.model');
const Hotel = require('../models/Hotel.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const { generateGuestPDF, generateGuestPDFBuffer } = require('../utils/pdfGenerator');
const { sendCheckoutReceiptEmail } = require('../utils/sendEmail');

/**
 * @desc    Register a new guest
 * @route   POST /api/guests/register
 * @access  Private/Hotel
 */
const registerGuest = asyncHandler(async (req, res) => {
	const hotelStaffId = req.user._id;

	// Find the hotel that this staff member is assigned to
	const hotel = await Hotel.findOne({ registeredBy: hotelStaffId });
	if (!hotel) {
		res.status(404);
		throw new Error('No hotel is associated with your account. Please contact your administrator.');
	}

	// Parse JSON fields that come via multipart/form-data
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

	// Files uploaded by multer-storage-cloudinary
	const idImageFile = req.files?.idImage?.[0];
	const livePhotoFile = req.files?.livePhoto?.[0];

	const idImageURL = idImageFile?.path || idImageFile?.secure_url;
	const livePhotoURL = livePhotoFile?.path || livePhotoFile?.secure_url;

	if (!idImageURL || !livePhotoURL) {
		res.status(400);
		throw new Error('Image upload failed. idImage and livePhoto are required');
	}

	const guest = await Guest.create({
		// The customerId is generated automatically by the model's pre-validate hook
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

	// Generate the PDF buffer once so we can both email it and return it in the response
	const pdfBuffer = await generateGuestPDFBuffer(guest);

	// Fire-and-forget email sending (do not block the HTTP response if email fails)
	if (guest.primaryGuest?.email) {
		try {
			await sendCheckoutReceiptEmail(guest.primaryGuest.email, guest, pdfBuffer);
		} catch (emailErr) {
			logger.error(`Failed to email checkout receipt for ${guest.customerId}:`, emailErr);
		}
	} else {
		logger.info(`No email on file for ${guest.customerId}; skipping receipt email.`);
	}

	// Send the PDF to the client
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', `attachment; filename=checkout_${guest.customerId}.pdf`);
	res.send(pdfBuffer);
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