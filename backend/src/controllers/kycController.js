// controllers/kycController.js
const asyncHandler = require("express-async-handler");
const KycApproval = require("../models/kycApprovalModel");
const Job = require("../models/Job");
const notificationService = require("../services/notificationService");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/fileUploadService");
const fs = require("fs");

// Helper function to extract job data for response
const prepareJobForResponse = (job) => {
  try {
    // Handle potential null/undefined values
    return {
      _id: job._id?.toString() || null,
      clientName: job.clientName || "Unknown Client",
      serviceType: job.serviceType || "Unknown Service",
      status: job.status || "unknown",
      createdAt: job.createdAt || new Date(),
      updatedAt: job.updatedAt || new Date(),
      assignedPerson: job.assignedPerson || null,
      timeline: job.timeline || [],
      // Add other fields as needed, with safe fallbacks
    };
  } catch (error) {
    console.error("Error preparing job for response:", error);
    return { _id: "error", clientName: "Error processing job data" };
  }
};

// Helper function to safely get KYC status
const getKycStatusSafely = async (jobId) => {
  try {
    const kycApproval = await KycApproval.findOne({ jobId })
      .populate("lmroApproval.approvedBy", "name email")
      .populate("dlmroApproval.approvedBy", "name email")
      .populate("ceoApproval.approvedBy", "name email")
      .populate("rejectedBy", "name email");

    return kycApproval;
  } catch (error) {
    console.error(`Error getting KYC status for job ${jobId}:`, error);
    return null;
  }
};

// Initialize KYC process for a job
const initializeKyc = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    // Check if job exists and has status "om_completed"
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // More flexible status checking - allow initialization if not already in KYC process
    const allowedStatuses = ["om_completed"];
    if (!allowedStatuses.includes(job.status)) {
      return res.status(400).json({
        message: `Job must be in one of these statuses to start KYC: ${allowedStatuses.join(
          ", "
        )}. Current status: ${job.status}`,
      });
    }

    // Check if KYC already exists for this job
    let kycApproval = await KycApproval.findOne({ jobId });

    if (kycApproval) {
      // If it exists but is in a failed/rejected state, we could consider allowing re-initialization
      if (kycApproval.status === "rejected") {
        // Option 1: Return an error with more information
        return res.status(409).json({
          message: "KYC process was previously rejected for this job",
          kycApproval,
        });

        // Option 2: Allow reinitialization (remove comment to enable)
        /*
        console.log(`Reinitializing previously rejected KYC for job ${jobId}`);
        kycApproval.status = "in_progress";
        kycApproval.currentApprovalStage = "lmro";
        kycApproval.rejectionReason = null;
        kycApproval.rejectedBy = null;
        kycApproval.rejectedAt = null;
        await kycApproval.save();
        */
      } else {
        return res.status(409).json({
          message: "KYC process already initialized for this job",
          currentStatus: kycApproval.status,
          currentStage: kycApproval.currentApprovalStage,
        });
      }
    } else {
      // Create new KYC approval record
      kycApproval = new KycApproval({
        jobId,
        status: "in_progress",
        currentApprovalStage: "lmro",
      });

      await kycApproval.save();
    }

    // Update job status
    job.status = "kyc_pending";
    job.timeline.push({
      status: "kyc_pending",
      description: "KYC process initialized",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await job.save();

    // Send notifications to LMRO users
    try {
      await notificationService.createNotification(
        {
          title: "New KYC Review Required",
          description: `KYC review required for ${job.clientName}'s job`,
          type: "kyc",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.permissions.kycManagement.lmro": true }
      );
    } catch (notifError) {
      // Log but don't fail if notification sending fails
      console.error("Error sending notification:", notifError);
    }

    res.status(200).json({
      message: "KYC process initialized successfully",
      kycApproval,
    });
  } catch (error) {
    console.error(`Error initializing KYC for job ${jobId}:`, error);
    res.status(500).json({
      message: "Failed to initialize KYC process",
      error: error.message,
    });
  }
});

// Get KYC approval status - UPDATED to include compliance documents
const getKycStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    // Check if the job exists first
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        jobId,
      });
    }

    // Now check for KYC approval
    const kycApproval = await KycApproval.findOne({ jobId })
      .populate("lmroApproval.approvedBy", "name email")
      .populate("dlmroApproval.approvedBy", "name email")
      .populate("ceoApproval.approvedBy", "name email")
      .populate("rejectedBy", "name email");

    if (!kycApproval) {
      // Return 200 with exists:false instead of 404
      return res.status(200).json({
        exists: false,
        message: "KYC approval not initiated yet",
        jobId,
        jobStatus: job.status,
        canInitialize: job.status === "om_completed",
        jobInfo: {
          clientName: job.clientName,
          serviceType: job.serviceType,
          createdAt: job.createdAt,
          // Include compliance approval document and notes
          approvalDocument: job.approvalDocument,
          approvalNotes: job.approvalNotes
        },
      });
    }

    // When returning an existing KYC approval, include exists:true and job details
    res.status(200).json({
      exists: true,
      ...kycApproval.toObject(),
      // Include job details with compliance documents
      jobInfo: {
        clientName: job.clientName,
        serviceType: job.serviceType,
        createdAt: job.createdAt,
        approvalDocument: job.approvalDocument,
        approvalNotes: job.approvalNotes
      }
    });
  } catch (error) {
    console.error(`Error in getKycStatus for job ${jobId}:`, error);
    res.status(500).json({
      message: "Server error retrieving KYC status",
      error: error.message,
    });
  }
});

