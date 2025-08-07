// controllers/hotel.controller.js

const Hotel = require('../models/Hotel.model');
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

/**
 * @desc    Register a new hotel
 * @route   POST /api/hotels
 * @access  Private/Regional Admin
 */
const registerHotel = asyncHandler(async (req, res) => {
    const { name, city, address, hotelUserId } = req.body;

    if (!name || !city || !address || !hotelUserId) {
        res.status(400);
        throw new Error('Name, city, address, and an assigned Hotel User ID are required');
    }

    // Check if the assigned user exists and has the 'Hotel' role
    const assignedUser = await User.findById(hotelUserId);
    if (!assignedUser || assignedUser.role !== 'Hotel') {
        res.status(400);
        throw new Error('The provided user ID is not a valid Hotel staff member');
    }

    const hotel = await Hotel.create({
        name,
        city,
        address,
        // We link the hotel to the hotel staff user, NOT the admin creating it
        registeredBy: hotelUserId,
    });

    logger.info(`New hotel registered: ${hotel.name} by Admin ${req.user.username}`);
    res.status(201).json(hotel);
});

/**
 * @desc    Get all hotels
 * @route   GET /api/hotels
 * @access  Private/Regional Admin
 */
const getAllHotels = asyncHandler(async (req, res) => {
    const hotels = await Hotel.find({}).populate('registeredBy', 'username email');
    res.status(200).json(hotels);
});

/**
 * @desc    Update a hotel's status
 * @route   PUT /api/hotels/:id/status
 * @access  Private/Regional Admin
 */
const updateHotelStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const hotelId = req.params.id;

    if (!status || !['Active', 'Suspended'].includes(status)) {
        res.status(400);
        throw new Error("Status must be 'Active' or 'Suspended'");
    }

    const hotel = await Hotel.findByIdAndUpdate(hotelId, { status }, { new: true });

    if (!hotel) {
        res.status(404);
        throw new Error('Hotel not found');
    }
    
    logger.info(`Hotel status for ${hotel.name} updated to ${status} by Admin ${req.user.username}`);
    res.status(200).json(hotel);
});

module.exports = {
    registerHotel,
    getAllHotels,
    updateHotelStatus,
};