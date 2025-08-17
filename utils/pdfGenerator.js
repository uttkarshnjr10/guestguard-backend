// utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

/**
 * Generates a guest checkout PDF and returns it as a Buffer.
 * @param {object} guest - The guest document from Mongoose.
 * @returns {Promise<Buffer>} A promise that resolves with the PDF buffer.
 */
function generateGuestPDF(guest) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // --- PDF Header ---
    doc.fontSize(20).font('Helvetica-Bold').text('Guest Checkout Receipt', { align: 'center' });
    doc.moveDown();

    // --- Hotel Information ---
    doc.fontSize(16).font('Helvetica-Bold').text('Hotel Information');
    doc.fontSize(12).font('Helvetica').text(`Hotel Name: ${guest.hotel?.username || 'N/A'}`);
    doc.text(`Location: ${guest.hotel?.details?.city || 'N/A'}`);
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
    doc.text(`Check-Out Date: ${new Date().toLocaleString()}`);
    doc.text(`Room Number: ${guest.stayDetails.roomNumber || 'N/A'}`);
    doc.moveDown();
    
    // --- Accompanying Guests (NEW) ---
    const adults = guest.accompanyingGuests?.adults || [];
    const children = guest.accompanyingGuests?.children || [];

    if (adults.length > 0 || children.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold').text('Accompanying Guests');
        doc.fontSize(12).font('Helvetica');
        if (adults.length > 0) {
            doc.font('Helvetica-Bold').text('Adults:');
            adults.forEach(adult => doc.font('Helvetica').text(`- ${adult.name}`));
            doc.moveDown(0.5);
        }
        if (children.length > 0) {
            doc.font('Helvetica-Bold').text('Children:');
            children.forEach(child => doc.font('Helvetica').text(`- ${child.name}`));
        }
        doc.moveDown();
    }

    // --- Footer ---
    doc.fontSize(10).text('Thank you for staying with us!', {
        align: 'center',
        lineGap: 10,
    });

    // Finalize the PDF
    doc.end();
  });
}

module.exports = generateGuestPDF;
