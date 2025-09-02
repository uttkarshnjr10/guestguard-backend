const { ImageAnnotatorClient } = require('@google-cloud/vision');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

// Creates a client
const visionClient = new ImageAnnotatorClient();

/**
 * @desc    Scan an ID card image and extract text
 * @route   POST /api/ocr/scan
 * @access  Private/Hotel
 */
const scanIdCard = asyncHandler(async (req, res) => {
    // Check if an image was uploaded
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided for scanning.');
    }

    try {
        // Use the path of the uploaded file to perform text detection
        const [result] = await visionClient.textDetection(req.file.path);
        const detections = result.textAnnotations;

        if (detections && detections.length > 0) {
            // The first element in the array contains the full block of detected text
            const fullText = detections[0].description;
            res.status(200).json({ text: fullText });
        } else {
            res.status(404).json({ message: 'No text found on the image.' });
        }

    } catch (error) {
        logger.error('Google Vision API Error:', error);
        res.status(500);
        throw new Error('Failed to process the image with the AI service.');
    }
});

module.exports = { scanIdCard };