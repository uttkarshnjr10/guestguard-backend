// controllers/policeStation.controller.js
const PoliceStation = require('../models/PoliceStation.model');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Create a new police station
 * @route   POST /api/stations
 * @access  Private (Admin, Regional Admin)
 */
const createStation = asyncHandler(async (req, res) => {
    const { name, city, pincodes } = req.body;

    if (!name || !city || !pincodes) {
        res.status(400);
        throw new Error('Please provide name, city, and pincodes');
    }

    const pincodesArray = Array.isArray(pincodes) ? pincodes : pincodes.split(',').map(p => p.trim());

    const stationExists = await PoliceStation.findOne({ name });

    if (stationExists) {
        res.status(400);
        throw new Error('A police station with this name already exists');
    }

    const station = await PoliceStation.create({
        name,
        city,
        pincodes: pincodesArray,
    });

    res.status(201).json(station);
});

module.exports = { createStation };