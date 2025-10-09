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

router.use(protect, authorize('Police'));

router.get('/dashboard', getDashboardData);
router.post('/search', searchGuests);
router.route('/alerts').post(createAlert).get(getAlerts);
router.put('/alerts/:id/resolve', resolveAlert);
router.get('/guests/:id/history', getGuestHistory);
router.post('/guests/:id/remarks', addRemark);

module.exports = router;