// Add a new function to get all KYC jobs (can replace the route handler)
const getAllKycJobs = asyncHandler(async (req, res) => {
  try {
    // Parse the status filter
    let filter = {};
    if (req.query.status) {
      // Handle array of statuses
      if (Array.isArray(req.query.status)) {
        filter.status = { $in: req.query.status };
      } else {
        filter.status = req.query.status;
      }
    }

    console.log("KYC Jobs filter:", filter);

    // Find jobs matching the criteria
    const jobs = await Job.find(filter)
      .populate("clientId", "name gmail startingPoint")
      .populate("assignedPerson", "name email")
      .sort({ createdAt: -1 });

    // Transform jobs to ensure safe data
    const safeJobs = jobs.map((job) => prepareJobForResponse(job));

    res.status(200).json(safeJobs);
  } catch (error) {
    console.error("Error getting KYC jobs:", error);
    res.status(500).json({
      message: "Failed to get KYC jobs",
      error: error.message,
    });
  }
});

// LMRO Approval with Document Upload to Cloudinary - FIXED
const lmroApprove = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes } = req.body;

  // Check if user has LMRO permission
  if (!req.user.role.permissions.kycManagement.lmro) {
    return res
      .status(403)
      .json({ message: "Insufficient permissions. LMRO role required." });
  }

  // Check if file was uploaded via multer
  if (!req.file) {
    return res.status(400).json({
      message: "Document upload is required for LMRO approval",
    });
  }

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({
      message: `KYC process is already ${kycApproval.status}`,
    });
  }

  if (kycApproval.currentApprovalStage !== "lmro") {
    return res.status(400).json({
      message: `Current approval stage is ${kycApproval.currentApprovalStage}, not LMRO`,
    });
  }

  try {
    // Upload file to Cloudinary from temp storage
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: "kyc-documents/lmro",
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    // Get Cloudinary file info
    const fileUrl = cloudinaryResult.url; // Actual Cloudinary URL
    const cloudinaryId = cloudinaryResult.publicId; // Actual Cloudinary ID

    // Update LMRO approval with document info
    kycApproval.lmroApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: notes || "",
      document: {
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        cloudinaryId: cloudinaryId,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
      },
    };

    // Move to next stage
    kycApproval.currentApprovalStage = "dlmro";
    await kycApproval.save();

    // Update job status
    const job = await Job.findById(jobId);
    job.status = "kyc_lmro_approved";
    job.timeline.push({
      status: "kyc_lmro_approved",
      description: "KYC approved by LMRO with document submission",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Send notifications to DLMRO users
    await notificationService.createNotification(
      {
        title: "KYC Approval Required",
        description: `LMRO has approved ${job.clientName}'s KYC. DLMRO review required.`,
        type: "kyc",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.kycManagement.dlmro": true }
    );

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`Deleted temporary file: ${req.file.path}`);
    }

    // Return exists: true to maintain consistency with other endpoints
    res.status(200).json({
      exists: true,
      ...kycApproval.toObject(),
    });
  } catch (error) {
    console.error(`Error in LMRO approval for job ${jobId}:`, error);

    // Clean up temporary file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Server error processing LMRO approval",
      error: error.message,
    });
  }
});

