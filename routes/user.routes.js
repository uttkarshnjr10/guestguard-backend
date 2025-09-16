// routes/user.routes.js
const express = require('express');
const router = express.Router();


const { 
    registerUser, 
    getUserProfile, 
    updateUserPassword,
    getAdminDashboardData,
    getHotelUsers,       // For /hotels route
    updateUserStatus,    // For PUT /:id/status
    deleteUser,  
    getAccessLogs,
    updateUserProfile,
    getPoliceUsers
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

// GET /api/users/hotels
// Fetch all users with the 'Hotel' role
router.get(
    '/hotels', 
    protect, 
    authorize('Regional Admin'), 
    getHotelUsers
);

// PUT /api/users/:id/status
// Update a specific user's status (Active, Suspended, etc.)
router.put(
    '/:id/status',
    protect,
    authorize('Regional Admin'),
    updateUserStatus
);

// DELETE /api/users/:id
// Delete a user from the database
router.delete(
    '/:id',
    protect,
    authorize('Regional Admin'),
    deleteUser
);
router.get(
    '/admin/logs',
    protect,
    authorize('Regional Admin'),
    getAccessLogs
);
// --- General Authenticated User Routes ---

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// PUT /api/users/change-password
router.put('/change-password', protect, updateUserPassword);

router.get(
    '/police',
    protect,
    authorize('Regional Admin'),
    getPoliceUsers
);

module.exports = router;
