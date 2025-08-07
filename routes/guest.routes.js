// routes/guest.routes.js

const express = require('express');
const router = express.Router();
const {
    registerGuest,
    checkoutGuest,
    searchGuests,
} = require('../controllers/guest.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // 1. Import the upload middleware

// --- Hotel Staff Routes ---

// 2. Add the 'upload' middleware to this route
router.post(
    '/register',
    protect,
    authorize('Hotel'),
    upload.fields([
        { name: 'idImage', maxCount: 1 },
        { name: 'livePhoto', maxCount: 1 }
    ]),
    registerGuest
);

router.put('/:id/checkout', protect, authorize('Hotel'), checkoutGuest);

// --- Police Route ---
router.get('/search', protect, authorize('Police'), searchGuests);

module.exports = router;