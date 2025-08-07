// controllers/user.controller.js
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
// >> 1. Import the new email function
const { sendCredentialsEmail } = require('../utils/sendEmail');

// This is the user registration function
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
        // >> 2. Call the email function after the user is successfully created.
        // This sends the email in the background without making the admin wait.
        sendCredentialsEmail(user.email, user.username, temporaryPassword);

        logger.info(`New user (${user.role}) created by Admin ${req.user.username}: ${user.email}`);
        
        // >> 3. Respond to the admin immediately.
        res.status(201).json({
            message: 'User created successfully. Credentials have been emailed.',
            username: user.username,
            temporaryPassword: temporaryPassword, // Still show credentials on screen as a backup
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});


// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            memberSince: user.createdAt
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Update user password (for logged-in users)
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

// Get all dashboard data
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


// Export all controller functions
module.exports = { 
    registerUser, 
    getUserProfile, 
    updateUserPassword,
    getAdminDashboardData
};
