// src/utils/emailTemplates/checkoutTemplate.js
const checkoutTemplate = (guestName, hotelName) => {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #1976D2;">Thank You for Your Stay at ${hotelName}!</h2>
        <p>Dear ${guestName},</p>
        <p>Your checkout has been processed successfully. For your records, we've attached a detailed receipt of your stay to this email.</p>
        <p>We enjoyed having you and hope to see you again soon!</p>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">This is an automated receipt. Please do not reply to this email.</p>
      </div>
    `;
};

module.exports = checkoutTemplate;