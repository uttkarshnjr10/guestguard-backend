// utils/pdfGenerator.js

const PDFDocument = require('pdfkit');

function generateGuestPDF(guest, res) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Pipe the PDF document directly to the response stream
    doc.pipe(res);

    // --- PDF Header ---
    doc.fontSize(20).font('Helvetica-Bold').text('Guest Checkout Receipt', { align: 'center' });
    doc.moveDown();

    // --- Hotel Information ---
    doc.fontSize(16).font('Helvetica-Bold').text('Hotel Information');
    doc.fontSize(12).font('Helvetica').text(`Hotel Name: ${guest.hotel.name}`);
    doc.text(`Location: ${guest.hotel.city}`);
    doc.moveDown();

    // --- Guest Details ---
    doc.fontSize(16).font('Helvetica-Bold').text('Primary Guest Details');
    doc.fontSize(12).font('Helvetica');
    doc.text(`Customer ID: ${guest.customerId}`);
    doc.text(`Name: ${guest.primaryGuest.name}`);
    doc.text(`Phone: ${guest.primaryGuest.phone}`);
    doc.text(`Address: ${guest.primaryGuest.address}`);
    doc.moveDown();

    // --- Stay Details ---
    doc.fontSize(16).font('Helvetica-Bold').text('Stay Information');
    doc.fontSize(12).font('Helvetica');
    doc.text(`Check-In Date: ${new Date(guest.stayDetails.checkIn).toLocaleString()}`);
    doc.text(`Check-Out Date: ${new Date().toLocaleString()}`); // Current time for checkout
    doc.text(`Room Number: ${guest.stayDetails.roomNumber || 'N/A'}`);
    doc.moveDown();
    
    // --- Footer ---
    doc.fontSize(10).text('Thank you for staying with us!', {
        align: 'center',
        lineGap: 10,
    });

    // Finalize the PDF and end the stream
    doc.end();
}

module.exports = generateGuestPDF;