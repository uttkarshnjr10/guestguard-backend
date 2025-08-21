// controllers/upload.controller.js
const asyncHandler = require('express-async-handler');
const { cloudinaryUploadImage } = require('../utils/cloudinary');
const fs = require('fs');

/**
 * @desc    Upload a single image
 * @route   POST /api/upload/single-image
 * @access  Private (Hotel)
 */
const uploadSingleImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided.');
    }

    try {
        const { path } = req.file;
        const newPath = await cloudinaryUploadImage(path);
        
        // Clean up the locally saved file after uploading to Cloudinary
        fs.unlinkSync(path);

        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl: newPath.url
        });
    } catch (error) {
        console.error("Error uploading single image:", error);
        res.status(500);
        throw new Error("Image could not be uploaded.");
    }
});

module.exports = { uploadSingleImage };