// controllers/jobController.js - FIXED to handle existing documents
const Job = require("../models/Job");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const notificationService = require("../services/notificationService");
const Client = require("../models/Client");

// Helper function to safely upload to Cloudinary with fallback
const safeCloudinaryUpload = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      timeout: 60000,
      ...options,
    });
    return { success: true, url: result.secure_url };
  } catch (error) {
    console.error(`Cloudinary upload error for ${filePath}:`, error.message);
    const placeholder = `${
      process.env.VITE_BACKEND_URL
    }/temp-uploads/${path.basename(filePath)}`;
    return { success: false, url: placeholder, error: error.message };
  }
};

// Helper function to check if job number exists
const checkJobNumberExists = async (jobNumber) => {
  const existingJob = await Job.findOne({ jobNumber });
  return !!existingJob;
};

const createJob = async (req, res) => {
  try {
    const {
      jobNumber,
      serviceType,
      assignedPerson,
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
      // NEW: Handle existing document parameters
      existingDocumentPassport,
      existingDocumentID,
      existingOtherDocuments,
    } = req.body;

    console.log("Creating job with data:", {
      jobNumber,
      serviceType,
      clientName,
      gmail,
      existingDocumentPassport: !!existingDocumentPassport,
      existingDocumentID: !!existingDocumentID,
      existingOtherDocuments: existingOtherDocuments
        ? Array.isArray(existingOtherDocuments)
          ? existingOtherDocuments.length
          : 1
        : 0,
      uploadedFiles: req.files ? Object.keys(req.files) : "none",
    });

    // Validate required fields including jobNumber
    if (
      !jobNumber ||
      !serviceType ||
      !assignedPerson ||
      !jobDetails ||
      !clientName ||
      !gmail ||
      !startingPoint
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate job number format
    const jobNumberRegex = /^[A-Za-z0-9-]+$/;
    if (!jobNumberRegex.test(jobNumber)) {
      return res.status(400).json({
        message: "Job number must contain only letters, numbers, and hyphens",
      });
    }

    // Check if job number already exists
    const jobNumberExists = await checkJobNumberExists(jobNumber);
    if (jobNumberExists) {
      return res.status(400).json({
        message: "Job number already exists. Please use a unique job number.",
      });
    }

    // Validate email format
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(gmail)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Check if client exists, create if not
    let client = await Client.findOne({ gmail });
    const clientExists = !!client;

    if (!client) {
      client = new Client({ name: clientName, gmail, startingPoint });
      await client.save();
    }

    // FIXED: Handle document URLs - prioritize existing documents, then uploaded files
    let documentPassportUrl = null;
    let documentIDUrl = null;
    let otherDocumentsUrls = [];

    // Handle passport document
    if (existingDocumentPassport) {
      // Use existing document URL
      documentPassportUrl = existingDocumentPassport;
      console.log(
        "Using existing passport document:",
        existingDocumentPassport
      );
    } else if (req.files && req.files["documentPassport"]) {
      // Upload new document
      const uploadResult = await safeCloudinaryUpload(
        req.files["documentPassport"][0].path
      );
      documentPassportUrl = uploadResult.url;
      console.log("Uploaded new passport document:", documentPassportUrl);
    }

    // Handle ID document
    if (existingDocumentID) {
      // Use existing document URL
      documentIDUrl = existingDocumentID;
      console.log("Using existing ID document:", existingDocumentID);
    } else if (req.files && req.files["documentID"]) {
      // Upload new document
      const uploadResult = await safeCloudinaryUpload(
        req.files["documentID"][0].path
      );
      documentIDUrl = uploadResult.url;
      console.log("Uploaded new ID document:", documentIDUrl);
    }

    // Handle other documents
    // First, add existing documents if specified
    if (existingOtherDocuments) {
      if (Array.isArray(existingOtherDocuments)) {
        otherDocumentsUrls = [...existingOtherDocuments];
      } else {
        // Single existing document
        otherDocumentsUrls = [existingOtherDocuments];
      }
      console.log("Using existing other documents:", otherDocumentsUrls);
    }

    // Then, add newly uploaded documents
    if (req.files && req.files["otherDocuments"]) {
      const uploadedOtherDocs = await Promise.all(
        req.files["otherDocuments"].map((file) =>
          safeCloudinaryUpload(file.path)
        )
      );
      const newDocUrls = uploadedOtherDocs.map((result) => result.url);
      otherDocumentsUrls = [...otherDocumentsUrls, ...newDocUrls];
      console.log("Added new other documents:", newDocUrls);
    }

    // Set initial status based on whether client exists
    const initialStatus = clientExists ? "approved" : "pending";

    const job = new Job({
      jobNumber,
      clientId: client._id,
      serviceType,
      documentPassport: documentPassportUrl,
      documentID: documentIDUrl,
      otherDocuments: otherDocumentsUrls,
      assignedPerson,
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
      status: initialStatus,
      createdBy: req.user._id,

      // Initialize the timeline with job creation
      timeline: [
        {
          status: "created",
          description: `Job created with number: ${jobNumber}`,
          timestamp: new Date(),
          updatedBy: req.user._id,
        },
        // Add screening_done entry if client exists
        ...(clientExists
          ? [
              {
                status: "screening_done",
                description:
                  "Screening Done (Auto-approved for existing client)",
                timestamp: new Date(),
                updatedBy: req.user._id,
              },
            ]
          : []),
      ],
    });

    const savedJob = await job.save();

    console.log("Job created successfully:", {
      jobId: savedJob._id,
      jobNumber: savedJob.jobNumber,
      status: savedJob.status,
      documentPassport: savedJob.documentPassport,
      documentID: savedJob.documentID,
      otherDocuments: savedJob.otherDocuments?.length || 0,
    });

    // Clean up temporary files
    if (req.files) {
      const filePaths = [];
      if (req.files["documentPassport"]) {
        filePaths.push(req.files["documentPassport"][0].path);
      }
      if (req.files["documentID"]) {
        filePaths.push(req.files["documentID"][0].path);
      }
      if (req.files["otherDocuments"]) {
        req.files["otherDocuments"].forEach((file) =>
          filePaths.push(file.path)
        );
      }

      filePaths.forEach((filePath) => {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      });
    }

    // Standard notifications for all jobs
    await notificationService.createNotification(
      {
        title: "New Job Created",
        description: `A new ${serviceType} job (${jobNumber}) has been created for ${clientName}.`,
        type: "job",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      { "role.permissions.complianceManagement": true }
    );

    await notificationService.createNotification(
      {
        title: "New Job Created by Admin",
        description: `Admin ${req.user.name} created a new ${serviceType} job (${jobNumber}) for ${clientName}.`,
        type: "job",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      { "role.name": "admin" }
    );

    await notificationService.createNotification(
      {
        title: "Job Created Successfully",
        description: `You have successfully created a ${serviceType} job (${jobNumber}) for ${clientName}.`,
        type: "job",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      { _id: req.user._id }
    );

    // Notification to the assigned person
    await notificationService.createNotification(
      {
        title: "New Job Assigned",
        description: `You have been assigned to a new ${serviceType} job (${jobNumber}) for ${clientName}.`,
        type: "job",
        subType: "assignment",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      assignedPerson
    );

    // Additional notifications for auto-approved jobs
    if (clientExists) {
      // Notify compliance team about auto-approval
      await notificationService.createNotification(
        {
          title: "Job Auto-Approved",
          description: `The ${serviceType} job (${jobNumber}) for ${clientName} was automatically approved (existing client).`,
          type: "job",
          relatedTo: { model: "Job", id: savedJob._id },
        },
        { "role.permissions.complianceManagement": true }
      );

      // Notify the assigned person about the approved status
      await notificationService.createNotification(
        {
          title: "Job Ready for Processing",
          description: `A ${serviceType} job (${jobNumber}) for ${clientName} has been auto-approved and is ready for processing.`,
          type: "job",
          subType: "approval",
          relatedTo: { model: "Job", id: savedJob._id },
        },
        assignedPerson
      );
    }

    res.status(201).json(savedJob);
  } catch (error) {
    console.error("Error creating job:", error.message);

    // Handle unique constraint error specifically
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.jobNumber
    ) {
      return res.status(400).json({
        message: "Job number already exists. Please use a unique job number.",
      });
    }

    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Add a new endpoint to check job number availability
const checkJobNumber = asyncHandler(async (req, res) => {
  const { jobNumber } = req.params;

  if (!jobNumber) {
    return res.status(400).json({ message: "Job number is required" });
  }

  const exists = await checkJobNumberExists(jobNumber);

  res.status(200).json({
    available: !exists,
    message: exists ? "Job number already in use" : "Job number is available",
  });
});

// Get single job details with validation for assigned person
const getJobDetails = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("clientId", "name gmail startingPoint")
      .populate("assignedPerson", "name email")
      .populate("createdBy", "name email")
      .populate("timeline.updatedBy", "name");

    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    // Check if user is authorized to view this job
    const isAdmin = req.user.role?.name === "admin";
    const hasCompliancePermission =
      req.user.role?.permissions?.complianceManagement;
    const isAssignedPerson =
      job.assignedPerson?._id.toString() === req.user._id.toString();

    if (!isAdmin && !hasCompliancePermission && !isAssignedPerson) {
      res.status(403);
      throw new Error("You are not authorized to view this job");
    }

    res.status(200).json(job);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Error retrieving job details",
      error: error.message,
    });
  }
});

// Get All Jobs with improved status filtering
const getAllJobs = asyncHandler(async (req, res) => {
  try {
    let statusFilter = {};
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        statusFilter = { status: { $in: req.query.status } };
      } else {
        statusFilter = { status: req.query.status };
      }
    }

    const filters = {
      ...statusFilter,
    };

    console.log("Job filters:", JSON.stringify(filters));

    const jobs = await Job.find(filters)
      .populate("clientId", "name gmail startingPoint")
      .populate("assignedPerson", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error getting jobs:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Update the getAllJobsAdmin function
const getAllJobsAdmin = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("clientId", "name gmail startingPoint")
      .populate("assignedPerson", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Update the approveJob function to handle document uploads
const approveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  job.status = "approved";

  let approvalDocumentUrl = null;
  if (req.file) {
    const uploadResult = await safeCloudinaryUpload(req.file.path);
    if (uploadResult.success) {
      approvalDocumentUrl = uploadResult.url;
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } else {
      console.error("Failed to upload approval document:", uploadResult.error);
    }
  }

  if (approvalDocumentUrl) {
    job.approvalDocument = approvalDocumentUrl;
  }

  const { approvalNotes } = req.body;
  if (approvalNotes) {
    job.approvalNotes = approvalNotes;
  }

  job.timeline.push({
    status: "screening_done",
    description: approvalNotes
      ? `Screening Done: ${approvalNotes}`
      : "Screening Done",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  const updatedJob = await job.save();

  // Create notification for job approval
  try {
    await notificationService.createNotification(
      {
        title: "Job Approved",
        description: `The ${job.serviceType} job for ${job.clientName} has been approved.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    await notificationService.createNotification(
      {
        title: "Job Approved",
        description: `The ${job.serviceType} job for ${job.clientName} has been approved by ${req.user.name}.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );

    await notificationService.createNotification(
      {
        title: "Job Ready for Processing",
        description: `A ${job.serviceType} job for ${job.clientName} has been approved and is ready for processing.`,
        type: "job",
        subType: "approval",
        relatedTo: { model: "Job", id: job._id },
      },
      job.assignedPerson
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedJob);
});

// Reject Job (updated function with timeline)
const rejectJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  const { rejectionReason } = req.body;
  if (!rejectionReason) {
    res.status(400);
    throw new Error("Rejection reason is required");
  }

  let rejectionDocumentUrl = null;
  if (req.file) {
    const uploadResult = await safeCloudinaryUpload(req.file.path);
    if (uploadResult.success) {
      rejectionDocumentUrl = uploadResult.url;
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } else {
      console.error("Failed to upload rejection document:", uploadResult.error);
    }
  }

  job.status = "rejected";
  job.rejectionReason = rejectionReason;
  if (rejectionDocumentUrl) {
    job.rejectionDocument = rejectionDocumentUrl;
  }

  job.timeline.push({
    status: "rejected",
    description: `Job rejected: ${rejectionReason}`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  const updatedJob = await job.save();

  // Create notification for job rejection
  try {
    await notificationService.createNotification(
      {
        title: "Job Rejected",
        description: `The ${job.serviceType} job for ${job.clientName} has been rejected: ${rejectionReason}`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    await notificationService.createNotification(
      {
        title: "Job Rejected",
        description: `The ${job.serviceType} job for ${job.clientName} has been rejected by ${req.user.name}.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedJob);
});

// Cancel Job (new function)
const cancelJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const { cancellationReason } = req.body;
  if (!cancellationReason) {
    res.status(400);
    throw new Error("Cancellation reason is required");
  }

  job.status = "cancelled";
  job.cancellationReason = cancellationReason;

  job.timeline.push({
    status: "cancelled",
    description: `Job cancelled: ${cancellationReason}`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  const updatedJob = await job.save();

  // Create notification for job cancellation
  try {
    await notificationService.createNotification(
      {
        title: "Job Cancelled",
        description: `The ${job.serviceType} job for ${job.clientName} has been cancelled: ${cancellationReason}`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    await notificationService.createNotification(
      {
        title: "Job Cancelled",
        description: `The ${job.serviceType} job for ${job.clientName} has been cancelled by ${req.user.name}.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );

    await notificationService.createNotification(
      {
        title: "Job Cancelled",
        description: `The ${job.serviceType} job for ${job.clientName} has been cancelled. Reason: ${cancellationReason}`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedJob);
});

// Resubmit Job (updated function with timeline)
const resubmitJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.status !== "rejected") {
    res.status(400);
    throw new Error("Only rejected jobs can be resubmitted");
  }

  const { resubmitNotes } = req.body;

  const resubmission = {
    resubmitNotes,
    newDocumentPassport: job.documentPassport,
    newDocumentID: job.documentID,
    newOtherDocuments: job.otherDocuments || [],
  };

  if (req.files && req.files["newDocumentPassport"]) {
    const uploadResult = await safeCloudinaryUpload(
      req.files["newDocumentPassport"][0].path
    );
    resubmission.newDocumentPassport = uploadResult.url;
    fs.unlink(req.files["newDocumentPassport"][0].path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }

  if (req.files && req.files["newDocumentID"]) {
    const uploadResult = await safeCloudinaryUpload(
      req.files["newDocumentID"][0].path
    );
    resubmission.newDocumentID = uploadResult.url;
    fs.unlink(req.files["newDocumentID"][0].path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }

  if (req.files && req.files["newOtherDocuments"]) {
    const uploadPromises = req.files["newOtherDocuments"].map((file) =>
      safeCloudinaryUpload(file.path).then((result) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
        return result.url;
      })
    );
    resubmission.newOtherDocuments = await Promise.all(uploadPromises);
  }

  job.resubmissions.push(resubmission);
  job.status = "corrected";
  job.rejectionReason = undefined;
  job.rejectionDocument = undefined;

  job.timeline.push({
    status: "corrected",
    description: resubmitNotes
      ? `Job resubmitted: ${resubmitNotes}`
      : "Job resubmitted",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  const updatedJob = await job.save();

  // Create notification for job resubmission
  try {
    await notificationService.createNotification(
      {
        title: "Job Resubmitted",
        description: `The ${job.serviceType} job for ${job.clientName} has been resubmitted with corrections.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );

    await notificationService.createNotification(
      {
        title: "Job Resubmitted",
        description: `The ${job.serviceType} job for ${job.clientName} has been resubmitted by ${req.user.name} with corrections.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );

    await notificationService.createNotification(
      {
        title: "Job Resubmission Successful",
        description: `You have successfully resubmitted the ${job.serviceType} job for ${job.clientName} with corrections.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    if (resubmitNotes) {
      await notificationService.createNotification(
        {
          title: "Job Resubmission Details",
          description: `Resubmission notes for ${job.clientName}'s ${job.serviceType} job: ${resubmitNotes}`,
          type: "job",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.permissions.complianceManagement": true }
      );
    }
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedJob);
});

// New function to get job timeline
const getJobTimeline = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  res.status(200).json(job.timeline);
});

// Get Jobs assigned to current user
const getAssignedJobs = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status ? { status: req.query.status } : {};

    const filter = {
      assignedPerson: req.user._id,
      ...statusFilter,
    };

    const total = await Job.countDocuments(filter);

    const jobs = await Job.find(filter)
      .populate("clientId", "name gmail startingPoint")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving assigned jobs",
      error: error.message,
    });
  }
});

const updateJob = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    const {
      jobNumber,
      serviceType,
      assignedPerson,
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
    } = req.body;

    if (jobNumber && jobNumber !== job.jobNumber) {
      const jobNumberExists = await checkJobNumberExists(jobNumber);
      if (jobNumberExists) {
        return res.status(400).json({
          message: "Job number already exists. Please use a unique job number.",
        });
      }

      const jobNumberRegex = /^[A-Za-z0-9-]+$/;
      if (!jobNumberRegex.test(jobNumber)) {
        return res.status(400).json({
          message: "Job number must contain only letters, numbers, and hyphens",
        });
      }
    }

    if (
      gmail &&
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(gmail)
    ) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    let updatedDocuments = {
      documentPassport: job.documentPassport,
      documentID: job.documentID,
      otherDocuments: job.otherDocuments || [],
    };

    if (req.files && req.files["documentPassport"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["documentPassport"][0].path
      );
      if (uploadResult.success) {
        updatedDocuments.documentPassport = uploadResult.url;
        fs.unlink(req.files["documentPassport"][0].path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
    }

    if (req.files && req.files["documentID"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["documentID"][0].path
      );
      if (uploadResult.success) {
        updatedDocuments.documentID = uploadResult.url;
        fs.unlink(req.files["documentID"][0].path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
    }

    if (req.files && req.files["otherDocuments"]) {
      const uploadPromises = req.files["otherDocuments"].map(async (file) => {
        const result = await safeCloudinaryUpload(file.path);
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
        return result.url;
      });

      const newDocuments = await Promise.all(uploadPromises);

      if (req.body.replaceOtherDocuments === "true") {
        updatedDocuments.otherDocuments = newDocuments;
      } else {
        updatedDocuments.otherDocuments = [
          ...(job.otherDocuments || []),
          ...newDocuments,
        ];
      }
    }

    const updateFields = {
      ...(jobNumber && { jobNumber }),
      ...(serviceType && { serviceType }),
      ...(assignedPerson && { assignedPerson }),
      ...(jobDetails && { jobDetails }),
      ...(specialDescription !== undefined && { specialDescription }),
      ...(clientName && { clientName }),
      ...(gmail && { gmail }),
      ...(startingPoint && { startingPoint }),
      ...updatedDocuments,
    };

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate("clientId", "name gmail startingPoint")
      .populate("assignedPerson", "name email")
      .populate("createdBy", "name email");

    updatedJob.timeline.push({
      status: "updated",
      description: `Job details updated by ${req.user.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await updatedJob.save();

    // Create notifications for job update
    try {
      await notificationService.createNotification(
        {
          title: "Job Updated Successfully",
          description: `You have successfully updated the ${updatedJob.serviceType} job (${updatedJob.jobNumber}) for ${updatedJob.clientName}.`,
          type: "job",
          relatedTo: { model: "Job", id: updatedJob._id },
        },
        { _id: req.user._id }
      );

      await notificationService.createNotification(
        {
          title: "Job Updated",
          description: `The ${updatedJob.serviceType} job (${updatedJob.jobNumber}) for ${updatedJob.clientName} has been updated by ${req.user.name}.`,
          type: "job",
          relatedTo: { model: "Job", id: updatedJob._id },
        },
        { "role.name": "admin" }
      );

      if (assignedPerson && assignedPerson !== job.assignedPerson.toString()) {
        await notificationService.createNotification(
          {
            title: "Job Assignment Updated",
            description: `You have been assigned to an updated ${updatedJob.serviceType} job (${updatedJob.jobNumber}) for ${updatedJob.clientName}.`,
            type: "job",
            subType: "assignment",
            relatedTo: { model: "Job", id: updatedJob._id },
          },
          assignedPerson
        );
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    res.status(200).json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);

    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.jobNumber
    ) {
      return res.status(400).json({
        message: "Job number already exists. Please use a unique job number.",
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = {
  createJob,
  checkJobNumber,
  getAllJobs,
  getAllJobsAdmin,
  approveJob,
  rejectJob,
  resubmitJob,
  getJobTimeline,
  cancelJob,
  getAssignedJobs,
  getJobDetails,
  updateJob,
};