// DLMRO Approval with Document Upload - Replaces LMRO document - FIXED
const dlmroApprove = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes } = req.body;

  // Check if user has DLMRO permission
  if (!req.user.role.permissions.kycManagement.dlmro) {
    return res
      .status(403)
      .json({ message: "Insufficient permissions. DLMRO role required." });
  }

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      message: "Document upload is required for DLMRO approval",
    });
  }

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({
      message: `KYC process is already ${kycApproval.status}`,
    });
  }

  if (kycApproval.currentApprovalStage !== "dlmro") {
    return res.status(400).json({
      message: `Current approval stage is ${kycApproval.currentApprovalStage}, not DLMRO`,
    });
  }

  // Ensure LMRO has approved first
  if (!kycApproval.lmroApproval.approved) {
    return res.status(400).json({ message: "LMRO approval is required first" });
  }

  try {
    // Delete the LMRO document from Cloudinary if it exists
    if (
      kycApproval.lmroApproval.document &&
      kycApproval.lmroApproval.document.cloudinaryId
    ) {
      const deleteResult = await deleteFromCloudinary(
        kycApproval.lmroApproval.document.cloudinaryId
      );
      if (deleteResult.success) {
        console.log(
          `Deleted LMRO document: ${kycApproval.lmroApproval.document.cloudinaryId}`
        );
      } else {
        console.error(`Error deleting LMRO document: ${deleteResult.error}`);
        // Continue processing even if deletion fails
      }
    }

    // Remove the LMRO document info
    if (kycApproval.lmroApproval.document) {
      kycApproval.lmroApproval.document = undefined;
      // Keep other approval fields
    }

    // Upload new DLMRO document to Cloudinary from temp storage
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: "kyc-documents/dlmro",
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    // Get Cloudinary file info for new DLMRO document
    const fileUrl = cloudinaryResult.url; // Actual Cloudinary URL
    const cloudinaryId = cloudinaryResult.publicId; // Actual Cloudinary ID

    // Update DLMRO approval with document info
    kycApproval.dlmroApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: notes || "",
      document: {
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        cloudinaryId: cloudinaryId,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
      },
    };

    // Move to next stage
    kycApproval.currentApprovalStage = "ceo";
    await kycApproval.save();

    // Update job status
    const job = await Job.findById(jobId);
    job.status = "kyc_dlmro_approved";
    job.timeline.push({
      status: "kyc_dlmro_approved",
      description: "KYC approved by DLMRO with document submission",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Send notifications to CEO users
    await notificationService.createNotification(
      {
        title: "Final KYC Approval Required",
        description: `DLMRO has approved ${job.clientName}'s KYC. CEO final review required.`,
        type: "kyc",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.kycManagement.ceo": true }
    );

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`Deleted temporary file: ${req.file.path}`);
    }

    // Return exists: true to maintain consistency with other endpoints
    res.status(200).json({
      exists: true,
      ...kycApproval.toObject(),
    });
  } catch (error) {
    console.error(`Error in DLMRO approval for job ${jobId}:`, error);

    // Clean up temporary file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Server error processing DLMRO approval",
      error: error.message,
    });
  }
});

// CEO Approval with Document Upload - Replaces DLMRO document - FIXED
const ceoApprove = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes } = req.body;

  // Check if user has CEO permission
  if (!req.user.role.permissions.kycManagement.ceo) {
    return res
      .status(403)
      .json({ message: "Insufficient permissions. CEO role required." });
  }

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      message: "Document upload is required for CEO approval",
    });
  }

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({
      message: `KYC process is already ${kycApproval.status}`,
    });
  }

  if (kycApproval.currentApprovalStage !== "ceo") {
    return res.status(400).json({
      message: `Current approval stage is ${kycApproval.currentApprovalStage}, not CEO`,
    });
  }

  // Ensure previous approvals exist
  if (
    !kycApproval.lmroApproval.approved ||
    !kycApproval.dlmroApproval.approved
  ) {
    return res.status(400).json({
      message: "Both LMRO and DLMRO approvals are required first",
    });
  }

  try {
    // Delete the DLMRO document from Cloudinary if it exists
    if (
      kycApproval.dlmroApproval.document &&
      kycApproval.dlmroApproval.document.cloudinaryId
    ) {
      const deleteResult = await deleteFromCloudinary(
        kycApproval.dlmroApproval.document.cloudinaryId
      );
      if (deleteResult.success) {
        console.log(
          `Deleted DLMRO document: ${kycApproval.dlmroApproval.document.cloudinaryId}`
        );
      } else {
        console.error(`Error deleting DLMRO document: ${deleteResult.error}`);
        // Continue processing even if deletion fails
      }
    }

    // Remove the DLMRO document info
    if (kycApproval.dlmroApproval.document) {
      kycApproval.dlmroApproval.document = undefined;
      // Keep other approval fields
    }

    // Upload new CEO document to Cloudinary from temp storage
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: "kyc-documents/ceo",
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    // Get Cloudinary file info for new CEO document
    const fileUrl = cloudinaryResult.url; // Actual Cloudinary URL
    const cloudinaryId = cloudinaryResult.publicId; // Actual Cloudinary ID

    // Update CEO approval with document info
    kycApproval.ceoApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: notes || "",
      document: {
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        cloudinaryId: cloudinaryId,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
      },
    };

    // Complete the KYC process
    kycApproval.status = "completed";
    kycApproval.currentApprovalStage = "completed";
    kycApproval.completedAt = new Date();
    await kycApproval.save();

    // Update job status
    const job = await Job.findById(jobId);
    job.status = "completed";
    job.timeline.push({
      status: "completed",
      description:
        "KYC process completed and approved with final document submission",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Send notifications to all parties
    await notificationService.createNotification(
      {
        title: "KYC Process Completed",
        description: `KYC process for ${job.clientName}'s job has been completed successfully.`,
        type: "kyc",
        relatedTo: { model: "Job", id: job._id },
      },
      { _id: job.assignedPerson }
    );

    // Notify admin
    await notificationService.createNotification(
      {
        title: "KYC Completed",
        description: `KYC process for ${job.clientName}'s job has been completed successfully.`,
        type: "kyc",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "admin" }
    );

    // NEW: Initialize BRA process automatically after KYC completion
    try {
      // Import the BRA Approval model
      const BraApproval = require("../models/braApprovalModel");
      
      // Check if BRA already exists for this job
      let braExists = await BraApproval.findOne({ jobId });
      
      if (!braExists) {
        // Create new BRA approval record
        const braApproval = new BraApproval({
          jobId,
          status: "in_progress",
          currentApprovalStage: "lmro",
        });
        
        await braApproval.save();
        
        // Update job status to indicate BRA is pending
        job.status = "bra_pending";
        job.timeline.push({
          status: "bra_pending",
          description: "BRA process automatically initialized after KYC completion",
          timestamp: new Date(),
          updatedBy: req.user._id,
        });
        
        await job.save();
        
        // Send notifications to LMRO users for BRA
        await notificationService.createNotification(
          {
            title: "New BRA Review Required",
            description: `BRA review required for ${job.clientName}'s job after KYC completion`,
            type: "job",
            subType: "bra",
            relatedTo: { model: "Job", id: job._id },
          },
          { "role.permissions.braManagement.lmro": true }
        );
        
        console.log(`BRA process automatically initialized for job ${jobId}`);
      }
    } catch (braError) {
      console.error(`Error auto-initializing BRA process: ${braError.message}`);
      // Don't fail the KYC completion if BRA initialization fails
    }

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`Deleted temporary file: ${req.file.path}`);
    }

    // Return exists: true to maintain consistency with other endpoints
    res.status(200).json({
      exists: true,
      ...kycApproval.toObject(),
      braInitialized: true, // Indicate that BRA has been initialized
    });
  } catch (error) {
    console.error(`Error in CEO approval for job ${jobId}:`, error);

    // Clean up temporary file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Server error processing CEO approval",
      error: error.message,
    });
  }
});

