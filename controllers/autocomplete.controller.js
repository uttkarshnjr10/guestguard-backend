const Guest = require('../models/Guest.model');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

/**
 * @desc    Get autocomplete suggestions for a given field
 * @route   GET /api/autocomplete
 * @access  Private
 */
const getAutocompleteSuggestions = asyncHandler(async (req, res) => {
    const { field, query } = req.query;
    const hotelUserId = req.user._id; // We'll need the logged-in hotel's ID

    if (!field || !query) {
        return res.status(400).json({ message: 'Field and query parameters are required.' });
    }

    let suggestions = [];

    try {
        if (field === 'city' && query.length > 1) {
            // Find distinct cities that start with the query (case-insensitive)
            const distinctCities = await Guest.distinct('primaryGuest.address.city', {
                'primaryGuest.address.city': { $regex: `^${query}`, $options: 'i' }
            });
            suggestions = distinctCities.slice(0, 10);

        // --- ADD THIS NEW BLOCK ---
        } else if (field === 'guestName' && query.length > 2) {
            // Find guests whose names start with the query and belong to the current hotel
            const guests = await Guest.find({
                'hotel': hotelUserId,
                'primaryGuest.name': { $regex: `^${query}`, $options: 'i' }
            })
            .sort({ registrationTimestamp: -1 }) // Show the most recent guests first
            .limit(5); // Limit to 5 suggestions

            // We return the primaryGuest object to pre-fill the form
            suggestions = guests.map(guest => guest.primaryGuest);
        }
        // --- END OF NEW BLOCK ---
        
        res.json(suggestions);

    } catch (error) {
        logger.error(`Error fetching autocomplete suggestions for field "${field}":`, error);
        res.status(500).json({ message: 'Server error fetching suggestions' });
    }
});

module.exports = { getAutocompleteSuggestions };