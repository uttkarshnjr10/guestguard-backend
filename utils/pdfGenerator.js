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
    margin: 30, // Reduced margin to fit more content
    layout: 'portrait',
  },
  fonts: {
    bold: 'Helvetica-Bold',
    normal: 'Helvetica',
    italic: 'Helvetica-Oblique',
  },
  fontSizes: {
    header: 20,
    subheader: 13, // Slightly reduced
    body: 9.5,     // Slightly reduced for better fit
    footer: 8.5,   // Slightly reduced
    notes: 8,
  },
  colors: {
    // A modern, professional color palette
    primary: '#1976D2',   // Slightly more vibrant Blue for headers and titles
    secondary: '#2196F3', // Lighter Blue
    textPrimary: '#222222', // Darker Gray for main text
    textSecondary: '#555555', // Lighter Gray
    background: '#FFFFFF', // White
    panelBackground: '#F8F8F8', // Very light gray for panels (subtle)
    divider: '#EEEEEE',   // Light gray for borders and dividers
    headerText: '#FFFFFF', // White text for dark backgrounds
  },
  layout: {
    margin: 30, // Match document margin
    pageWidth: 595.28, // A4 width in points
    pageHeight: 841.89, // A4 height in points
    get contentWidth() {
      return this.pageWidth - this.margin * 2;
    },
  },
  // IMPORTANT: Add the path to your logo here
  logoPath: null, // Example: 'assets/logo.png'
};


// =============================================================================
// PRIVATE HELPER FUNCTIONS
// These internal functions are responsible for drawing specific parts of the PDF.
// =============================================================================

/**
 * Draws the main header with a logo and a colored background.
 * @private
 */
const _drawHeader = (doc) => {
  // Draw a background color rectangle for the header
  doc
    .rect(0, 0, config.layout.pageWidth, 90) // Slightly reduced height
    .fill(config.colors.primary);

  // If a logo path is provided, draw it.
  if (config.logoPath) {
    doc.image(config.logoPath, config.layout.margin, 15, { // Adjusted Y position
      fit: [70, 70], // Slightly smaller logo
      align: 'center',
      valign: 'center',
    });
  }

  // Draw the header text
  doc
    .font(config.fonts.bold)
    .fontSize(config.fontSizes.header)
    .fillColor(config.colors.headerText)
    .text('CENTRALIZED DATA MANAGEMENT', config.layout.margin, 30, { // Adjusted Y position
      align: 'right',
      width: config.layout.contentWidth,
    });

  doc
    .font(config.fonts.normal)
    .fontSize(config.fontSizes.subheader)
    .text('Guest Stay Record', { align: 'right', width: config.layout.contentWidth });

  // Move cursor down below the header area
  doc.y = 100; // Adjusted start Y for content
};

/**
 * Draws a horizontal divider line.
 * @private
 */
const _drawDivider = (doc, y = doc.y) => {
  doc
    .strokeColor(config.colors.divider)
    .lineWidth(0.5)
    .moveTo(config.layout.margin, y)
    .lineTo(config.layout.pageWidth - config.layout.margin, y)
    .stroke();
  doc.moveDown(1.5);
};

/**
 * Draws a section with a titled background panel.
 * @private
 */
const _drawSectionPanel = (doc, title, contentDrawer) => {
    // Calculate position and dimensions
    const startY = doc.y;
    const padding = 12; // Reduced padding for better fit
    const contentX = doc.x + padding; // Relative to doc.x which is config.layout.margin
    
    // Use a temporary doc to calculate height before drawing
    let tempDoc = new PDFDocument(config.document);
    tempDoc.x = contentX;
    tempDoc.y = startY + padding + 20; // Simulate initial text position
    contentDrawer(tempDoc);
    const contentHeight = tempDoc.y - startY + padding * 2; // Adjusted height calculation

    // Draw the rounded rectangle background
    doc
      .roundedRect(doc.x, startY, config.layout.contentWidth, contentHeight + 10, 5) // Added a little extra height for safety
      .fill(config.colors.panelBackground);

    // Draw the section title
    doc
      .font(config.fonts.bold)
      .fontSize(config.fontSizes.subheader)
      .fillColor(config.colors.primary)
      .text(title, contentX, startY + padding);
      
    // Set cursor position and draw the actual content
    doc.x = contentX;
    doc.y = startY + padding + 20; // Below the title, adjusted for smaller font/padding
    contentDrawer(doc);

    // Move cursor below the drawn panel
    doc.y = startY + contentHeight + 10 + 15; // Adjusted spacing between sections
};

/**
 * Renders hotel and stay details content.
 * @private
 */
