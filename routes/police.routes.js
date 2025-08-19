// routes/police.routes.js
const express = require('express');
const router = express.Router();

const { 
    searchGuests, 
    getDashboardData,
    createAlert,
    getAlerts,
    resolveAlert,
    getGuestHistory,
    addRemark
} = require('../controllers/police.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// All routes in this file are protected and can only be accessed by Police
router.use(protect, authorize('Police'));

// Dashboard route
router.get('/dashboard', getDashboardData);

// Guest search route
router.post('/search', searchGuests);

// Alert routes
router.route('/alerts')
    .post(createAlert)   // Create new alert
    .get(getAlerts);     // Get all alerts

router.put('/alerts/:id/resolve', resolveAlert); // Mark alert as resolved

// Guest history + remarks routes
router.get('/guests/:id/history', getGuestHistory); // View guest history
router.post('/guests/:id/remarks', addRemark);     // Add remark to a guest

module.exports = router;
