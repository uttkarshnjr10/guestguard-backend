/**
 * @module pdfGenerator
 * @description A utility for generating professional PDF documents for guest checkouts.
 * This module uses the 'pdfkit' library to create a structured, styled, and
 * authentic-looking receipt that can be emailed or stored.
 * The generation process is asynchronous and returns the PDF as a Buffer.
 */

const PDFDocument = require('pdfkit');

// =============================================================================
// CONFIGURATION
// Centralizes all styling and layout constants for easy maintenance and theming.
// =============================================================================

const config = {
  document: {
    size: 'A4',
    margin: 40,
  },
  fonts: {
    bold: 'Helvetica-Bold',
    normal: 'Helvetica',
    italic: 'Helvetica-Oblique',
  },
  fontSizes: {
    header: 22,
    subheader: 14,
    body: 11,
    footer: 10,
  },
  colors: {
    primaryText: '#000000', // Black for main text
    secondaryText: '#555555', // A lighter grey for secondary info
    divider: '#cccccc', // Light grey for dividers
  },
  layout: {
    columnGap: 20,
    get columnWidth() {
      return (this.pageWidth - this.margin * 2 - this.columnGap) / 2;
    },
    pageWidth: 595.28, // A4 width in points
    margin: 40,
  },
};

// =============================================================================
// PRIVATE HELPER FUNCTIONS
// These internal functions are responsible for drawing specific parts of the PDF.
// They are not exported and are used only by the main generateGuestPDF function.
// =============================================================================

/**
 * Draws the main header of the PDF document.
 * @private
 * @param {PDFDocument} doc - The PDFDocument instance.
 */
const _drawHeader = (doc) => {
  doc
    .font(config.fonts.bold)
    .fontSize(config.fontSizes.header)
    .fillColor(config.colors.primaryText)
    .text('CENTRALIZED DATA MANAGEMENT', { align: 'center' })
    .fontSize(config.fontSizes.subheader)
    .font(config.fonts.normal)
    .text('Guest Stay Record', { align: 'center' })
    .moveDown(2);
};

/**
 * Draws a horizontal divider line.
 * @private
 * @param {PDFDocument} doc - The PDFDocument instance.
 * @param {number} y - The vertical position to draw the line.
 */
const _drawDivider = (doc, y = doc.y) => {
  doc
    .strokeColor(config.colors.divider)
    .lineWidth(1)
    .moveTo(config.layout.margin, y)
    .lineTo(doc.page.width - config.layout.margin, y)
    .stroke();
  doc.moveDown();
};

/**
 * Draws the hotel and stay information in a two-column layout.
 * @private
 * @param {PDFDocument} doc - The PDFDocument instance.
 * @param {object} guest - The guest data object.
 */
const _drawHotelAndStayDetails = (doc, guest) => {
  const startY = doc.y;
  _drawDivider(doc, startY);

  const leftColumnX = config.layout.margin;
  const rightColumnX = leftColumnX + config.layout.columnWidth + config.layout.columnGap;
  const columnStartY = startY + 15; // Start text below the divider

  // Left Column: Hotel Information
  doc
    .font(config.fonts.bold)
    .fontSize(config.fontSizes.subheader)
    .text('Hotel Information', leftColumnX, columnStartY);
  doc.moveDown(0.5);
  doc
    .font(config.fonts.normal)
    .fontSize(config.fontSizes.body)
    .fillColor(config.colors.secondaryText)
    .text(`Hotel Name: ${guest.hotel?.username || 'N/A'}`)
    .text(`Location: ${guest.hotel?.details?.city || 'N/A'}`);

  const leftColumnHeight = doc.y;

  // Right Column: Stay Information
  doc
    .font(config.fonts.bold)
    .fontSize(config.fontSizes.subheader)
    .fillColor(config.colors.primaryText)
    .text('Stay Information', rightColumnX, columnStartY);
  doc.moveDown(0.5);
  doc
    .font(config.fonts.normal)
    .fontSize(config.fontSizes.body)
    .fillColor(config.colors.secondaryText)
    .text(`Check-In: ${new Date(guest.stayDetails.checkIn).toLocaleString()}`)
    .text(`Check-Out: ${new Date().toLocaleString()}`)
    .text(`Room Number: ${guest.stayDetails.roomNumber || 'N/A'}`);
    
  // Ensure the cursor moves below the taller of the two columns
  doc.y = Math.max(doc.y, leftColumnHeight) + 20;
};

