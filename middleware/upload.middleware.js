// middleware/upload.middleware.js

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'guest-guard', // The name of the folder in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }] // Resize images
    },
});

const hotelInquiryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hotel_inquiries', // New folder for better organization
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const hotelInquiryUpload = multer({ storage: hotelInquiryStorage }).fields([
    { name: 'ownerSignature', maxCount: 1 },
    { name: 'hotelStamp', maxCount: 1 }
]);
// Initialize Multer with the storage configuration

// 1. Initialize Multer and name the variable 'photoUpload'
const photoUpload = multer({ storage: storage });

// 2. Export it inside an object
module.exports = { photoUpload, hotelInquiryUpload  };