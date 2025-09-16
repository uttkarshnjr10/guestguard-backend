// routes/guest.routes.js

const express = require('express');
const router = express.Router();

const {
  registerGuest,
  checkoutGuest,
  searchGuests,
  getTodaysGuests,
  getAllGuests
} = require('../controllers/guest.controller.js'); 

const { protect, authorize } = require('../middleware/auth.middleware.js');

const { photoUpload } = require('../middleware/upload.middleware.js');

// Register guest with file uploads (front ID, back ID, live photo)
router.post(
  '/register',
  protect,
  authorize('Hotel'),
 
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

//  Police Route
router.get(
  '/search',
  protect,
  authorize('Police'),
  searchGuests
);

module.exports = router;