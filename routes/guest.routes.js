// routes/guest.routes.js

const express = require('express');
const router = express.Router();

const {
  registerGuest,
  checkoutGuest,
  searchGuests,
  getTodaysGuests,
  getAllGuests
} = require('../controllers/guest.controller');

const { protect, authorize } = require('../middleware/auth.middleware');
// 1. CHANGE THIS LINE: Use destructuring to import photoUpload
const { photoUpload } = require('../middleware/upload.middleware');

// --- Hotel Staff Routes ---

// Register guest with file uploads (front ID, back ID, live photo)
router.post(
  '/register',
  protect,
  authorize('Hotel'),
  // 2. CHANGE THIS LINE: Use the correct variable name 'photoUpload'
  photoUpload.fields([
    { name: 'idImageFront', maxCount: 1 },
    { name: 'idImageBack', maxCount: 1 },
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