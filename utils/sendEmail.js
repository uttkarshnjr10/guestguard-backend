// utils/sendEmail.js
const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

// Set the API key from your .env file
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends the credentials email to a newly registered user.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} username - The generated username.
 * @param {string} temporaryPassword - The generated temporary password.
 */
const sendCredentialsEmail = async (toEmail, username, temporaryPassword) => {
  // IMPORTANT: You must verify a "Single Sender" email address in your SendGrid account.
  // This 'from' email MUST match your verified sender.
  const fromEmail =  process.env.FROM_EMAIL; // Replace with your verified SendGrid sender

  const msg = {
    to: toEmail,
    from: {
        name: 'GuestGuard Admin',
        email: fromEmail,
    },
    subject: 'Your GuestGuard Account Credentials',
    // Use a professional HTML template for the email body
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
        <p style="font-size: 0.9em; color: #777;">If you were not expecting this email, please disregard it.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    logger.info(`Credentials email sent successfully to ${toEmail}`);
  } catch (error) {
    logger.error(`Failed to send email to ${toEmail}:`, error.response?.body || error);
    // Even if email fails, we don't want to stop the registration process.
    // The admin can still see the credentials on screen.
  }
};

module.exports = { sendCredentialsEmail };
