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


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'guest-guard', 
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }] 
    },
});


const hotelInquiryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hotel_inquiries', 
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const hotelInquiryUpload = multer({ storage: hotelInquiryStorage }).fields([
    { name: 'ownerSignature', maxCount: 1 },
    { name: 'hotelStamp', maxCount: 1 }
]);


// Initialize Multer with the storage configuration

const photoUpload = multer({ storage: storage });


// Export it inside an object
module.exports = { photoUpload, hotelInquiryUpload  };

