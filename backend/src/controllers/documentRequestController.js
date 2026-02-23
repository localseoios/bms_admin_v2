const DocumentRequestTemplate = require("../models/DocumentRequestTemplate");
const DocumentRequest = require("../models/DocumentRequest");
const ClientSubmission = require("../models/ClientSubmission");
const Client = require("../models/Client");
const { uploadToCloudinary } = require("../services/fileUploadService");
const notificationService = require("../services/notificationService");
const { sendDocumentRequestEmail } = require("../services/emailService");
const fs = require("fs");
const crypto = require("crypto");

const getFrontendUrl = () => {
  let frontendUrl = process.env.VITE_FRONTEND_URL || "http://localhost:5173";
  if (frontendUrl.includes(",")) {
    const urls = frontendUrl.split(",").map(u => u.trim());
    frontendUrl = process.env.NODE_ENV === "production"
      ? urls.find(u => u.includes("app.newoon.com")) || urls[urls.length - 1]
      : urls[0];
  }
  return frontendUrl;
};

const getTemplates = async (req, res) => {
  try {
    const templates = await DocumentRequestTemplate.find({ isActive: true })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Failed to fetch templates", error: error.message });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const template = await DocumentRequestTemplate.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ message: "Failed to fetch template", error: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, description, fields } = req.body;

    const template = new DocumentRequestTemplate({
      name,
      description,
      fields,
      createdBy: req.user._id,
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      template,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ message: "Failed to create template", error: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { name, description, fields } = req.body;

    const template = await DocumentRequestTemplate.findByIdAndUpdate(
      req.params.id,
      { name, description, fields },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json({
      success: true,
      message: "Template updated successfully",
      template,
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ message: "Failed to update template", error: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await DocumentRequestTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ message: "Failed to delete template", error: error.message });
  }
};

const createDocumentRequest = async (req, res) => {
  try {
    const { clientId, templateId, customFields, message, subject, expiryDays, relatedJobId } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    let fields = customFields || [];
    if (templateId) {
      const template = await DocumentRequestTemplate.findById(templateId);
      if (template) {
        fields = template.fields;
      }
    }

    const expiresAt = new Date(Date.now() + (expiryDays || 7) * 24 * 60 * 60 * 1000);

    const documentRequest = new DocumentRequest({
      clientId,
      templateId,
      customFields: fields,
      message,
      subject: subject || "Document Request",
      expiresAt,
      createdBy: req.user._id,
      relatedJobId,
      sentAt: new Date(),
    });

    await documentRequest.save();

    const submitUrl = `${getFrontendUrl()}/submit/${documentRequest.token}`;

    try {
      await sendDocumentRequestEmail(
        client.gmail,
        client.name,
        {
          subject: documentRequest.subject,
          message: documentRequest.message,
          submitUrl,
          expiresAt: documentRequest.expiresAt,
        }
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Document request sent successfully",
      documentRequest,
      submitUrl,
    });
  } catch (error) {
    console.error("Error creating document request:", error);
    res.status(500).json({ message: "Failed to create document request", error: error.message });
  }
};

const getDocumentRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientId, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;

    const requests = await DocumentRequest.find(query)
      .populate("clientId", "name gmail clientCode")
      .populate("createdBy", "name email")
      .populate("templateId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DocumentRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching document requests:", error);
    res.status(500).json({ message: "Failed to fetch document requests", error: error.message });
  }
};

const getDocumentRequestById = async (req, res) => {
  try {
    const request = await DocumentRequest.findById(req.params.id)
      .populate("clientId", "name gmail clientCode")
      .populate("createdBy", "name email")
      .populate("templateId", "name fields");

    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Error fetching document request:", error);
    res.status(500).json({ message: "Failed to fetch document request", error: error.message });
  }
};

const cancelDocumentRequest = async (req, res) => {
  try {
    const request = await DocumentRequest.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    res.status(200).json({
      success: true,
      message: "Document request cancelled",
      request,
    });
  } catch (error) {
    console.error("Error cancelling document request:", error);
    res.status(500).json({ message: "Failed to cancel document request", error: error.message });
  }
};

const resendDocumentRequest = async (req, res) => {
  try {
    const request = await DocumentRequest.findById(req.params.id)
      .populate("clientId", "name gmail");

    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    request.token = crypto.randomBytes(32).toString("hex");
    request.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    request.status = "pending";
    request.sentAt = new Date();
    await request.save();

    const submitUrl = `${getFrontendUrl()}/submit/${request.token}`;

    try {
      await sendDocumentRequestEmail(
        request.clientId.gmail,
        request.clientId.name,
        {
          subject: request.subject,
          message: request.message,
          submitUrl,
          expiresAt: request.expiresAt,
        }
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Document request resent successfully",
      request,
      submitUrl,
    });
  } catch (error) {
    console.error("Error resending document request:", error);
    res.status(500).json({ message: "Failed to resend document request", error: error.message });
  }
};

const getPublicForm = async (req, res) => {
  try {
    const { token } = req.params;

    const request = await DocumentRequest.findOne({ token })
      .populate("clientId", "name gmail")
      .populate("templateId", "name fields");

    if (!request) {
      return res.status(404).json({ message: "Invalid or expired link" });
    }

    if (request.status === "submitted") {
      return res.status(400).json({ message: "This form has already been submitted" });
    }

    if (request.status === "cancelled") {
      return res.status(400).json({ message: "This request has been cancelled" });
    }

    if (new Date() > request.expiresAt) {
      request.status = "expired";
      await request.save();
      return res.status(400).json({ message: "This link has expired" });
    }

    const fields = request.templateId?.fields || request.customFields || [];

    res.status(200).json({
      success: true,
      clientName: request.clientId?.name,
      message: request.message,
      subject: request.subject,
      fields,
      expiresAt: request.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching public form:", error);
    res.status(500).json({ message: "Failed to load form", error: error.message });
  }
};

const submitPublicForm = async (req, res) => {
  try {
    const { token } = req.params;
    const formData = req.body;

    const request = await DocumentRequest.findOne({ token })
      .populate("clientId", "name gmail")
      .populate("createdBy", "_id name");

    if (!request) {
      return res.status(404).json({ message: "Invalid or expired link" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This form is no longer accepting submissions" });
    }

    if (new Date() > request.expiresAt) {
      request.status = "expired";
      await request.save();
      return res.status(400).json({ message: "This link has expired" });
    }

    const fields = request.templateId?.fields || request.customFields || [];
    const submittedFields = [];

    for (const field of fields) {
      const fieldData = {
        fieldName: field.name,
        fieldLabel: field.label,
        fieldType: field.type,
      };

      if (field.type === "file") {
        const file = req.files?.find(f => f.fieldname === field.name);
        if (file) {
          const uploadResult = await uploadToCloudinary(file.path, {
            folder: "client_submissions",
          });

          fieldData.fileUrl = uploadResult.url;
          fieldData.fileName = file.originalname;
          fieldData.fileSize = file.size;

          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        }
      } else {
        fieldData.value = formData[field.name];
      }

      submittedFields.push(fieldData);
    }

    const submission = new ClientSubmission({
      documentRequestId: request._id,
      clientId: request.clientId._id,
      submittedFields,
      clientIp: req.ip,
      clientUserAgent: req.headers["user-agent"],
    });

    await submission.save();

    request.status = "submitted";
    request.submittedAt = new Date();
    await request.save();

    try {
      const recipients = [];

      if (request.createdBy?._id) {
        recipients.push(request.createdBy._id.toString());
      }

      if (recipients.length > 0) {
        await notificationService.createNotification(
          {
            title: "New Document Submission",
            description: `Client "${request.clientId.name}" has submitted requested documents`,
            type: "client",
            subType: "document_submission",
            relatedTo: { model: "ClientSubmission", id: submission._id },
          },
          recipients
        );
        console.log("Notification sent to request creator:", recipients);
      }

      await notificationService.createNotification(
        {
          title: "New Document Submission",
          description: `Client "${request.clientId.name}" has submitted requested documents`,
          type: "client",
          subType: "document_submission",
          relatedTo: { model: "ClientSubmission", id: submission._id },
        },
        { "role.permissions.operationManagement": true }
      );
    } catch (notifError) {
      console.error("Notification creation failed:", notifError);
    }

    res.status(201).json({
      success: true,
      message: "Documents submitted successfully. Thank you!",
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ message: "Failed to submit form", error: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientId, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;

    const submissions = await ClientSubmission.find(query)
      .populate("clientId", "name gmail clientCode")
      .populate("documentRequestId", "subject message createdAt")
      .populate("reviewedBy", "name")
      .populate("processedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ClientSubmission.countDocuments(query);

    const stats = {
      pending: await ClientSubmission.countDocuments({ status: "pending" }),
      reviewed: await ClientSubmission.countDocuments({ status: "reviewed" }),
      processed: await ClientSubmission.countDocuments({ status: "processed" }),
    };

    res.status(200).json({
      success: true,
      submissions,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Failed to fetch submissions", error: error.message });
  }
};

const getSubmissionById = async (req, res) => {
  try {
    const submission = await ClientSubmission.findById(req.params.id)
      .populate("clientId", "name gmail clientCode")
      .populate("documentRequestId", "subject message customFields templateId createdAt")
      .populate("reviewedBy", "name email")
      .populate("processedBy", "name email");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ message: "Failed to fetch submission", error: error.message });
  }
};

const reviewSubmission = async (req, res) => {
  try {
    const { notes } = req.body;

    const submission = await ClientSubmission.findByIdAndUpdate(
      req.params.id,
      {
        status: "reviewed",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({
      success: true,
      message: "Submission marked as reviewed",
      submission,
    });
  } catch (error) {
    console.error("Error reviewing submission:", error);
    res.status(500).json({ message: "Failed to review submission", error: error.message });
  }
};

const processSubmission = async (req, res) => {
  try {
    const { notes } = req.body;

    const submission = await ClientSubmission.findByIdAndUpdate(
      req.params.id,
      {
        status: "processed",
        processedBy: req.user._id,
        processedAt: new Date(),
        processingNotes: notes,
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({
      success: true,
      message: "Submission marked as processed",
      submission,
    });
  } catch (error) {
    console.error("Error processing submission:", error);
    res.status(500).json({ message: "Failed to process submission", error: error.message });
  }
};

const rejectSubmission = async (req, res) => {
  try {
    const { notes } = req.body;

    const submission = await ClientSubmission.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({
      success: true,
      message: "Submission rejected",
      submission,
    });
  } catch (error) {
    console.error("Error rejecting submission:", error);
    res.status(500).json({ message: "Failed to reject submission", error: error.message });
  }
};

const expireOldRequests = async () => {
  try {
    const result = await DocumentRequest.updateMany(
      {
        status: "pending",
        expiresAt: { $lt: new Date() },
      },
      { status: "expired" }
    );
    console.log(`Expired ${result.modifiedCount} old document requests`);
    return result;
  } catch (error) {
    console.error("Error expiring old requests:", error);
    throw error;
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createDocumentRequest,
  getDocumentRequests,
  getDocumentRequestById,
  cancelDocumentRequest,
  resendDocumentRequest,
  getPublicForm,
  submitPublicForm,
  getSubmissions,
  getSubmissionById,
  reviewSubmission,
  processSubmission,
  rejectSubmission,
  expireOldRequests,
};
