// controllers/braController.js - COMPLETE VERSION
const asyncHandler = require("express-async-handler");
const BraApproval = require("../models/braApprovalModel");
const Job = require("../models/Job");
const Archive = require("../models/archiveModel");
const notificationService = require("../services/notificationService");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/fileUploadService");
const fs = require("fs");

// Helper function to extract job data for response
const prepareJobForResponse = (job) => {
  try {
    return {
      _id: job._id?.toString() || null,
      clientName: job.clientName || "Unknown Client",
      serviceType: job.serviceType || "Unknown Service",
      status: job.status || "unknown",
      createdAt: job.createdAt || new Date(),
      updatedAt: job.updatedAt || new Date(),
      assignedPerson: job.assignedPerson || null,
      timeline: job.timeline || [],
    };
  } catch (error) {
    console.error("Error preparing job for response:", error);
    return { _id: "error", clientName: "Error processing job data" };
  }
};

// Initialize BRA process for a job
const initializeBra = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    // Check if job exists and has status "completed" (KYC is done)
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Allow initialization only if KYC is completed
    const allowedStatuses = ["completed"];
    if (!allowedStatuses.includes(job.status)) {
      return res.status(400).json({
        message: `Job must have completed KYC process (status: completed) to start BRA. Current status: ${job.status}`,
      });
    }

    // Check if BRA already exists for this job
    let braApproval = await BraApproval.findOne({ jobId });

    if (braApproval) {
      if (braApproval.status === "rejected") {
        return res.status(409).json({
          message: "BRA process was previously rejected for this job",
          braApproval,
        });
      } else {
        return res.status(409).json({
          message: "BRA process already initialized for this job",
          currentStatus: braApproval.status,
          currentStage: braApproval.currentApprovalStage,
        });
      }
    } else {
      // Create new BRA approval record
      braApproval = new BraApproval({
        jobId,
        status: "in_progress",
        currentApprovalStage: "lmro",
      });

      await braApproval.save();
    }

    // Update job status
    job.status = "bra_pending";
    job.timeline.push({
      status: "bra_pending",
      description: "BRA process initialized",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await job.save();

    // Send notifications to LMRO users
    try {
      await notificationService.createNotification(
        {
          title: "New BRA Review Required",
          description: `BRA review required for ${job.clientName}'s job`,
          type: "job",
          subType: "bra",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.permissions.braManagement.lmro": true }
      );
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    res.status(200).json({
      message: "BRA process initialized successfully",
      braApproval,
    });
  } catch (error) {
    console.error(`Error initializing BRA for job ${jobId}:`, error);
    res.status(500).json({
      message: "Failed to initialize BRA process",
      error: error.message,
    });
  }
});

// Get BRA approval status - UPDATED to include enhanced population
const getBraStatus = asyncHandler(async (req, res) => {
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

    // Now check for BRA approval with populated user details
    const braApproval = await BraApproval.findOne({ jobId })
      .populate("lmroApproval.approvedBy", "name email")
      .populate("dlmroApproval.approvedBy", "name email")
      .populate("ceoApproval.approvedBy", "name email")
      .populate("rejectedBy", "name email")
      // Document uploader population
      .populate("lmroApproval.document.uploadedBy", "name email")
      .populate("dlmroApproval.document.uploadedBy", "name email")
      .populate("ceoApproval.document.uploadedBy", "name email")
      // Modified by population
      .populate("lmroApproval.modifiedBy", "name email")
      .populate("dlmroApproval.modifiedBy", "name email")
      .populate("ceoApproval.modifiedBy", "name email")
      // Deleted by population
      .populate("lmroApproval.deletedBy", "name email")
      .populate("dlmroApproval.deletedBy", "name email")
      .populate("ceoApproval.deletedBy", "name email");

    if (!braApproval) {
      return res.status(200).json({
        exists: false,
        message: "BRA approval not initiated yet",
        jobId,
        jobStatus: job.status,
        canInitialize: job.status === "completed",
        jobInfo: {
          clientName: job.clientName,
          serviceType: job.serviceType,
          createdAt: job.createdAt,
          approvalDocument: job.approvalDocument,
          approvalNotes: job.approvalNotes
        },
      });
    }

    // Return with exists:true for consistency
    res.status(200).json({
      exists: true,
      ...braApproval.toObject(),
      jobInfo: {
        clientName: job.clientName,
        serviceType: job.serviceType,
        createdAt: job.createdAt,
        approvalDocument: job.approvalDocument,
        approvalNotes: job.approvalNotes
      }
    });
  } catch (error) {
    console.error(`Error in getBraStatus for job ${jobId}:`, error);
    res.status(500).json({
      message: "Server error retrieving BRA status",
      error: error.message,
    });
  }
});

