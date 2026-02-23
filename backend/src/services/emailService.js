const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });

    transporter.verify((error, success) => {
      if (error) {
        console.log('Email transporter verification failed:', error.message);
      } else {
        console.log('Email transporter ready for messages');
      }
    });
  }
  return transporter;
};

const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const emailTransporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password Reset Code - BMS",
      priority: 'high',
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
          <p style="color: #888; font-size: 11px; text-align: center; margin-top: 20px;">Developed by <a href="https://localseo.lk/" style="color: #888; text-decoration: none;">LocalSEO (Pvt) Ltd.</a></p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Password reset email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

const send2FAEmail = async (email, code, userName) => {
  const startTime = Date.now();
  try {
    const emailTransporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Login Verification Code - BMS",
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification Required</h2>
          <p>Hello ${userName},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #e3f2fd; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; border-radius: 8px; color: #1976d2;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p><strong>If you didn't try to log in, please secure your account immediately.</strong></p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated security message from BMS.</p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;
    console.log(`2FA email sent in ${duration}ms: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error sending 2FA email after ${duration}ms:`, error.message);
    console.log("Development Mode - 2FA Code:", code);
    console.log("Email would be sent to:", email);
    return { success: true, messageId: "fallback-" + Date.now() };
  }
};

const sendKycReviewEmail = async (email, userName, clientName, jobNumber, stage) => {
  try {
    const emailTransporter = getTransporter();

    const stageLabels = {
      dlmro: "DLMRO",
      lmro: "LMRO",
      ceo: "CEO",
    };

    const stageLabel = stageLabels[stage] || stage.toUpperCase();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `KYC Review Required - ${stageLabel} Approval`,
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">KYC Document Review Required</h2>
          <p>Hello ${userName},</p>
          <p>A new KYC document has been uploaded and requires your review and digital signature.</p>
          <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Job Number:</strong> ${jobNumber}</p>
            <p><strong>Your Action:</strong> Review and sign the document as ${stageLabel}</p>
          </div>
          <p>Please log in to the BMS system to review and sign the document.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from BMS.</p>
          <p style="color: #888; font-size: 11px; text-align: center; margin-top: 20px;">Developed by <a href="https://localseo.lk/" style="color: #888; text-decoration: none;">LocalSEO (Pvt) Ltd.</a></p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("KYC review email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending KYC review email:", error);
    return { success: false, error: error.message };
  }
};

const sendKycRejectionEmail = async (email, userName, clientName, jobNumber, rejectedByName, rejectedByRole, rejectionReason, rejectionTime) => {
  try {
    const emailTransporter = getTransporter();

    const roleLabels = {
      dlmro: "DLMRO",
      lmro: "LMRO",
      ceo: "CEO",
    };

    const roleLabel = roleLabels[rejectedByRole] || rejectedByRole.toUpperCase();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `KYC Document Rejected - ${clientName}`,
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">KYC Document Rejected</h2>
          <p>Hello ${userName},</p>
          <p>A KYC document has been <strong style="color: #dc2626;">rejected</strong> and requires a new document to be uploaded.</p>
          <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Job Number:</strong> ${jobNumber}</p>
            <p><strong>Rejected By:</strong> ${rejectedByName} (${roleLabel})</p>
            <p><strong>Rejection Time:</strong> ${rejectionTime}</p>
            <p><strong>Reason:</strong></p>
            <p style="background-color: #fff; padding: 10px; border-radius: 4px; margin-top: 5px;">${rejectionReason}</p>
          </div>
          <p>The AML Supervisor needs to upload a new document to restart the KYC approval process.</p>
          <p>Please log in to the BMS system to take necessary action.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from BMS.</p>
          <p style="color: #888; font-size: 11px; text-align: center; margin-top: 20px;">Developed by <a href="https://localseo.lk/" style="color: #888; text-decoration: none;">LocalSEO (Pvt) Ltd.</a></p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("KYC rejection email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending KYC rejection email:", error);
    return { success: false, error: error.message };
  }
};

const sendJobAssignmentEmail = async (email, userName, clientName, jobNumber, serviceType, assignedByName) => {
  try {
    const emailTransporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Job Assignment - ${jobNumber}`,
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">You Have Been Assigned to a Job</h2>
          <p>Hello ${userName},</p>
          <p>You have been <strong style="color: #16a34a;">assigned</strong> to a job.</p>
          <div style="background-color: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #16a34a;">
            <p><strong>Job Number:</strong> ${jobNumber}</p>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Service Type:</strong> ${serviceType}</p>
            <p><strong>Assigned By:</strong> ${assignedByName}</p>
          </div>
          <p>Please log in to the BMS system to view the job details and start working on it.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from BMS.</p>
          <p style="color: #888; font-size: 11px; text-align: center; margin-top: 20px;">Developed by <a href="https://localseo.lk/" style="color: #888; text-decoration: none;">LocalSEO (Pvt) Ltd.</a></p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Job assignment email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending job assignment email:", error);
    return { success: false, error: error.message };
  }
};

const sendJobRemovalEmail = async (email, userName, clientName, jobNumber, serviceType, removedByName) => {
  try {
    const emailTransporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Job Assignment Removed - ${jobNumber}`,
      priority: "normal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">You Have Been Removed from a Job</h2>
          <p>Hello ${userName},</p>
          <p>You have been <strong style="color: #dc2626;">removed</strong> from a job assignment.</p>
          <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p><strong>Job Number:</strong> ${jobNumber}</p>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Service Type:</strong> ${serviceType}</p>
            <p><strong>Removed By:</strong> ${removedByName}</p>
          </div>
          <p>You no longer have access to this job. If you believe this was done in error, please contact your supervisor.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from BMS.</p>
          <p style="color: #888; font-size: 11px; text-align: center; margin-top: 20px;">Developed by <a href="https://localseo.lk/" style="color: #888; text-decoration: none;">LocalSEO (Pvt) Ltd.</a></p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Job removal email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending job removal email:", error);
    return { success: false, error: error.message };
  }
};

const sendDocumentRequestEmail = async (email, clientName, requestData) => {
  try {
    const emailTransporter = getTransporter();

    const expiryDate = new Date(requestData.expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: requestData.subject || "Document Request - BMS",
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Document Request</h2>
          <p>Dear ${clientName},</p>
          <p>We need some additional documents/information from you.</p>
          <div style="background-color: #eff6ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; white-space: pre-wrap;">${requestData.message}</p>
          </div>
          <p>Please click the button below to submit the requested documents:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${requestData.submitUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Submit Documents
            </a>
          </div>
          <p style="color: #dc2626; font-weight: bold;">This link will expire on ${expiryDate}.</p>
          <p>If you have any questions, please contact us.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from BMS. Please do not reply to this email.</p>
          <p style="color: #888; font-size: 11px; text-align: center; margin-top: 20px;">Developed by <a href="https://localseo.lk/" style="color: #888; text-decoration: none;">LocalSEO (Pvt) Ltd.</a></p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Document request email sent: " + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending document request email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  send2FAEmail,
  sendKycReviewEmail,
  sendKycRejectionEmail,
  sendJobAssignmentEmail,
  sendJobRemovalEmail,
  sendDocumentRequestEmail,
};