// Reject KYC (can be done at any stage)
const rejectKyc = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  // Check if user has appropriate permission based on current stage
  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({
      message: `KYC process is already ${kycApproval.status}`,
    });
  }

  // Verify permissions based on current stage
  const stage = kycApproval.currentApprovalStage;
  let hasPermission = false;

  if (stage === "lmro" && req.user.role.permissions.kycManagement.lmro) {
    hasPermission = true;
  } else if (
    stage === "dlmro" &&
    req.user.role.permissions.kycManagement.dlmro
  ) {
    hasPermission = true;
  } else if (stage === "ceo" && req.user.role.permissions.kycManagement.ceo) {
    hasPermission = true;
  }

  if (!hasPermission) {
    return res.status(403).json({
      message: `Insufficient permissions for current stage: ${stage}`,
    });
  }

  // Update KYC approval status
  kycApproval.status = "rejected";
  kycApproval.currentApprovalStage = "rejected";
  kycApproval.rejectionReason = rejectionReason;
  kycApproval.rejectedBy = req.user._id;
  kycApproval.rejectedAt = new Date();
  await kycApproval.save();

  // Update job status
  const job = await Job.findById(jobId);
  job.status = "kyc_rejected";
  job.timeline.push({
    status: "kyc_rejected",
    description: `KYC rejected: ${rejectionReason}`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  await job.save();

  // Send notifications
  await notificationService.createNotification(
    {
      title: "KYC Request Rejected",
      description: `KYC for ${job.clientName}'s job has been rejected: ${rejectionReason}`,
      type: "kyc",
      relatedTo: { model: "Job", id: job._id },
    },
    { _id: job.assignedPerson }
  );

  // Notify admin
  await notificationService.createNotification(
    {
      title: "KYC Rejected",
      description: `KYC for ${job.clientName}'s job rejected by ${req.user.name}: ${rejectionReason}`,
      type: "kyc",
      relatedTo: { model: "Job", id: job._id },
    },
    { "role.name": "admin" }
  );

  // Return exists: true to maintain consistency with other endpoints
  res.status(200).json({
    exists: true,
    ...kycApproval.toObject(),
  });
});

module.exports = {
  initializeKyc,
  getKycStatus,
  lmroApprove,
  dlmroApprove,
  ceoApprove,
  rejectKyc,
  getAllKycJobs,
};
