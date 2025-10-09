const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

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

const photoUpload = multer({ storage: storage });
const hotelInquiryUpload = multer({ storage: hotelInquiryStorage }).fields([
    { name: 'ownerSignature', maxCount: 1 },
    { name: 'hotelStamp', maxCount: 1 }
]);

module.exports = { photoUpload, hotelInquiryUpload };