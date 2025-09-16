// controllers/inquiryController.js

const HotelInquiry = require('../models/HotelInquiry.model');

exports.submitHotelInquiry = async (req, res) => {
    try {
        
        if (!req.files || !req.files.ownerSignature || !req.files.hotelStamp) {
            return res.status(400).json({ message: "Signature and stamp files are required." });
        }

        // Create a new inquiry document
        const newInquiry = new HotelInquiry({
            ...req.body, // Use the spread operator to get all text fields
            ownerSignature: {
                public_id: req.files.ownerSignature[0].filename,
                url: req.files.ownerSignature[0].path
            },
            hotelStamp: {
                public_id: req.files.hotelStamp[0].filename,
                url: req.files.hotelStamp[0].path
            }
        });

        await newInquiry.save();

        res.status(201).json({ 
            message: 'Hotel registration request submitted successfully! We will contact you soon.' 
        });

    } catch (error) {
        console.error("Error submitting hotel inquiry:", error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

exports.getPendingInquiries = async (req, res) => {
    try {
        const inquiries = await HotelInquiry.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.status(200).json(inquiries);
    } catch (error) {
        console.error("Error fetching pending inquiries:", error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

exports.approveInquiry = async (req, res) => {
    try {
        const inquiry = await HotelInquiry.findByIdAndUpdate(
            req.params.id, 
            { status: 'approved' },
            { new: true } // Return the updated document
        );
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.status(200).json({ message: 'Inquiry approved successfully', inquiry });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.rejectInquiry = async (req, res) => {
    try {
        const inquiry = await HotelInquiry.findByIdAndUpdate(
            req.params.id, 
            { status: 'rejected' },
            { new: true }
        );
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.status(200).json({ message: 'Inquiry rejected successfully', inquiry });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};