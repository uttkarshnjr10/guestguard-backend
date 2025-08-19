// controllers/user.controller.js
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const { sendCredentialsEmail } = require('../utils/sendEmail');
const AccessLog = require('../models/AccessLog.model');

// --- Create a new user (Admin action) ---
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, role, details } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    const temporaryPassword = Math.random().toString(36).slice(-8);

    const user = await User.create({
        username,
        email,
        role,
        password: temporaryPassword,
        passwordChangeRequired: true,
        details: details || {},
    });

    if (user) {
        sendCredentialsEmail(user.email, user.username, temporaryPassword);
        logger.info(`New user (${user.role}) created by Admin ${req.user.username}: ${user.email}`);
        
        res.status(201).json({
            message: 'User created successfully. Credentials have been emailed.',
            username: user.username,
            temporaryPassword: temporaryPassword, // backup display
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// --- Get logged-in user's profile ---
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            memberSince: user.createdAt,
            details: user.details
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// --- Update logged-in user's password ---
const updateUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword || newPassword.length < 6) {
        res.status(400);
        throw new Error('Please provide both old and new passwords (min 6 chars for new).');
    }
    
    const user = await User.findById(req.user.id).select('+password');

    if (user && (await user.matchPassword(oldPassword))) {
        user.password = newPassword;
        await user.save();
        logger.info(`Password updated for user: ${user.email}`);
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(401);
        throw new Error('Invalid old password');
    }
});

// --- Get Admin Dashboard Data ---
const getAdminDashboardData = asyncHandler(async (req, res) => {
    const hotelCount = await User.countDocuments({ role: 'Hotel' });
    const policeCount = await User.countDocuments({ role: 'Police' });
    
    const guestRegistrationsToday = 0;
    const policeSearchesToday = 0;

    const recentHotels = await User.find({ role: 'Hotel' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username details status');

    const recentPolice = await User.find({ role: 'Police' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username details status');

    const recentActivityUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('username role');
    
    const activityFeed = recentActivityUsers.map(user => 
        `New ${user.role} user registered: ${user.username}`
    );

    res.json({
        metrics: {
            hotels: hotelCount,
            police: policeCount,
            guestsToday: guestRegistrationsToday,
            searchesToday: policeSearchesToday,
        },
        users: {
            hotels: recentHotels.map(h => ({ name: h.username, location: h.details?.city, status: h.status })),
            police: recentPolice.map(p => ({ name: p.username, location: p.details?.jurisdiction, status: p.status })),
        },
        feed: activityFeed,
    });
});

// --- Get Hotel Users with Filtering ---
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
            { 'details.city': regex }
        ];
    }

    const hotels = await User.find(query).select('username details.city status');

    res.json(hotels.map(h => ({
        id: h._id,
        name: h.username,
        city: h.details?.city,
        status: h.status,
    })));
});

// --- Update a user's status ---
const updateUserStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
        user.status = status;
        const updatedUser = await user.save();
        logger.info(`Admin ${req.user.username} updated status for user ${user.username} to ${status}`);
        res.json({
            id: updatedUser._id,
            status: updatedUser.status,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// --- Delete a user ---
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        logger.info(`Admin ${req.user.username} deleted user ${user.username}`);
        res.json({ message: 'User removed successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// --- Get all access logs with optional search ---
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

    res.status(200).json(logs);
});

// --- Update logged-in user's profile details ---
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.email = req.body.email || user.email;
        if (req.body.details) {
            user.details = { ...user.details, ...req.body.details };
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            details: updatedUser.details,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// --- Get Police Users with Filtering ---
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

    const policeUsers = await User.find(query).select('username details.jurisdiction status');

    res.json(policeUsers.map(p => ({
        id: p._id,
        name: p.username,
        location: p.details?.jurisdiction,
        status: p.status,
    })));
});

// --- Export controller functions ---
module.exports = { 
    registerUser, 
    getUserProfile, 
    updateUserPassword,
    getAdminDashboardData,
    getHotelUsers,
    updateUserStatus,
    deleteUser,
    getAccessLogs,
    updateUserProfile,
    getPoliceUsers,
};
