// controllers/jobController.js
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
    const placeholder = `http://localhost:5000/temp-uploads/${path.basename(
      filePath
    )}`;
    return { success: false, url: placeholder, error: error.message };
  }
};

const createJob = async (req, res) => {
  try {
    const {
      serviceType,
      assignedPerson,
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
    } = req.body;

    if (
      !serviceType ||
      !assignedPerson || // Now required
      !jobDetails ||
      !clientName ||
      !gmail ||
      !startingPoint
    ) {
      return res.status(400).json({ message: "Missing required text fields" });
    }

    if (!gmail.endsWith("@gmail.com")) {
      return res
        .status(400)
        .json({ message: "Please provide a valid Gmail address" });
    }

    if (!req.files["documentPassport"] || !req.files["documentID"]) {
      return res
        .status(400)
        .json({ message: "Required documents are missing" });
    }

    // Check if client exists, create if not
    let client = await Client.findOne({ gmail });
    if (!client) {
      client = new Client({ name: clientName, gmail, startingPoint });
      await client.save();
    }

    const documentPassportUrl = await safeCloudinaryUpload(
      req.files["documentPassport"][0].path
    );
    const documentIDUrl = await safeCloudinaryUpload(
      req.files["documentID"][0].path
    );
    const otherDocumentsUrls = req.files["otherDocuments"]
      ? await Promise.all(
          req.files["otherDocuments"].map((file) =>
            safeCloudinaryUpload(file.path)
          )
        )
      : [];

    const job = new Job({
      clientId: client._id,
      serviceType,
      documentPassport: documentPassportUrl.url,
      documentID: documentIDUrl.url,
      otherDocuments: otherDocumentsUrls.map((result) => result.url),
      assignedPerson, // Now stores user ID
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
      // Initialize the timeline with job creation
      timeline: [
        {
          status: "created",
          description: "Job created",
          timestamp: new Date(),
          updatedBy: req.user._id,
        },
      ],
    });

    const savedJob = await job.save();

    // Notification logic (unchanged)
    await notificationService.createNotification(
      {
        title: "New Job Created",
        description: `A new ${serviceType} job has been created for ${clientName}.`,
        type: "job",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      { "role.permissions.complianceManagement": true }
    );

    await notificationService.createNotification(
      {
        title: "New Job Created by Admin",
        description: `Admin ${req.user.name} created a new ${serviceType} job for ${clientName}.`,
        type: "job",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      { "role.name": "admin" }
    );

    await notificationService.createNotification(
      {
        title: "Job Created Successfully",
        description: `You have successfully created a ${serviceType} job for ${clientName}.`,
        type: "job",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      { _id: req.user._id }
    );

    // NEW: Notification to the assigned person
    await notificationService.createNotification(
      {
        title: "New Job Assigned",
        description: `You have been assigned to a new ${serviceType} job for ${clientName}.`,
        type: "job",
        subType: "assignment", // Used for styling
        relatedTo: { model: "Job", id: savedJob._id },
      },
      assignedPerson // Direct user ID
    );

    res.status(201).json(savedJob);
  } catch (error) {
    console.error("Error creating job:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get single job details with validation for assigned person
const getJobDetails = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'name gmail startingPoint')
      .populate('assignedPerson', 'name email')
      .populate('timeline.updatedBy', 'name');
      
    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }
    
    // Check if user is authorized to view this job
    // Allow if: user is admin, has compliance management permission, or is the assigned person
    const isAdmin = req.user.role?.name === "admin";
    const hasCompliancePermission = req.user.role?.permissions?.complianceManagement;
    const isAssignedPerson = job.assignedPerson?._id.toString() === req.user._id.toString();
    
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



// Get All Jobs (existing function)
const getAllJobs = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get All Jobs Admin (existing function)
const getAllJobsAdmin = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Approve Job (updated function with timeline)
const approveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  job.status = "approved";

  // Add timeline entry for job approval (Screening Done)
  job.timeline.push({
    status: "screening_done",
    description: "Screening Done",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  const updatedJob = await job.save();

  // Create notification for job approval
  try {
    // Notify the approving user
    await notificationService.createNotification(
      {
        title: "Job Approved",
        description: `The ${job.serviceType} job for ${job.clientName} has been approved.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    // Notify all admins
    await notificationService.createNotification(
      {
        title: "Job Approved",
        description: `The ${job.serviceType} job for ${job.clientName} has been approved by ${req.user.name}.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
    // Continue even if notification fails
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
      // Clean up temporary file after successful upload
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } else {
      console.error("Failed to upload rejection document:", uploadResult.error);
      // Proceed even if upload fails, as the document is optional
    }
  }

  job.status = "rejected";
  job.rejectionReason = rejectionReason;
  if (rejectionDocumentUrl) {
    job.rejectionDocument = rejectionDocumentUrl;
  }

  // Add timeline entry for job rejection
  job.timeline.push({
    status: "rejected",
    description: `Job rejected: ${rejectionReason}`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  const updatedJob = await job.save();

  // Create notification for job rejection
  try {
    // Notify the rejecting user
    await notificationService.createNotification(
      {
        title: "Job Rejected",
        description: `The ${job.serviceType} job for ${job.clientName} has been rejected: ${rejectionReason}`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    // Notify all admins
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
    // Continue even if notification fails
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

  // Update job status and set cancellation reason
  job.status = "cancelled";
  job.cancellationReason = cancellationReason;

  // Add timeline entry for job cancellation
  job.timeline.push({
    status: "cancelled",
    description: `Job cancelled: ${cancellationReason}`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  const updatedJob = await job.save();

  // Create notification for job cancellation
  try {
    // Notify the cancelling admin
    await notificationService.createNotification(
      {
        title: "Job Cancelled",
        description: `The ${job.serviceType} job for ${job.clientName} has been cancelled: ${cancellationReason}`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    // Notify all admins
    await notificationService.createNotification(
      {
        title: "Job Cancelled",
        description: `The ${job.serviceType} job for ${job.clientName} has been cancelled by ${req.user.name}.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );

    // Notify compliance management team
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
    // Continue even if notification fails
  }

  res.status(200).json(updatedJob);
});

// Resubmit Job (updated function with timeline)
const resubmitJob = asyncHandler(async (req, res) => {
  // Find the job by ID
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if the job is rejected
  if (job.status !== "rejected") {
    res.status(400);
    throw new Error("Only rejected jobs can be resubmitted");
  }

  // Extract resubmission notes from the request body
  const { resubmitNotes } = req.body;

  // Initialize the resubmission object with defaults from the original documents
  const resubmission = {
    resubmitNotes,
    newDocumentPassport: job.documentPassport,
    newDocumentID: job.documentID,
    newOtherDocuments: job.otherDocuments || [],
  };

  // Handle new passport document upload
  if (req.files && req.files["newDocumentPassport"]) {
    const uploadResult = await safeCloudinaryUpload(
      req.files["newDocumentPassport"][0].path
    );
    resubmission.newDocumentPassport = uploadResult.url;
    fs.unlink(req.files["newDocumentPassport"][0].path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }

  // Handle new ID document upload
  if (req.files && req.files["newDocumentID"]) {
    const uploadResult = await safeCloudinaryUpload(
      req.files["newDocumentID"][0].path
    );
    resubmission.newDocumentID = uploadResult.url;
    fs.unlink(req.files["newDocumentID"][0].path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }

  // Handle new other documents upload
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

  // Add the resubmission to the job's resubmissions array
  job.resubmissions.push(resubmission);

  // Update job status and clear rejection details
  job.status = "corrected";
  job.rejectionReason = undefined;
  job.rejectionDocument = undefined;

  // Add timeline entry for job resubmission
  job.timeline.push({
    status: "corrected",
    description: resubmitNotes
      ? `Job resubmitted: ${resubmitNotes}`
      : "Job resubmitted",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  // Save the updated job
  const updatedJob = await job.save();

  // Create notification for job resubmission
  try {
    // Notify compliance management team
    await notificationService.createNotification(
      {
        title: "Job Resubmitted",
        description: `The ${job.serviceType} job for ${job.clientName} has been resubmitted with corrections.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );

    // Notify admins about the resubmission
    await notificationService.createNotification(
      {
        title: "Job Resubmitted",
        description: `The ${job.serviceType} job for ${job.clientName} has been resubmitted by ${req.user.name} with corrections.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );

    // Personal confirmation to the admin who resubmitted the job
    await notificationService.createNotification(
      {
        title: "Job Resubmission Successful",
        description: `You have successfully resubmitted the ${job.serviceType} job for ${job.clientName} with corrections.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: req.user._id }
    );

    // If there were resubmission notes, include them in a detailed notification
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
    // Continue even if notification fails
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
    
    // Get status filter if provided
    const statusFilter = req.query.status ? { status: req.query.status } : {};
    
    // Combined filter for assigned person and optional status
    const filter = {
      assignedPerson: req.user._id,
      ...statusFilter
    };
    
    // Count total matching documents for pagination
    const total = await Job.countDocuments(filter);
    
    // Get jobs assigned to the current user with pagination
    const jobs = await Job.find(filter)
      .populate('clientId', 'name gmail startingPoint')
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving assigned jobs",
      error: error.message,
    });
  }
});

module.exports = {
  createJob,
  getAllJobs,
  getAllJobsAdmin,
  approveJob,
  rejectJob,
  resubmitJob,
  getJobTimeline,
  cancelJob,
  getAssignedJobs,
  getJobDetails,
};