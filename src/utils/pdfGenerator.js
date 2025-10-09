const PDFDocument = require('pdfkit');
const logger = require('./logger');

const config = {
    size: 'A4',
    margin: 40,
    fonts: {
        bold: 'Helvetica-Bold',
        normal: 'Helvetica',
        italic: 'Helvetica-Oblique',
    },
    fontSizes: {
        header: 18,
        title: 12,
        body: 10,
        footer: 8,
    },
    colors: {
        primary: '#1976D2', 
        textPrimary: '#111111',
        textSecondary: '#555555',
        divider: '#DDDDDD',
        headerText: '#FFFFFF',
    },
    layout: {
        pageWidth: 595.28, 
        pageHeight: 841.89, 
        contentWidth: 595.28 - 80, 
    }
};

const drawHeader = (doc) => {
    doc.rect(0, 0, config.layout.pageWidth, 80).fill(config.colors.primary);
    doc.font(config.fonts.bold)
       .fontSize(config.fontSizes.header)
       .fillColor(config.colors.headerText)
       .text('GUEST STAY RECORD', config.margin, 30, { align: 'left' });

    doc.font(config.fonts.normal)
       .fontSize(config.fontSizes.body)
       .text('ApnaManager', { align: 'left' });

    doc.y = 120;
};

const drawFooter = (doc) => {
    const footerY = config.layout.pageHeight - 60;
    doc.rect(0, footerY, config.layout.pageWidth, 60).fill(config.colors.primary);
    
    const footerText = 'Thank you for your stay! We wish you a safe journey ahead.';
    doc.font(config.fonts.italic)
       .fontSize(config.fontSizes.footer)
       .fillColor(config.colors.headerText)
       .text(footerText, config.margin, footerY + 25, {
           align: 'center',
           width: config.layout.contentWidth,
       });
};

const drawSectionTitle = (doc, title) => {
    doc.moveDown(1.5);
    doc.font(config.fonts.bold)
       .fontSize(config.fontSizes.title)
       .fillColor(config.colors.primary)
       .text(title, { underline: true });
    doc.moveDown(0.75);
};

const drawInfoRow = (doc, label, value) => {
    doc.font(config.fonts.bold)
       .fillColor(config.colors.textPrimary)
       .text(`${label}: `, { continued: true })
       .font(config.fonts.normal)
       .fillColor(config.colors.textSecondary)
       .text(value || 'N/A');
};

const renderStayAndHotelDetails = (doc, guest) => {
    drawSectionTitle(doc, 'Stay & Hotel Information');
    
    const columnGap = 30;
    const columnWidth = (config.layout.contentWidth - columnGap) / 2;
    const initialY = doc.y;
    const leftColumnX = doc.x;
    const rightColumnX = leftColumnX + columnWidth + columnGap;

    // Left Column: Hotel Details
    drawInfoRow(doc, 'Hotel Name', guest.hotel?.details?.hotelName || guest.hotel?.username);
    drawInfoRow(doc, 'Location', guest.hotel?.details?.city);
    drawInfoRow(doc, 'Room Number', guest.stayDetails?.roomNumber);
    const leftColumnHeight = doc.y;
    
    // Right Column: Stay Details
    doc.y = initialY; // Reset Y for the second column
    doc.x = rightColumnX;
    
    const checkInDate = new Date(guest.stayDetails.checkIn).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const checkOutDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    
    drawInfoRow(doc, 'Check-In', checkInDate);
    drawInfoRow(doc, 'Check-Out', checkOutDate);
    drawInfoRow(doc, 'Purpose of Visit', guest.stayDetails?.purposeOfVisit);

    // Reset cursor position
    doc.x = config.margin;
    doc.y = Math.max(doc.y, leftColumnHeight); 
};

const renderGuestDetails = (doc, guest) => {
    drawSectionTitle(doc, 'Primary Guest Details');

    const fullAddress = [
        guest.primaryGuest.address.street,
        guest.primaryGuest.address.city,
        guest.primaryGuest.address.state,
        guest.primaryGuest.address.zipCode,
        guest.primaryGuest.address.country,
    ].filter(Boolean).join(', ');

    drawInfoRow(doc, 'Customer ID', guest.customerId);
    drawInfoRow(doc, 'Name', guest.primaryGuest.name);
    drawInfoRow(doc, 'Phone', guest.primaryGuest.phone);
    drawInfoRow(doc, 'Email', guest.primaryGuest.email);
    drawInfoRow(doc, 'ID Type', `${guest.idType} (${guest.idNumber})`);
    drawInfoRow(doc, 'Address', fullAddress);
};

const renderAccompanyingGuests = (doc, guest) => {
    const adults = guest.accompanyingGuests?.adults || [];
    const children = guest.accompanyingGuests?.children || [];

    if (adults.length === 0 && children.length === 0) return;

    drawSectionTitle(doc, 'Accompanying Guests');
    
    if (adults.length > 0) {
        doc.font(config.fonts.bold).text('Adults: ', { continued: true })
           .font(config.fonts.normal).text(adults.map(a => a.name).join(', '));
    }
    
    if (children.length > 0) {
        doc.moveDown(0.5);
        doc.font(config.fonts.bold).text('Children: ', { continued: true })
           .font(config.fonts.normal).text(children.map(c => c.name).join(', '));
    }
};

const generateGuestPDF = (guest) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: config.size,
                margin: config.margin,
                layout: 'portrait',
                bufferPages: true,
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => {
                logger.error(`pdf generation error: ${err.message}`);
                reject(err);
            });

            drawHeader(doc);
            renderStayAndHotelDetails(doc, guest);
            renderGuestDetails(doc, guest);
            renderAccompanyingGuests(doc, guest);
            drawFooter(doc);

            doc.end();

        } catch (error) {
            logger.error(`error during pdf setup: ${error.message}`);
            reject(error);
        }
    });
};

module.exports = generateGuestPDF;