const _renderHotelAndStayDetails = (doc, guest) => {
    const sectionStartY = doc.y;
    const columnWidth = (config.layout.contentWidth - (doc.x - config.layout.margin) * 2 - 30) / 2; // Dynamic column width calculation
    const leftColumnX = doc.x;
    const rightColumnX = leftColumnX + columnWidth + 30; // Spacing between columns

    // Left Column: Hotel Information
    doc.font(config.fonts.bold).fillColor(config.colors.textPrimary).text('Hotel Information');
    doc.moveDown(0.5);
    doc
      .font(config.fonts.normal)
      .fontSize(config.fontSizes.body)
      .fillColor(config.colors.textSecondary)
      .text(`Hotel Name: ${guest.hotel?.username || 'N/A'}`)
      .text(`Location: ${guest.hotel?.details?.city || 'N/A'}`);

    const leftColumnHeight = doc.y;

    // Format dates for better readability
    const checkInDate = guest.stayDetails.checkIn ? new Date(guest.stayDetails.checkIn).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
    const checkOutDate = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Right Column: Stay Information
    doc.y = sectionStartY; // Reset Y to top of section for the right column
    doc
      .font(config.fonts.bold)
      .fillColor(config.colors.textPrimary)
      .text('Stay Information', rightColumnX);
    doc.moveDown(0.5);
    doc
      .font(config.fonts.normal)
      .fontSize(config.fontSizes.body)
      .fillColor(config.colors.textSecondary)
      .text(`Check-In: ${checkInDate}`, rightColumnX)
      .text(`Check-Out: ${checkOutDate}`, rightColumnX)
      .text(`Room Number: ${guest.stayDetails.roomNumber || 'N/A'}`, rightColumnX);

    // Ensure cursor is below the tallest column before exiting
    doc.y = Math.max(doc.y, leftColumnHeight);
};

/**
 * Renders the primary guest's details content.
 * @private
 */
const _renderGuestDetails = (doc, guest) => {
  doc
    .font(config.fonts.normal)
    .fontSize(config.fontSizes.body)
    .fillColor(config.colors.textSecondary)
    .text(`Customer ID: ${guest.customerId}`)
    .text(`Name: ${guest.primaryGuest.name}`)
    .text(`Phone: ${guest.primaryGuest.phone}`)
    .text(`Address: ${guest.primaryGuest.address}`);
};

/**
 * Renders the details of accompanying guests.
 * @private
 */
const _renderAccompanyingGuests = (doc, guest) => {
  const adults = guest.accompanyingGuests?.adults || [];
  const children = guest.accompanyingGuests?.children || [];

  if (adults.length === 0 && children.length === 0) {
    doc.font(config.fonts.italic).fillColor(config.colors.textSecondary).text('No accompanying guests.');
    return;
  }

  if (adults.length > 0) {
    doc.font(config.fonts.bold).fillColor(config.colors.textPrimary).text('Adults: ', { continued: true });
    doc.font(config.fonts.normal).fillColor(config.colors.textSecondary).text(adults.map(a => a.name).join(', '));
    doc.moveDown(0.5);
  }
  if (children.length > 0) {
    doc.font(config.fonts.bold).fillColor(config.colors.textPrimary).text('Children: ', { continued: true });
    doc.font(config.fonts.normal).fillColor(config.colors.textSecondary).text(children.map(c => c.name).join(', '));
  }
};

/**
 * Draws the footer of the PDF document.
 * @private
 */
const _drawFooter = (doc) => {
  const footerHeight = 70; // Increased footer height for the message
  const footerY = config.layout.pageHeight - footerHeight;
  
  // Draw background color rectangle for the footer
  doc
    .rect(0, footerY, config.layout.pageWidth, footerHeight)
    .fill(config.colors.primary);

  // Thank You Message
  doc
    .fontSize(config.fontSizes.footer + 1) // Slightly larger for emphasis
    .font(config.fonts.bold)
    .fillColor(config.colors.headerText)
    .text(
      'Thank you for choosing us!',
      config.layout.margin,
      footerY + 15,
      { align: 'center', width: config.layout.contentWidth }
    );
  
  // Tagline
  doc
    .fontSize(config.fontSizes.footer)
    .font(config.fonts.italic)
    .fillColor(config.colors.headerText)
    .text(
      'We wish you a safe journey ahead.',
      config.layout.margin,
      footerY + 35, // Position below the main thank you
      { align: 'center', width: config.layout.contentWidth }
    );
};

// =============================================================================
// PUBLIC EXPORTED FUNCTION
// =============================================================================

/**
 * Generates a guest checkout PDF from a guest data object.
 * This function orchestrates the PDF creation by calling modular helper functions.
 *
 * @param {object} guest - The guest Mongoose document.
 * @returns {Promise<Buffer>} A promise that resolves with the PDF data as a Buffer.
 * @throws {Error} Rejects the promise if any error occurs.
 */
function generateGuestPDF(guest) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument(config.document);
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Build the PDF document structure ---
      _drawHeader(doc);
      
      // Ensure current Y is within bounds for the first section
      doc.y = Math.min(doc.y, config.layout.pageHeight - 200); // Prevent sections from starting too low

      _drawSectionPanel(doc, 'Stay & Hotel Details', (d) => _renderHotelAndStayDetails(d, guest));
      
      // Add a check here to ensure there's enough space for the next section
      if (doc.y + 150 > config.layout.pageHeight - 90) { // Estimate space needed for next section + footer
          doc.addPage(); // If truly necessary, add page, but goal is single page
          doc.y = config.layout.margin + 20; // Reset Y for new page
      }
      _drawSectionPanel(doc, 'Primary Guest Details', (d) => _renderGuestDetails(d, guest));
      
      if (doc.y + 100 > config.layout.pageHeight - 90) { // Estimate space needed for next section + footer
          doc.addPage();
          doc.y = config.layout.margin + 20;
      }
      _drawSectionPanel(doc, 'Accompanying Guests', (d) => _renderAccompanyingGuests(d, guest));
      
      // Draw footer always at the bottom of the *last* page, which should be the only page
      _drawFooter(doc);

      doc.end();

    } catch (error) {
      // console.error('Error during PDF generation setup:', error);
      reject(error);
    }
  });
}

module.exports = generateGuestPDF;