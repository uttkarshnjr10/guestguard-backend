// routes/hotel.routes.js

const express = require('express');
const router = express.Router();
const {
    registerHotel,
    getAllHotels,
    updateHotelStatus,
} = require('../controllers/hotel.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes in this file are protected and can only be accessed by a Regional Admin
router.use(protect, authorize('Regional Admin'));

router.route('/')
    .post(registerHotel)  // POST /api/hotels
    .get(getAllHotels);    // GET /api/hotels

router.route('/:id/status')
    .put(updateHotelStatus); // PUT /api/hotels/123/status

module.exports = router;