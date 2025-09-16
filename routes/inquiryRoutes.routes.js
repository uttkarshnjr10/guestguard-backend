// routes/inquiryRoutes.js

const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.Controller.js');
const { hotelInquiryUpload } = require('../middleware/upload.middleware.js');


const { protect, authorize } = require('../middleware/auth.middleware.js'); 


router.post('/hotel-registration', hotelInquiryUpload, inquiryController.submitHotelInquiry);


router.get(
    '/pending',
    protect,                        // First, checks if the user is logged in
    authorize('Regional Admin'),    // Second, checks if their role is 'Regional Admin'
    inquiryController.getPendingInquiries
);

router.post(
    '/:id/approve',
    protect,
    authorize('Regional Admin'),
    inquiryController.approveInquiry
);


router.post(
    '/:id/reject',
    protect,
    authorize('Regional Admin'),
    inquiryController.rejectInquiry
);

module.exports = router;