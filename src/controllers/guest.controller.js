const mongoose = require('mongoose');
const Guest = require('../models/Guest.model');
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const generateGuestPDF = require('../utils/pdfGenerator');
const { sendCheckoutEmail } = require('../utils/sendEmail');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const registerGuest = asyncHandler(async (req, res) => {
    const hotelUserId = req.user._id;

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
        address: {
            street: req.body.primaryGuestAddressStreet,
            city: req.body.primaryGuestAddressCity,
            state: req.body.primaryGuestAddressState,
            zipCode: req.body.primaryGuestAddressZipCode,
            country: req.body.primaryGuestAddressCountry
        },
        nationality: req.body.primaryGuestNationality
    };

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

    const idImageFrontURL = filesMap['idImageFront']?.path;
    const idImageBackURL = filesMap['idImageBack']?.path;
    const livePhotoURL = filesMap['livePhoto']?.path;

    if (!idImageFrontURL || !idImageBackURL || !livePhotoURL) {
        throw new ApiError(400, 'image upload failed. front, back, and live photos are required');
    }

    logger.warn('google vision id verification is temporarily bypassed.');

    const guest = await Guest.create({
        primaryGuest: primaryGuestData,
        idType: req.body.idType,
        idNumber: req.body.idNumber,
        idImageFrontURL,
        idImageBackURL,
        livePhotoURL,
        accompanyingGuests,
        stayDetails,
        hotel: hotelUserId,
    });

    logger.info(`new guest registered (${guest.customerId}) at ${req.user.username}`);
    res
    .status(201)
    .json(new ApiResponse(201, guest, "guest registered successfully!"));
});

const getAllGuests = asyncHandler(async (req, res) => {
    const hotelUserId = req.user._id;

    const guests = await Guest.aggregate([
        { $match: { hotel: new mongoose.Types.ObjectId(hotelUserId) } }, 
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

    res
    .status(200)
    .json(new ApiResponse(200, guests));
});

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

    res
    .status(200)
    .json(new ApiResponse(200, guests));
});

const checkoutGuest = asyncHandler(async (req, res) => {
    const guestId = req.params.id;
    const guest = await Guest.findById(guestId).populate('hotel', 'username email details');

    if (!guest) {
        throw new ApiError(404, 'guest not found');
    }

    if (guest.status === 'Checked-Out') {
        throw new ApiError(400, 'this guest has already been checked out');
    }

    guest.status = 'Checked-Out';
    await guest.save();

    const pdfBuffer = await generateGuestPDF(guest);
    
    const guestEmail = guest.primaryGuest.email;
    const hotelEmail = guest.hotel.email;

    const hotelName = guest.hotel.details.hotelName || guest.hotel.username;

    if (guestEmail && hotelEmail) {
        sendCheckoutEmail(guestEmail, hotelEmail, guest.primaryGuest.name, hotelName, pdfBuffer);
    }

    logger.info(`guest ${guest.customerId} checked out by ${req.user.username}`);

    res
    .status(200)
    .json(new ApiResponse(200, null, 'guest checked out successfully. receipt has been emailed.'));
});

module.exports = {
    registerGuest,
    getAllGuests,
    getTodaysGuests,
    checkoutGuest,
};