/**
 * Draws the primary guest's details.
 * @private
 * @param {PDFDocument} doc - The PDFDocument instance.
 * @param {object} guest - The guest data object.
 */
const _drawGuestDetails = (doc, guest) => {
  doc
    .font(config.fonts.bold)
    .fontSize(config.fontSizes.subheader)
    .fillColor(config.colors.primaryText)
    .text('Primary Guest Details');
  doc.moveDown(0.5);
  
  doc
    .font(config.fonts.normal)
    .fontSize(config.fontSizes.body)
    .fillColor(config.colors.secondaryText)
    .text(`Customer ID: ${guest.customerId}`)
    .text(`Name: ${guest.primaryGuest.name}`)
    .text(`Phone: ${guest.primaryGuest.phone}`)
    .text(`Address: ${guest.primaryGuest.address}`);
  doc.moveDown();
};

/**
 * Draws the details of any accompanying guests.
 * @private
 * @param {PDFDocument} doc - The PDFDocument instance.
 * @param {object} guest - The guest data object.
 */
const _drawAccompanyingGuests = (doc, guest) => {
  const adults = guest.accompanyingGuests?.adults || [];
  const children = guest.accompanyingGuests?.children || [];

  if (adults.length === 0 && children.length === 0) {
    return; // Do not render this section if there are no accompanying guests
  }

  doc
    .font(config.fonts.bold)
    .fontSize(config.fontSizes.subheader)
    .fillColor(config.colors.primaryText)
    .text('Accompanying Guests');
  doc.moveDown(0.5);

  if (adults.length > 0) {
    doc.font(config.fonts.bold).text('Adults: ', { continued: true });
    doc.font(config.fonts.normal).text(adults.map(a => a.name).join(', '));
    doc.moveDown(0.5);
  }
  if (children.length > 0) {
    doc.font(config.fonts.bold).text('Children: ', { continued: true });
    doc.font(config.fonts.normal).text(children.map(c => c.name).join(', '));
  }
  doc.moveDown();
};

/**
 * Draws the footer of the PDF document.
 * @private
 * @param {PDFDocument} doc - The PDFDocument instance.
 */
const _drawFooter = (doc) => {
  // Position the footer at a fixed location from the bottom of the page
  const footerY = doc.page.height - 60;
  _drawDivider(doc, footerY);
  
  doc
    .fontSize(config.fontSizes.footer)
    .font(config.fonts.italic)
    .fillColor(config.colors.secondaryText)
    .text(
      'Thank you for choosing us. We wish you a safe journey ahead.',
      config.layout.margin,
      footerY + 15, // Position text below the divider
      { align: 'center' }
    );
};


// =============================================================================
// PUBLIC EXPORTED FUNCTION
// =============================================================================

/**
 * Generates a guest checkout PDF from a guest data object.
 * This function orchestrates the PDF creation by calling modular helper functions.
 * It's wrapped in a Promise to handle the asynchronous nature of stream-based I/O.
 *
 * @param {object} guest - The guest Mongoose document, must contain nested objects for hotel, primaryGuest, etc.
 * @returns {Promise<Buffer>} A promise that resolves with the PDF data as a Buffer.
 * @throws {Error} Rejects the promise if any error occurs during PDF generation.
 */
function generateGuestPDF(guest) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument(config.document);
      const buffers = [];

      // Event listeners to handle the stream
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject); // Propagate any errors to the promise rejection

      // --- Build the PDF document structure ---
      _drawHeader(doc);
      _drawHotelAndStayDetails(doc, guest);
      _drawGuestDetails(doc, guest);
      _drawAccompanyingGuests(doc, guest);
      _drawFooter(doc);

      // Finalize the PDF. This triggers the 'end' event.
      doc.end();

    } catch (error) {
      // Catch synchronous errors (e.g., invalid input)
      console.error('Error during PDF generation setup:', error);
      reject(error);
    }
  });
}

module.exports = generateGuestPDF;