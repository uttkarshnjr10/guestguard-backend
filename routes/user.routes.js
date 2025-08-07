// routes/user.routes.js
const express = require('express');
const router = express.Router();
// >> Make sure all necessary functions are imported from the controller
const { 
    registerUser, 
    getUserProfile, 
    updateUserPassword,
    getAdminDashboardData
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// --- Regional Admin Routes ---

// POST /api/users/register
router.post(
    '/register',
    protect,
    authorize('Regional Admin'),
    registerUser
);

// GET /api/users/admin/dashboard
router.get(
    '/admin/dashboard', 
    protect, 
    authorize('Regional Admin'), 
    getAdminDashboardData
);


// --- General Authenticated User Routes ---

// >> FIX: This GET route for '/profile' was missing or incorrect.
// It tells Express: "When a GET request comes to /api/users/profile,
// first run the 'protect' middleware, then run the 'getUserProfile' controller."
router.get('/profile', protect, getUserProfile);

// PUT /api/users/change-password
router.put('/change-password', protect, updateUserPassword);


module.exports = router;
