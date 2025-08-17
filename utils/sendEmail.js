// utils/sendEmail.js
const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = process.env.FROM_EMAIL; // Your verified SendGrid sender

/**
 * Sends the credentials email to a newly registered user.
 */
const sendCredentialsEmail = async (toEmail, username, temporaryPassword) => {
  const msg = {
    to: toEmail,
    from: {
        name: 'GuestGuard Admin',
        email: fromEmail,
    },
    subject: 'Your GuestGuard Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Welcome to GuestGuard!</h2>
        <p>An administrator has created an account for you. Please use the following credentials to log in for the first time.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        <p><strong>Important:</strong> For your security, you will be required to change this temporary password immediately upon your first login.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Login Now
        </a>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    logger.info(`Credentials email sent successfully to ${toEmail}`);
  } catch (error) {
    logger.error(`Failed to send credentials email to ${toEmail}:`, error.response?.body || error);
  }
};

/**
 * Sends the checkout receipt email with a PDF attachment.
 */
const sendCheckoutEmail = async (toEmail, hotelEmail, guestName, pdfBuffer) => {
  const msg = {
    // Send to both the guest and a copy to the hotel
    to: [toEmail, hotelEmail], 
    from: {
        name: 'GuestGuard Receipts',
        email: fromEmail,
    },
    subject: `Your Checkout Receipt from ${guestName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Thank You for Your Stay!</h2>
        <p>Dear ${guestName},</p>
        <p>Thank you for staying with us. Your checkout has been processed successfully. Please find your receipt attached to this email.</p>
        <p>We hope to see you again soon!</p>
      </div>
    `,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `checkout_receipt_${guestName.replace(/\s+/g, '_')}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  try {
    await sgMail.send(msg);
    logger.info(`Checkout receipt sent successfully to ${toEmail} and ${hotelEmail}`);
  } catch (error) {
    logger.error(`Failed to send checkout email:`, error.response?.body || error);
  }
};


module.exports = { sendCredentialsEmail, sendCheckoutEmail };
