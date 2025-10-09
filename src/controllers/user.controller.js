// src/controllers/user.controller.js
const User = require('../models/User.model');
const AccessLog = require('../models/AccessLog.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const { sendCredentialsEmail } = require('../utils/sendEmail');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, role, details, policeStation } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new ApiError(400, 'user with this email already exists');
    }

    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    const userToCreate = {
        username,
        email,
        role,
        password: temporaryPassword,
        passwordChangeRequired: true,
        details: details || {},
    };

    if (role === 'Police' && policeStation) {
        userToCreate.policeStation = policeStation;
    }

    const user = await User.create(userToCreate);

    if (user) {
        sendCredentialsEmail(user.email, user.username, temporaryPassword);
        logger.info(`new user (${user.role}) created by admin ${req.user.username}: ${user.email}`);
        
        const responseData = {
            message: 'user created successfully. credentials have been emailed.',
            username: user.username,
        };
        res.status(201).json(new ApiResponse(201, responseData));

    } else {
        throw new ApiError(400, 'invalid user data');
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        throw new ApiError(404, 'user not found');
    }
    res.status(200).json(new ApiResponse(200, user));
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        throw new ApiError(404, 'user not found');
    }

    user.email = req.body.email || user.email;
    if (req.body.details) {
        user.details = { ...user.details, ...req.body.details };
    }

    const updatedUser = await user.save();
    res
    .status(200)
    .json(new ApiResponse(200, updatedUser, 'profile updated successfully'));
});


const updateUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword || newPassword.length < 6) {
        throw new ApiError(400, 'please provide both old and new passwords (min 6 chars for new)');
    }
    
    const user = await User.findById(req.user.id).select('+password');

    if (user && (await user.matchPassword(oldPassword))) {
        user.password = newPassword;
        user.passwordChangeRequired = false;
        await user.save();
        logger.info(`password updated for user: ${user.email}`);

        res
        .status(200)
        .json(new ApiResponse(200, null, 'password updated successfully'));

    } else {
        throw new ApiError(401, 'invalid old password');
    }
});

const getAdminDashboardData = asyncHandler(async (req, res) => {
    const hotelCount = await User.countDocuments({ role: 'Hotel' });
    const policeCount = await User.countDocuments({ role: 'Police' });

    const guestRegistrationsToday = 0;
    const policeSearchesToday = 0;

    const recentHotels = await User.find({ role: 'Hotel' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username details.city status');

    const recentPolice = await User.find({ role: 'Police' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username details.jurisdiction status');

    const dashboardData = {
        metrics: {
            hotels: hotelCount,
            police: policeCount,
            guestsToday: guestRegistrationsToday,
            searchesToday: policeSearchesToday,
        },
        users: {
            hotels: recentHotels,
            police: recentPolice,
        },
    };

    res
    .status(200)
    .json(new ApiResponse(200, dashboardData));
});

const getHotelUsers = asyncHandler(async (req, res) => {
    const { searchTerm, status } = req.query;
    const query = { role: 'Hotel' };

    if (status && status !== 'All') {
        query.status = status;
    }

    if (searchTerm) {
        const regex = new RegExp(searchTerm, 'i');
        query.$or = [
            { username: regex },
            { 'details.city': regex },
            { 'details.hotelName': regex },
        ];
    }

    const hotels = await User.find(query).select('-password');
    res
    .status(200)
    .json(new ApiResponse(200, hotels));
});

const getPoliceUsers = asyncHandler(async (req, res) => {
    const { searchTerm, status } = req.query;
    const query = { role: 'Police' };

    if (status && status !== 'All') {
        query.status = status;
    }

    if (searchTerm) {
        const regex = new RegExp(searchTerm, 'i');
        query.$or = [
            { username: regex },
            { 'details.station': regex },
            { 'details.jurisdiction': regex }
        ];
    }

    const policeUsers = await User.find(query).select('-password');
    res
    .status(200)
    .json(new ApiResponse(200, policeUsers));
});

const updateUserStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
        user.status = status;
        const updatedUser = await user.save();
        logger.info(`admin ${req.user.username} updated status for user ${user.username} to ${status}`);

        res
        .status(200)
        .json(new ApiResponse(200, updatedUser, 'user status updated'));
    } else {
        throw new ApiError(404, 'user not found');
    }
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        logger.info(`admin ${req.user.username} deleted user ${user.username}`);

        res
        .status(200)
        .json(new ApiResponse(200, null, 'user removed successfully'));
    } else {
        throw new ApiError(404, 'user not found');
    }
});

const getAccessLogs = asyncHandler(async (req, res) => {
    const { searchTerm } = req.query;
    let query = {};

    if (searchTerm) {
        const regex = new RegExp(searchTerm, 'i');
        const users = await User.find({ username: regex }).select('_id');
        const userIds = users.map(user => user._id);

        query.$or = [
            { action: regex },
            { reason: regex },
            { searchQuery: regex },
            { user: { $in: userIds } }
        ];
    }

    const logs = await AccessLog.find(query)
        .populate('user', 'username role')
        .sort({ timestamp: -1 });

    res
    .status(200)
    .json(new ApiResponse(200, logs));
});

module.exports = { 
    registerUser, 
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    getAdminDashboardData,
    getHotelUsers,
    getPoliceUsers,
    updateUserStatus,
    deleteUser,
    getAccessLogs,
};