// Get all BRA jobs
const getAllBraJobs = asyncHandler(async (req, res) => {
  try {
    // Parse the status filter
    let filter = {};
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        filter.status = { $in: req.query.status };
      } else {
        filter.status = req.query.status;
      }
    }

    console.log("BRA Jobs filter:", filter);

    // Find jobs matching the criteria
    const jobs = await Job.find(filter)
      .populate("clientId", "name gmail startingPoint")
      .populate("assignedPerson", "name email")
      .sort({ createdAt: -1 });

    // Transform jobs to ensure safe data
    const safeJobs = jobs.map((job) => prepareJobForResponse(job));

    res.status(200).json(safeJobs);
  } catch (error) {
    console.error("Error getting BRA jobs:", error);
    res.status(500).json({
      message: "Failed to get BRA jobs",
      error: error.message,
    });
  }
});

// LMRO Approval function
const lmroApprove = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes } = req.body;

  // Check if user has LMRO permission
  if (!req.user.role.permissions.braManagement.lmro) {
    return res
      .status(403)
      .json({ message: "Insufficient permissions. LMRO role required." });
  }

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      message: "Document upload is required for LMRO approval",
    });
  }

  // Find the BRA approval record
  const braApproval = await BraApproval.findOne({ jobId });

  if (!braApproval) {
    return res.status(404).json({ message: "BRA approval record not found" });
  }

  if (braApproval.status === "rejected" || braApproval.status === "completed") {
    return res.status(400).json({
      message: `BRA process is already ${braApproval.status}`,
    });
  }

  if (braApproval.currentApprovalStage !== "lmro") {
    return res.status(400).json({
      message: `Current approval stage is ${braApproval.currentApprovalStage}, not LMRO`,
    });
  }

  try {
    // Upload file to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: "bra-documents/lmro",
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    // Get Cloudinary file info
    const fileUrl = cloudinaryResult.url;
    const cloudinaryId = cloudinaryResult.publicId;

    // Update LMRO approval with document info
    braApproval.lmroApproval = {
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
    braApproval.currentApprovalStage = "dlmro";
    await braApproval.save();

    // Update job status
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.status = "bra_lmro_approved";
    job.timeline.push({
      status: "bra_lmro_approved",
      description: "BRA approved by LMRO with document submission",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    
    await job.save();

    // Send notifications to DLMRO users
    await notificationService.createNotification(
      {
        title: "BRA Approval Required",
        description: `LMRO has approved ${job.clientName}'s BRA. DLMRO review required.`,
        type: "job",
        subType: "bra",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.braManagement.dlmro": true }
    );

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`Deleted temporary file: ${req.file.path}`);
    }

    res.status(200).json({
      exists: true,
      ...braApproval.toObject(),
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

// DLMRO Approval with Document Upload
const dlmroApprove = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes } = req.body;

  // Check if user has DLMRO permission
  if (!req.user.role.permissions.braManagement.dlmro) {
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

  const braApproval = await BraApproval.findOne({ jobId });

  if (!braApproval) {
    return res.status(404).json({ message: "BRA approval record not found" });
  }

  if (braApproval.status === "rejected" || braApproval.status === "completed") {
    return res.status(400).json({
      message: `BRA process is already ${braApproval.status}`,
    });
  }

  if (braApproval.currentApprovalStage !== "dlmro") {
    return res.status(400).json({
      message: `Current approval stage is ${braApproval.currentApprovalStage}, not DLMRO`,
    });
  }

  // Ensure LMRO has approved first
  if (!braApproval.lmroApproval.approved) {
    return res.status(400).json({ message: "LMRO approval is required first" });
  }

  try {
    // Delete the LMRO document from Cloudinary if it exists
    if (
      braApproval.lmroApproval.document &&
      braApproval.lmroApproval.document.cloudinaryId
    ) {
      const deleteResult = await deleteFromCloudinary(
        braApproval.lmroApproval.document.cloudinaryId
      );
      if (deleteResult.success) {
        console.log(
          `Deleted LMRO document: ${braApproval.lmroApproval.document.cloudinaryId}`
        );
      } else {
        console.error(`Error deleting LMRO document: ${deleteResult.error}`);
      }
    }

    // Remove the LMRO document info but keep other approval fields
    if (braApproval.lmroApproval.document) {
      braApproval.lmroApproval.document = undefined;
    }

    // Upload new DLMRO document to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: "bra-documents/dlmro",
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    // Get Cloudinary file info
    const fileUrl = cloudinaryResult.url;
    const cloudinaryId = cloudinaryResult.publicId;

    // Update DLMRO approval with document info
    braApproval.dlmroApproval = {
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
    braApproval.currentApprovalStage = "ceo";
    await braApproval.save();

    // Update job status
    const job = await Job.findById(jobId);
    job.status = "bra_dlmro_approved";
    job.timeline.push({
      status: "bra_dlmro_approved",
      description: "BRA approved by DLMRO with document submission",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Send notifications to CEO users
    await notificationService.createNotification(
      {
        title: "Final BRA Approval Required",
        description: `DLMRO has approved ${job.clientName}'s BRA. CEO final review required.`,
        type: "job",
        subType: "bra",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.braManagement.ceo": true }
    );

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`Deleted temporary file: ${req.file.path}`);
    }

    res.status(200).json({
      exists: true,
      ...braApproval.toObject(),
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

// CEO Approval with Document Upload
const ceoApprove = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes } = req.body;

    console.log("CEO Approval Request received:", {
      jobId,
      hasFile: !!req.file,
      fileName: req.file ? req.file.originalname : "No file",
      fileSize: req.file ? req.file.size : 0,
      contentType: req.file ? req.file.mimetype : "N/A",
    });

  // Check if user has CEO permission
  if (!req.user.role.permissions.braManagement.ceo) {
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

  const braApproval = await BraApproval.findOne({ jobId });

  if (!braApproval) {
    return res.status(404).json({ message: "BRA approval record not found" });
  }

  if (braApproval.status === "rejected" || braApproval.status === "completed") {
    return res.status(400).json({
      message: `BRA process is already ${braApproval.status}`,
    });
  }

  if (braApproval.currentApprovalStage !== "ceo") {
    return res.status(400).json({
      message: `Current approval stage is ${braApproval.currentApprovalStage}, not CEO`,
    });
  }

  // Ensure previous approvals exist
  if (
    !braApproval.lmroApproval.approved ||
    !braApproval.dlmroApproval.approved
  ) {
    return res.status(400).json({
      message: "Both LMRO and DLMRO approvals are required first",
    });
  }

  try {
    // Delete the DLMRO document from Cloudinary if it exists
    if (
      braApproval.dlmroApproval.document &&
      braApproval.dlmroApproval.document.cloudinaryId
    ) {
      const deleteResult = await deleteFromCloudinary(
        braApproval.dlmroApproval.document.cloudinaryId
      );
      if (deleteResult.success) {
        console.log(
          `Deleted DLMRO document: ${braApproval.dlmroApproval.document.cloudinaryId}`
        );
      } else {
        console.error(`Error deleting DLMRO document: ${deleteResult.error}`);
      }
    }

    // Remove the DLMRO document info but keep other approval fields
    if (braApproval.dlmroApproval.document) {
      braApproval.dlmroApproval.document = undefined;
    }
    
    console.log(
      `Attempting to upload CEO document to Cloudinary from: ${req.file.path}`
    );

    // Upload new CEO document to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: "bra-documents/ceo",
      timeout: 120000,
      chunk_size: 6000000,
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    // Get Cloudinary file info
    const fileUrl = cloudinaryResult.url;
    const cloudinaryId = cloudinaryResult.publicId;

    // Update CEO approval with document info
    braApproval.ceoApproval = {
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

    // Complete the BRA process
    braApproval.status = "completed";
    braApproval.currentApprovalStage = "completed";
    braApproval.completedAt = new Date();
    await braApproval.save();

    // Update job status to fully completed (both KYC and BRA)
    const job = await Job.findById(jobId);
    job.status = "fully_completed_bra";
    job.timeline.push({
      status: "fully_completed_bra",
      description:
        "BRA process completed and approved with final document submission",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Send notifications to job parties
    await notificationService.createJobNotification(
      {
        title: "BRA Process Completed",
        description: `BRA process for ${job.clientName}'s job has been completed successfully.`,
        type: "job",
        subType: "bra",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`Deleted temporary file: ${req.file.path}`);
    }

    res.status(200).json({
      exists: true,
      ...braApproval.toObject(),
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

// Reject BRA (can be done at any stage)
const rejectBra = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  // Check if user has appropriate permission based on current stage
  const braApproval = await BraApproval.findOne({ jobId });

  if (!braApproval) {
    return res.status(404).json({ message: "BRA approval record not found" });
  }

  if (braApproval.status === "rejected" || braApproval.status === "completed") {
    return res.status(400).json({
      message: `BRA process is already ${braApproval.status}`,
    });
  }

  // Verify permissions based on current stage
  const stage = braApproval.currentApprovalStage;
  let hasPermission = false;

  if (stage === "lmro" && req.user.role.permissions.braManagement.lmro) {
    hasPermission = true;
  } else if (
    stage === "dlmro" &&
    req.user.role.permissions.braManagement.dlmro
  ) {
    hasPermission = true;
  } else if (stage === "ceo" && req.user.role.permissions.braManagement.ceo) {
    hasPermission = true;
  }

  if (!hasPermission) {
    return res.status(403).json({
      message: `Insufficient permissions for current stage: ${stage}`,
    });
  }

  // Update BRA approval status
  braApproval.status = "rejected";
  braApproval.currentApprovalStage = "rejected";
  braApproval.rejectionReason = rejectionReason;
  braApproval.rejectedBy = req.user._id;
  braApproval.rejectedAt = new Date();
  await braApproval.save();

  // Update job status
  const job = await Job.findById(jobId);
  job.status = "bra_rejected";
  job.timeline.push({
    status: "bra_rejected",
    description: `BRA rejected: ${rejectionReason}`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  await job.save();

  // Send notifications to job parties
  await notificationService.createJobNotification(
    {
      title: "BRA Rejected",
      description: `BRA for ${job.clientName}'s job rejected by ${req.user.name}: ${rejectionReason}`,
      type: "job",
      subType: "bra",
      relatedTo: { model: "Job", id: job._id },
    },
    job,
    req.user._id
  );

  res.status(200).json({
    exists: true,
    ...braApproval.toObject(),
  });
});

// NEW FUNCTION: Update BRA document for a specific stage
const updateBraDocument = asyncHandler(async (req, res) => {
  const { jobId, stage } = req.params;
  const { notes } = req.body;

  // Validate stage
  const validStages = ['lmro', 'dlmro', 'ceo'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({ message: 'Invalid approval stage' });
  }

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      message: 'Document upload is required for BRA document update',
    });
  }

  // Find the BRA approval record
  const braApproval = await BraApproval.findOne({ jobId });

  if (!braApproval) {
    return res.status(404).json({ message: 'BRA approval record not found' });
  }

  // Check if user has permission for this stage
  if (!req.user.role.permissions.braManagement[stage]) {
    return res.status(403).json({ 
      message: `Insufficient permissions. ${stage.toUpperCase()} role required.` 
    });
  }

  try {
    // Get the current approval object
    const approvalField = `${stage}Approval`;
    const currentApproval = braApproval[approvalField];

    if (!currentApproval || !currentApproval.approved) {
      return res.status(400).json({
        message: `${stage.toUpperCase()} approval must exist before updating document`
      });
    }

    // Get the job to find clientId for archiving
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Archive old document before deleting if it exists
    if (currentApproval.document?.fileUrl) {
      try {
        const stageLabels = { lmro: 'LMRO', dlmro: 'DLMRO', ceo: 'CEO' };
        await Archive.create({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "bra_document",
          sourceType: "bra",
          fileUrl: currentApproval.document.fileUrl,
          fileName: currentApproval.document.fileName || `${stageLabels[stage]} BRA Document`,
          title: `${stageLabels[stage]} BRA Approval Document`,
          description: `Archived ${stageLabels[stage]} BRA approval document - replaced`,
          archivedBy: req.user._id,
          reason: "replaced",
          originalUploadedAt: currentApproval.document.uploadedAt,
          metadata: {
            stage: stage,
            approvedBy: currentApproval.approvedBy,
            approvedAt: currentApproval.approvedAt
          }
        });
        console.log(`Archived old ${stage} BRA document for job ${jobId}`);
      } catch (archiveError) {
        console.error(`Error archiving ${stage} BRA document:`, archiveError);
      }
    }

    // Delete old document from Cloudinary if it exists
    if (currentApproval.document?.cloudinaryId) {
      const deleteResult = await deleteFromCloudinary(currentApproval.document.cloudinaryId);
      if (deleteResult.success) {
        console.log(`Deleted old ${stage} document: ${currentApproval.document.cloudinaryId}`);
      } else {
        console.error(`Error deleting old ${stage} document: ${deleteResult.error}`);
      }
    }

    // Upload new document to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: `bra-documents/${stage}`,
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: 'Failed to upload document to cloud storage',
        error: cloudinaryResult.error,
      });
    }

    // Update the document in the approval
    braApproval[approvalField].document = {
      fileUrl: cloudinaryResult.url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      cloudinaryId: cloudinaryResult.publicId,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
    };

    // Add modification tracking
    braApproval[approvalField].modifiedAt = new Date();
    braApproval[approvalField].modifiedBy = req.user._id;
    if (notes) {
      braApproval[approvalField].modificationNotes = notes;
    }

    await braApproval.save();

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Add timeline entry
    job.timeline.push({
      status: job.status,
      description: `BRA ${stage.toUpperCase()} document updated`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Populate the response with user details
    await braApproval.populate([
      { path: `${approvalField}.approvedBy`, select: 'name email' },
      { path: `${approvalField}.modifiedBy`, select: 'name email' },
      { path: `${approvalField}.document.uploadedBy`, select: 'name email' }
    ]);

    res.status(200).json({
      message: `${stage.toUpperCase()} document updated successfully`,
      braApproval: braApproval.toObject(),
    });

  } catch (error) {
    console.error(`Error updating ${stage} document for job ${jobId}:`, error);

    // Clean up temporary file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: `Server error updating ${stage.toUpperCase()} document`,
      error: error.message,
    });
  }
});

// NEW FUNCTION: Delete BRA document for a specific stage
const deleteBraDocument = asyncHandler(async (req, res) => {
  const { jobId, stage } = req.params;

  // Validate stage
  const validStages = ['lmro', 'dlmro', 'ceo'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({ message: 'Invalid approval stage' });
  }

  // Find the BRA approval record
  const braApproval = await BraApproval.findOne({ jobId });

  if (!braApproval) {
    return res.status(404).json({ message: 'BRA approval record not found' });
  }

  // Check if user has permission for this stage
  if (!req.user.role.permissions.braManagement[stage]) {
    return res.status(403).json({ 
      message: `Insufficient permissions. ${stage.toUpperCase()} role required.` 
    });
  }

  try {
    // Get the current approval object
    const approvalField = `${stage}Approval`;
    const currentApproval = braApproval[approvalField];

    if (!currentApproval?.document?.cloudinaryId) {
      return res.status(404).json({
        message: `No document found for ${stage.toUpperCase()} stage`
      });
    }

    // Delete document from Cloudinary
    const deleteResult = await deleteFromCloudinary(currentApproval.document.cloudinaryId);
    if (deleteResult.success) {
      console.log(`Deleted ${stage} document: ${currentApproval.document.cloudinaryId}`);
    } else {
      console.error(`Error deleting ${stage} document: ${deleteResult.error}`);
      return res.status(500).json({
        message: 'Failed to delete document from cloud storage',
        error: deleteResult.error,
      });
    }

    // Add deletion tracking before removing document
    braApproval[approvalField].deletedAt = new Date();
    braApproval[approvalField].deletedBy = req.user._id;
    
    // Remove the document object
    braApproval[approvalField].document = undefined;

    await braApproval.save();

    // Add timeline entry
    const job = await Job.findById(jobId);
    if (job) {
      job.timeline.push({
        status: job.status,
        description: `BRA ${stage.toUpperCase()} document deleted`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await job.save();
    }

    // Populate the response with user details
    await braApproval.populate([
      { path: `${approvalField}.approvedBy`, select: 'name email' },
      { path: `${approvalField}.deletedBy`, select: 'name email' }
    ]);

    res.status(200).json({
      message: `${stage.toUpperCase()} document deleted successfully`,
      braApproval: braApproval.toObject(),
    });

  } catch (error) {
    console.error(`Error deleting ${stage} document for job ${jobId}:`, error);
    res.status(500).json({
      message: `Server error deleting ${stage.toUpperCase()} document`,
      error: error.message,
    });
  }
});

module.exports = {
  initializeBra,
  getBraStatus,
  lmroApprove,
  dlmroApprove,
  ceoApprove,
  rejectBra,
  getAllBraJobs,
  updateBraDocument,    // NEW
  deleteBraDocument,    // NEW
};