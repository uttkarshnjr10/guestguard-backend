const express = require('express');
const router = express.Router();

const { 
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
} = require('../controllers/user.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// for all users
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.put('/change-password', protect, updateUserPassword);

// admin Only Routes 
router.post('/register', protect, authorize('Regional Admin'), registerUser);
router.get('/admin/dashboard', protect, authorize('Regional Admin'), getAdminDashboardData);
router.get('/admin/logs', protect, authorize('Regional Admin'), getAccessLogs);

//  hotel users
router.get('/hotels', protect, authorize('Regional Admin'), getHotelUsers);

//  managing police users
router.get('/police', protect, authorize('Regional Admin'), getPoliceUsers);

//  managing any user by ID
router.put('/:id/status', protect, authorize('Regional Admin'), updateUserStatus);
router.delete('/:id', protect, authorize('Regional Admin'), deleteUser);

module.exports = router;