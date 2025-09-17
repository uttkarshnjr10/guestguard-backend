// controllers/police.controller.js
const Guest = require('../models/Guest.model');
const AccessLog = require('../models/AccessLog.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const User = require('../models/User.model');
const Alert = require('../models/Alert.model'); 
const Remark = require('../models/Remark.model');

/**
 * @desc     Search for guests
 * @route    POST /api/police/search
 * @access   Private/Police
 */
const searchGuests = asyncHandler(async (req, res) => {
    const { query, searchBy, reason } = req.body;

    if (!query || !searchBy || !reason) {
        res.status(400);
        throw new Error('Search query, type (searchBy), and reason are required.');
    }

    // Log the search action immediately for auditing
    await AccessLog.create({
        user: req.user._id,
        action: 'Guest Search',
        searchQuery: `${searchBy}: ${query}`,
        reason: reason,
    });

    let searchCriteria = {};
    const regex = new RegExp(query, 'i'); // Case-insensitive search

    switch (searchBy) {
        case 'name':
            searchCriteria['primaryGuest.name'] = regex;
            break;
        case 'phone':
            searchCriteria['primaryGuest.phone'] = regex;
            break;
        case 'id':
            searchCriteria['idNumber'] = regex;
            break;
        default:
            res.status(400);
            throw new Error("Invalid searchBy value. Use 'name', 'phone', or 'id'.");
    }

    const guests = await Guest.find(searchCriteria).populate('hotel', 'username details.city');

    logger.info(`Police user ${req.user.username} searched for guests by ${searchBy}`);
    res.status(200).json(guests);
});

/**
 * @desc     Get data for the police dashboard
 * @route    GET /api/police/dashboard
 * @access   Private/Police
 */
const getDashboardData = asyncHandler(async (req, res) => {
    const hotelCount = await User.countDocuments({ role: 'Hotel' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const guestsTodayCount = await Guest.countDocuments({
        registrationTimestamp: { $gte: startOfToday, $lte: endOfToday }
    });

    const recentAlerts = [
        { id: 1, message: "Alert feature is under development." }
    ];

    res.status(200).json({
        totalHotels: hotelCount,
        guestsToday: guestsTodayCount,
        alerts: recentAlerts,
    });
});
/**
 * @desc     Create a new alert for a guest
 * @route    POST /api/police/alerts
 * @access   Private/Police
 */
const createAlert = asyncHandler(async (req, res) => {
    const { guestId, reason } = req.body;

    if (!guestId || !reason) {
        res.status(400);
        throw new Error('Guest ID and reason are required to create an alert.');
    }

    const guestExists = await Guest.findById(guestId);
    if (!guestExists) {
        res.status(404);
        throw new Error('Guest not found.');
    }

    const alert = await Alert.create({
        guest: guestId,
        reason,
        createdBy: req.user._id,
    });

    // Log this action
    await AccessLog.create({
        user: req.user._id,
        action: 'Alert Created',
        reason: `Flagged guest ${guestExists.primaryGuest.name} for: ${reason}`,
    });

    logger.info(`Police user ${req.user.username} created an alert for guest ${guestId}`);
    res.status(201).json(alert);
});

/**
 * @desc     Get all alerts
 * @route    GET /api/police/alerts
 * @access   Private/Police
 */
const getAlerts = asyncHandler(async (req, res) => {
    const alerts = await Alert.find()
        .populate('guest', 'primaryGuest.name idNumber')
        .populate('createdBy', 'username details.station')
        .sort({ createdAt: -1 }); // Show newest first

    res.status(200).json(alerts);
});

/**
 * @desc     Resolve an alert
 * @route    PUT /api/police/alerts/:id/resolve
 * @access   Private/Police
 */
const resolveAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
        res.status(404);
        throw new Error('Alert not found');
    }

    alert.status = 'Resolved';
    await alert.save();
    
    logger.info(`Police user ${req.user.username} resolved alert ${req.params.id}`);
    res.status(200).json(alert);
});
/**
 * @desc     Get a specific guest's full history
 * @route    GET /api/police/guests/:id/history
 * @access   Private/Police
 */
const getGuestHistory = asyncHandler(async (req, res) => {
    const guestId = req.params.id;

    // 1. Get the primary guest document
    const primaryGuest = await Guest.findById(guestId).populate('hotel', 'username');
    if (!primaryGuest) {
        res.status(404);
        throw new Error('Guest not found');
    }

    // 2. Find all other stays by the same person (using their ID number)
    const stayHistory = await Guest.find({ 
        idNumber: primaryGuest.idNumber 
    }).populate('hotel', 'username details.city').sort({ 'stayDetails.checkIn': -1 });

    // 3. Find all alerts for this guest
    // Note: This only finds alerts for the primary guest document, not all linked stays.
    // A more advanced implementation might link alerts to the person, not the stay.
    const alerts = await Alert.find({ guest: guestId }).populate('createdBy', 'username');

    // 4. Find all remarks for this guest
    const remarks = await Remark.find({ guest: guestId }).populate('officer', 'username').sort({ createdAt: -1 });

    res.status(200).json({
        primaryGuest,
        stayHistory,
        alerts,
        remarks
    });
});

/**
 * @desc     Add a remark to a guest's profile
 * @route    POST /api/police/guests/:id/remarks
 * @access   Private/Police
 */
const addRemark = asyncHandler(async (req, res) => {
    const guestId = req.params.id;
    const { text } = req.body;

    if (!text) {
        res.status(400);
        throw new Error('Remark text is required.');
    }

    const remark = await Remark.create({
        guest: guestId,
        officer: req.user._id,
        text,
    });
    
    const populatedRemark = await remark.populate('officer', 'username');

    res.status(201).json(populatedRemark);
});
module.exports = {
    searchGuests,
    getDashboardData,
    createAlert,
    getAlerts,
    resolveAlert,
    getGuestHistory,
    addRemark,
};