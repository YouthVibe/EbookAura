const nodemailer = require('nodemailer');

/**
 * Send an email using the configured email service
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (options) => {
  try {
    // Get email configuration from environment variables
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    
    // Setup email options
    const mailOptions = {
      from: `"EbookAura" <${EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendEmail
}; 