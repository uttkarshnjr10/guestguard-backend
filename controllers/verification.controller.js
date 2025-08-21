// controllers/verification.controller.js
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const asyncHandler = require('express-async-handler');
const stringSimilarity = require('string-similarity'); // We'll install this library

// Initialize the client
const client = new ImageAnnotatorClient({
    keyFilename: 'google-credentials.json' // Path to your key file
});

/**
 * @desc    Verify text from an ID image
 * @route   POST /api/verify/id-text
 * @access  Private (Hotel)
 */
const verifyIdText = asyncHandler(async (req, res) => {
    const { imageUrl, nameEntered } = req.body;

    if (!imageUrl || !nameEntered) {
        res.status(400);
        throw new Error('Image URL and the name entered are required.');
    }

    try {
        // Use the Vision API to detect text in the image
        const [result] = await client.textDetection(imageUrl);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            res.status(404);
            throw new Error('No text found on the ID card.');
        }

        // The first element in the array is the full text block
        const fullText = detections[0].description;
        
        // Use a library to find the best match for the entered name within the full text
        const nameOnId = findBestNameMatch(nameEntered, fullText);
        
        // Compare the names
        const similarity = stringSimilarity.compareTwoStrings(
            nameEntered.toLowerCase(), 
            nameOnId.toLowerCase()
        );

        if (similarity > 0.7) { // 70% similarity threshold
            res.json({
                match: true,
                nameOnId: nameOnId,
                similarity: Math.round(similarity * 100),
                message: 'Name successfully verified.'
            });
        } else {
            res.json({
                match: false,
                nameOnId: nameOnId,
                similarity: Math.round(similarity * 100),
                message: 'Name does not match the ID. Please review.'
            });
        }
    } catch (error) {
        console.error('Google Vision API Error:', error);
        res.status(500).json({ message: 'Failed to process ID card image.' });
    }
});

// Helper function to find the best name match in a block of text
function findBestNameMatch(name, textBlock) {
    const nameParts = name.trim().split(/\s+/);
    const textLines = textBlock.split('\n');
    let bestMatch = '';
    let highestScore = 0;

    for (const line of textLines) {
        // A simple check: if a line contains the first name, consider it a candidate
        if (line.toLowerCase().includes(nameParts[0].toLowerCase())) {
            const score = stringSimilarity.compareTwoStrings(name.toLowerCase(), line.toLowerCase());
            if (score > highestScore) {
                highestScore = score;
                bestMatch = line.trim();
            }
        }
    }
    return bestMatch || 'Name not found';
}

module.exports = { verifyIdText };