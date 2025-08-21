// routes/policeStation.routes.js
const express = require('express');
const router = express.Router();
const { createStation } = require('../controllers/policeStation.controller');
const PoliceStation = require('../models/PoliceStation.model');
const { protect, authorize } = require('../middleware/auth.middleware');

// @desc    Get all police stations
// @route   GET /api/stations
router.get('/', protect, authorize('Admin', 'Regional Admin'), async (req, res) => {
    try {
        const stations = await PoliceStation.find({}).select('name _id city pincodes');
        res.json(stations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new police station
// @route   POST /api/stations
router.post('/', protect, authorize('Admin', 'Regional Admin'), createStation);

module.exports = router;