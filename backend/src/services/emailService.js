const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password Reset Code - BMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password for your BMS account.</p>
          <p>Your password reset code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${resetCode}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from BMS. Please do not reply to this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

const send2FAEmail = async (email, code, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Login Verification Code - BMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification Required</h2>
          <p>Hello ${userName},</p>
          <p>Someone is trying to log in to your BMS account. If this is you, please use the verification code below:</p>
          <div style="background-color: #e3f2fd; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; border-radius: 8px; color: #1976d2;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p><strong>If you didn't try to log in, please secure your account immediately.</strong></p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated security message from BMS. Please do not reply to this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("2FA email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending 2FA email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  send2FAEmail,
};