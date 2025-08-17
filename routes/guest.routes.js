const express = require('express');
const router = express.Router();

const {
    registerGuest,
    checkoutGuest,
    searchGuests,
    getTodaysGuests,
    getAllGuests // New import
} = require('../controllers/guest.controller');

const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// --- Hotel Staff Routes ---

// Register guest with file uploads
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

// Get today's guests
router.get(
    '/today',
    protect,
    authorize('Hotel'),
    getTodaysGuests
);

// Get all guests for the hotel
router.get(
    '/all',
    protect,
    authorize('Hotel'),
    getAllGuests
);

// Checkout guest
router.put(
    '/:id/checkout',
    protect,
    authorize('Hotel'),
    checkoutGuest
);

// --- Police Route ---
router.get(
    '/search',
    protect,
    authorize('Police'),
    searchGuests
);

module.exports = router;
