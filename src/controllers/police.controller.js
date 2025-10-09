const Guest = require('../models/Guest.model');
const AccessLog = require('../models/AccessLog.model');
const User = require('../models/User.model');
const Alert = require('../models/Alert.model'); 
const Remark = require('../models/Remark.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const searchGuests = asyncHandler(async (req, res) => {
    const { query, searchBy, reason } = req.body;

    if (!query || !searchBy || !reason) {
        throw new ApiError(400, 'search query, type (searchby), and reason are required');
    }

    await AccessLog.create({
        user: req.user._id,
        action: 'Guest Search',
        searchQuery: `${searchBy}: ${query}`,
        reason: reason,
    });

    let searchCriteria = {};
    const regex = new RegExp(query, 'i');

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
            throw new ApiError(400, "invalid searchby value. use 'name', 'phone', or 'id'");
    }

    const guests = await Guest.find(searchCriteria).populate('hotel', 'username details.city');

    logger.info(`police user ${req.user.username} searched for guests by ${searchBy}`);
    res
    .status(200)
    .json(new ApiResponse(200, guests));
});

const getDashboardData = asyncHandler(async (req, res) => {
    const hotelCount = await User.countDocuments({ role: 'Hotel' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const guestsTodayCount = await Guest.countDocuments({
        registrationTimestamp: { $gte: startOfToday }
    });
    
    // fetch real alerts instead of placeholder data
    const recentAlerts = await Alert.find({ status: 'Open' })
        .populate('guest', 'primaryGuest.name')
        .sort({ createdAt: -1 })
        .limit(5);

    const dashboardData = {
        totalHotels: hotelCount,
        guestsToday: guestsTodayCount,
        alerts: recentAlerts,
    };

    res
    .status(200)
    .json(new ApiResponse(200, dashboardData));
});

const createAlert = asyncHandler(async (req, res) => {
    const { guestId, reason } = req.body;
    if (!guestId || !reason) {
        throw new ApiError(400, 'guest id and reason are required');
    }

    const guestExists = await Guest.findById(guestId);
    if (!guestExists) {
        throw new ApiError(404, 'guest not found');
    }

    const alert = await Alert.create({
        guest: guestId,
        reason,
        createdBy: req.user._id,
    });

    await AccessLog.create({
        user: req.user._id,
        action: 'Alert Created',
        reason: `flagged guest ${guestExists.primaryGuest.name} for: ${reason}`,
    });

    logger.info(`police user ${req.user.username} created an alert for guest ${guestId}`);
    res
    .status(201)
    .json(new ApiResponse(201, alert, 'alert created successfully'));
});

const getAlerts = asyncHandler(async (req, res) => {
    const alerts = await Alert.find()
        .populate('guest', 'primaryGuest.name idNumber')
        .populate('createdBy', 'username details.station')
        .sort({ createdAt: -1 });

    res
    .status(200)
    .json(new ApiResponse(200, alerts));
});

const resolveAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
        throw new ApiError(404, 'alert not found');
    }

    alert.status = 'Resolved';
    const updatedAlert = await alert.save();
    
    logger.info(`police user ${req.user.username} resolved alert ${req.params.id}`);
    res
    .status(200)
    .json(new ApiResponse(200, updatedAlert, 'alert resolved'));
});

const getGuestHistory = asyncHandler(async (req, res) => {
    const guestId = req.params.id;
    const guest = await Guest.findById(guestId);
    if (!guest) {
        throw new ApiError(404, 'guest not found');
    }

    // find all stays by the same person using their unique ID number
    const stayHistory = await Guest.find({ idNumber: guest.idNumber })
        .populate('hotel', 'username details.city')
        .sort({ 'stayDetails.checkIn': -1 });
    
    const guestIds = stayHistory.map(g => g._id);

    const alerts = await Alert.find({ guest: { $in: guestIds } }).populate('createdBy', 'username');
    const remarks = await Remark.find({ guest: { $in: guestIds } }).populate('officer', 'username').sort({ createdAt: -1 });

    const historyData = {
        primaryGuest: guest,
        stayHistory,
        alerts,
        remarks
    };

    res
    .status(200)
    .json(new ApiResponse(200, historyData));
});

const addRemark = asyncHandler(async (req, res) => {
    const guestId = req.params.id;
    const { text } = req.body;
    if (!text) {
        throw new ApiError(400, 'remark text is required');
    }

    const remark = await Remark.create({
        guest: guestId,
        officer: req.user._id,
        text,
    });
    
    const populatedRemark = await remark.populate('officer', 'username');
    res
    .status(201)
    .json(new ApiResponse(201, populatedRemark, 'remark added successfully'));
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