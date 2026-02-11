const asyncHandler = require("express-async-handler");
const KycApproval = require("../models/kycApprovalModel");
const Job = require("../models/Job");
const User = require("../models/userModel");
const Archive = require("../models/archiveModel");
const notificationService = require("../services/notificationService");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/fileUploadService");
const { addSignatureToPdf } = require("../services/pdfSignatureService");
const { sendKycReviewEmail, sendKycRejectionEmail } = require("../services/emailService");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

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

const getKycStatusSafely = async (jobId) => {
  try {
    const kycApproval = await KycApproval.findOne({ jobId })
      .populate("amlSupervisorApproval.approvedBy", "name email")
      .populate("lmroApproval.approvedBy", "name email")
      .populate("dlmroApproval.approvedBy", "name email")
      .populate("ceoApproval.approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .populate("amlSupervisorApproval.document.uploadedBy", "name email")
      .populate("lmroApproval.document.uploadedBy", "name email")
      .populate("dlmroApproval.document.uploadedBy", "name email")
      .populate("ceoApproval.document.uploadedBy", "name email")
      .populate("amlSupervisorApproval.modifiedBy", "name email")
      .populate("lmroApproval.modifiedBy", "name email")
      .populate("dlmroApproval.modifiedBy", "name email")
      .populate("ceoApproval.modifiedBy", "name email")
      .populate("amlSupervisorApproval.deletedBy", "name email")
      .populate("lmroApproval.deletedBy", "name email")
      .populate("dlmroApproval.deletedBy", "name email")
      .populate("ceoApproval.deletedBy", "name email");

    return kycApproval;
  } catch (error) {
    console.error(`Error getting KYC status for job ${jobId}:`, error);
    return null;
  }
};

const sendKycNotificationAndEmail = async (job, targetPermission, stage) => {
  const users = await User.find({})
    .populate({
      path: "role",
      select: "name permissions",
    })
    .select("_id name email role");

  const targetUsers = users.filter((user) => {
    if (!user.role || !user.role.permissions) return false;
    const kycPerms = user.role.permissions.kycManagement;
    return kycPerms && kycPerms[targetPermission] === true;
  });

  await notificationService.createNotification(
    {
      title: "KYC Document Review Required",
      description: `KYC document for ${job.clientName} requires your review and signature`,
      type: "kyc",
      relatedTo: { model: "Job", id: job._id },
    },
    { [`role.permissions.kycManagement.${targetPermission}`]: true }
  );

  for (const user of targetUsers) {
    try {
      await sendKycReviewEmail(user.email, user.name, job.clientName, job.jobNumber || job._id, stage);
    } catch (emailErr) {
      console.error(`Failed to send email to ${user.email}:`, emailErr.message);
    }
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
      kycApproval = new KycApproval({
        jobId,
        status: "in_progress",
        currentApprovalStage: "amlSupervisor",
      });

      await kycApproval.save();
    }

    job.status = "kyc_pending";
    job.timeline.push({
      status: "kyc_pending",
      description: "KYC process initialized - awaiting AML Supervisor document upload",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await job.save();

    try {
      await notificationService.createNotification(
        {
          title: "New KYC Document Upload Required",
          description: `KYC document upload required for ${job.clientName}'s job`,
          type: "kyc",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.permissions.kycManagement.amlSupervisor": true }
      );
    } catch (notifError) {
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

// FIXED: Get KYC approval status with complete population
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

    const kycApproval = await KycApproval.findOne({ jobId })
      .populate("amlSupervisorApproval.approvedBy", "name email")
      .populate("lmroApproval.approvedBy", "name email")
      .populate("dlmroApproval.approvedBy", "name email")
      .populate("ceoApproval.approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .populate("amlSupervisorApproval.document.uploadedBy", "name email")
      .populate("lmroApproval.document.uploadedBy", "name email")
      .populate("dlmroApproval.document.uploadedBy", "name email")
      .populate("ceoApproval.document.uploadedBy", "name email")
      .populate("amlSupervisorApproval.modifiedBy", "name email")
      .populate("lmroApproval.modifiedBy", "name email")
      .populate("dlmroApproval.modifiedBy", "name email")
      .populate("ceoApproval.modifiedBy", "name email")
      .populate("amlSupervisorApproval.deletedBy", "name email")
      .populate("lmroApproval.deletedBy", "name email")
      .populate("dlmroApproval.deletedBy", "name email")
      .populate("ceoApproval.deletedBy", "name email");

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

const amlSupervisorUpload = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes } = req.body;

  // Admin bypass or AML Supervisor permission check
  const isAdmin = req.user.role.name === "admin";
  const hasAmlSupervisorPermission = req.user.role.permissions?.kycManagement?.amlSupervisor;

  if (!isAdmin && !hasAmlSupervisorPermission) {
    return res.status(403).json({ message: "Insufficient permissions. AML Supervisor role required." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Document upload is required" });
  }

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({ message: `KYC process is already ${kycApproval.status}` });
  }

  if (kycApproval.currentApprovalStage !== "amlSupervisor") {
    return res.status(400).json({
      message: `Current approval stage is ${kycApproval.currentApprovalStage}, not AML Supervisor`,
    });
  }

  try {
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: "kyc-documents/aml-supervisor",
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    kycApproval.amlSupervisorApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: notes || "",
      document: {
        fileUrl: cloudinaryResult.url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        cloudinaryId: cloudinaryResult.publicId,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
      },
    };

    kycApproval.currentApprovalStage = "dlmro";
    await kycApproval.save();

    const job = await Job.findById(jobId);
    job.status = "kyc_aml_uploaded";
    job.timeline.push({
      status: "kyc_aml_uploaded",
      description: "KYC document uploaded by AML Supervisor",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    try {
      await sendKycNotificationAndEmail(job, "dlmro", "dlmro");
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    const populatedKycApproval = await getKycStatusSafely(jobId);

    res.status(200).json({
      exists: true,
      ...populatedKycApproval.toObject(),
    });
  } catch (error) {
    console.error(`Error in AML Supervisor upload for job ${jobId}:`, error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Server error processing AML Supervisor upload",
      error: error.message,
    });
  }
});

const dlmroSign = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes, signaturePosition, signaturePositions } = req.body;

  // Admin bypass or DLMRO permission check
  const isAdmin = req.user.role.name === "admin";
  const hasDlmroPermission = req.user.role.permissions?.kycManagement?.dlmro;

  if (!isAdmin && !hasDlmroPermission) {
    return res.status(403).json({ message: "Insufficient permissions. DLMRO role required." });
  }

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({ message: `KYC process is already ${kycApproval.status}` });
  }

  if (kycApproval.currentApprovalStage !== "dlmro") {
    return res.status(400).json({
      message: `Current approval stage is ${kycApproval.currentApprovalStage}, not DLMRO`,
    });
  }

  if (!kycApproval.amlSupervisorApproval.approved) {
    return res.status(400).json({ message: "AML Supervisor approval is required first" });
  }

  const user = await User.findById(req.user._id);
  if (!user.signatureImage?.fileUrl) {
    return res.status(400).json({ message: "You do not have a signature uploaded. Please contact admin to upload your signature." });
  }

  try {
    const currentDocUrl = kycApproval.amlSupervisorApproval.document.fileUrl;
    // Support both single position and multiple positions
    const positionData = signaturePositions || signaturePosition || "dlmro";
    const signedPdfBuffer = await addSignatureToPdf(currentDocUrl, user.signatureImage.fileUrl, positionData);

    const tempDir = path.join(__dirname, "../temp-uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `signed-dlmro-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, signedPdfBuffer);

    const cloudinaryResult = await uploadToCloudinary(tempFilePath, {
      folder: "kyc-documents/dlmro-signed",
    });

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload signed document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    kycApproval.dlmroApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: notes || "",
      document: {
        fileUrl: cloudinaryResult.url,
        fileName: `DLMRO-signed-${kycApproval.amlSupervisorApproval.document.fileName}`,
        fileType: "application/pdf",
        cloudinaryId: cloudinaryResult.publicId,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
      },
    };

    kycApproval.currentApprovalStage = "lmro";
    await kycApproval.save();

    const job = await Job.findById(jobId);
    job.status = "kyc_dlmro_signed";
    job.timeline.push({
      status: "kyc_dlmro_signed",
      description: "KYC document signed by DLMRO",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    try {
      await sendKycNotificationAndEmail(job, "lmro", "lmro");
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    const populatedKycApproval = await getKycStatusSafely(jobId);

    res.status(200).json({
      exists: true,
      ...populatedKycApproval.toObject(),
    });
  } catch (error) {
    console.error(`Error in DLMRO sign for job ${jobId}:`, error);
    res.status(500).json({
      message: "Server error processing DLMRO signature",
      error: error.message,
    });
  }
});

const lmroSign = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes, signaturePosition, signaturePositions } = req.body;

  // Admin bypass or LMRO permission check
  const isAdmin = req.user.role.name === "admin";
  const hasLmroPermission = req.user.role.permissions?.kycManagement?.lmro;

  if (!isAdmin && !hasLmroPermission) {
    return res.status(403).json({ message: "Insufficient permissions. LMRO role required." });
  }

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({ message: `KYC process is already ${kycApproval.status}` });
  }

  if (kycApproval.currentApprovalStage !== "lmro") {
    return res.status(400).json({
      message: `Current approval stage is ${kycApproval.currentApprovalStage}, not LMRO`,
    });
  }

  if (!kycApproval.dlmroApproval.approved) {
    return res.status(400).json({ message: "DLMRO approval is required first" });
  }

  const user = await User.findById(req.user._id);
  if (!user.signatureImage?.fileUrl) {
    return res.status(400).json({ message: "You do not have a signature uploaded. Please contact admin to upload your signature." });
  }

  try {
    const currentDocUrl = kycApproval.dlmroApproval.document.fileUrl;
    // Support both single position and multiple positions
    const positionData = signaturePositions || signaturePosition || "lmro";
    const signedPdfBuffer = await addSignatureToPdf(currentDocUrl, user.signatureImage.fileUrl, positionData);

    const tempDir = path.join(__dirname, "../temp-uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `signed-lmro-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, signedPdfBuffer);

    const cloudinaryResult = await uploadToCloudinary(tempFilePath, {
      folder: "kyc-documents/lmro-signed",
    });

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload signed document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    kycApproval.lmroApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: notes || "",
      document: {
        fileUrl: cloudinaryResult.url,
        fileName: `LMRO-signed-${kycApproval.dlmroApproval.document.fileName}`,
        fileType: "application/pdf",
        cloudinaryId: cloudinaryResult.publicId,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
      },
    };

    kycApproval.currentApprovalStage = "ceo";
    await kycApproval.save();

    const job = await Job.findById(jobId);
    job.status = "kyc_lmro_signed";
    job.timeline.push({
      status: "kyc_lmro_signed",
      description: "KYC document signed by LMRO",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    try {
      await sendKycNotificationAndEmail(job, "ceo", "ceo");
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    const populatedKycApproval = await getKycStatusSafely(jobId);

    res.status(200).json({
      exists: true,
      ...populatedKycApproval.toObject(),
    });
  } catch (error) {
    console.error(`Error in LMRO sign for job ${jobId}:`, error);
    res.status(500).json({
      message: "Server error processing LMRO signature",
      error: error.message,
    });
  }
});

const ceoSign = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { notes, signaturePosition, signaturePositions } = req.body;

  // Admin bypass or CEO permission check
  const isAdmin = req.user.role.name === "admin";
  const hasCeoPermission = req.user.role.permissions?.kycManagement?.ceo;

  if (!isAdmin && !hasCeoPermission) {
    return res.status(403).json({ message: "Insufficient permissions. CEO role required." });
  }

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "rejected" || kycApproval.status === "completed") {
    return res.status(400).json({ message: `KYC process is already ${kycApproval.status}` });
  }

  if (kycApproval.currentApprovalStage !== "ceo") {
    return res.status(400).json({
      message: `Current approval stage is ${kycApproval.currentApprovalStage}, not CEO`,
    });
  }

  if (!kycApproval.lmroApproval.approved) {
    return res.status(400).json({ message: "LMRO approval is required first" });
  }

  const user = await User.findById(req.user._id);
  if (!user.signatureImage?.fileUrl) {
    return res.status(400).json({ message: "You do not have a signature uploaded. Please contact admin to upload your signature." });
  }

  try {
    const currentDocUrl = kycApproval.lmroApproval.document.fileUrl;
    // Support both single position and multiple positions
    const positionData = signaturePositions || signaturePosition || "ceo";
    const signedPdfBuffer = await addSignatureToPdf(currentDocUrl, user.signatureImage.fileUrl, positionData);

    const tempDir = path.join(__dirname, "../temp-uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `signed-ceo-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, signedPdfBuffer);

    const cloudinaryResult = await uploadToCloudinary(tempFilePath, {
      folder: "kyc-documents/ceo-signed",
    });

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload signed document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    kycApproval.ceoApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: notes || "",
      document: {
        fileUrl: cloudinaryResult.url,
        fileName: `CEO-signed-${kycApproval.lmroApproval.document.fileName}`,
        fileType: "application/pdf",
        cloudinaryId: cloudinaryResult.publicId,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
      },
    };

    kycApproval.status = "completed";
    kycApproval.currentApprovalStage = "completed";
    kycApproval.completedAt = new Date();
    await kycApproval.save();

    const job = await Job.findById(jobId);
    job.status = "completed";
    job.timeline.push({
      status: "completed",
      description: "KYC process completed - document fully signed by DLMRO, LMRO, and CEO",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    await notificationService.createJobNotification(
      {
        title: "KYC Process Completed",
        description: `KYC process for ${job.clientName}'s job has been completed successfully.`,
        type: "kyc",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );

    try {
      const BraApproval = require("../models/braApprovalModel");
      let braExists = await BraApproval.findOne({ jobId });

      if (!braExists) {
        const braApproval = new BraApproval({
          jobId,
          status: "in_progress",
          currentApprovalStage: "lmro",
        });

        await braApproval.save();

        job.status = "bra_pending";
        job.timeline.push({
          status: "bra_pending",
          description: "BRA process automatically initialized after KYC completion",
          timestamp: new Date(),
          updatedBy: req.user._id,
        });

        await job.save();

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
    }

    const populatedKycApproval = await getKycStatusSafely(jobId);

    res.status(200).json({
      exists: true,
      ...populatedKycApproval.toObject(),
      braInitialized: true,
    });
  } catch (error) {
    console.error(`Error in CEO sign for job ${jobId}:`, error);
    res.status(500).json({
      message: "Server error processing CEO signature",
      error: error.message,
    });
  }
});

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

    // FIXED: Return populated data
    const populatedKycApproval = await getKycStatusSafely(jobId);

    // Return exists: true to maintain consistency with other endpoints
    res.status(200).json({
      exists: true,
      ...populatedKycApproval.toObject(),
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

    // FIXED: Return populated data
    const populatedKycApproval = await getKycStatusSafely(jobId);

    // Return exists: true to maintain consistency with other endpoints
    res.status(200).json({
      exists: true,
      ...populatedKycApproval.toObject(),
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

    // Send notification to job parties
    await notificationService.createJobNotification(
      {
        title: "KYC Process Completed",
        description: `KYC process for ${job.clientName}'s job has been completed successfully.`,
        type: "kyc",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
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

    // FIXED: Return populated data
    const populatedKycApproval = await getKycStatusSafely(jobId);

    // Return exists: true to maintain consistency with other endpoints
    res.status(200).json({
      exists: true,
      ...populatedKycApproval.toObject(),
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

  const kycApproval = await KycApproval.findOne({ jobId });

  if (!kycApproval) {
    return res.status(404).json({ message: "KYC approval record not found" });
  }

  if (kycApproval.status === "completed") {
    return res.status(400).json({
      message: "KYC process is already completed and cannot be rejected",
    });
  }

  const stage = kycApproval.currentApprovalStage;
  let hasPermission = false;
  let rejectorRole = null;

  if (stage === "dlmro" && req.user.role.permissions?.kycManagement?.dlmro) {
    hasPermission = true;
    rejectorRole = "dlmro";
  } else if (stage === "lmro" && req.user.role.permissions?.kycManagement?.lmro) {
    hasPermission = true;
    rejectorRole = "lmro";
  } else if (stage === "ceo" && req.user.role.permissions?.kycManagement?.ceo) {
    hasPermission = true;
    rejectorRole = "ceo";
  }

  if (!hasPermission) {
    return res.status(403).json({
      message: `Only DLMRO, LMRO, or CEO can reject at their respective stages. Current stage: ${stage}`,
    });
  }

  const rejectionTime = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  kycApproval.status = "in_progress";
  kycApproval.currentApprovalStage = "amlSupervisor";
  kycApproval.rejectionReason = rejectionReason;
  kycApproval.rejectedBy = req.user._id;
  kycApproval.rejectedAt = new Date();

  kycApproval.amlSupervisorApproval = {};
  kycApproval.dlmroApproval = {};
  kycApproval.lmroApproval = {};
  kycApproval.ceoApproval = {};

  await kycApproval.save();

  const job = await Job.findById(jobId);
  job.status = "kyc_pending";
  job.timeline.push({
    status: "kyc_rejected",
    description: `KYC rejected by ${req.user.name} (${rejectorRole.toUpperCase()}): ${rejectionReason}. Document sent back for AML Supervisor to upload new document.`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  await job.save();

  const users = await User.find({})
    .populate({
      path: "role",
      select: "name permissions",
    })
    .select("_id name email role");

  let emailTargets = [];
  let notificationTargets = [];

  if (rejectorRole === "ceo") {
    emailTargets = ["dlmro", "lmro", "amlSupervisor"];
    notificationTargets = ["dlmro", "lmro", "amlSupervisor"];
  } else if (rejectorRole === "lmro") {
    emailTargets = ["dlmro", "amlSupervisor"];
    notificationTargets = ["dlmro", "amlSupervisor"];
  } else if (rejectorRole === "dlmro") {
    emailTargets = ["amlSupervisor"];
    notificationTargets = ["amlSupervisor"];
  }

  for (const targetRole of emailTargets) {
    const targetUsers = users.filter((user) => {
      if (!user.role || !user.role.permissions) return false;
      const kycPerms = user.role.permissions.kycManagement;
      return kycPerms && kycPerms[targetRole] === true;
    });

    for (const targetUser of targetUsers) {
      try {
        await sendKycRejectionEmail(
          targetUser.email,
          targetUser.name,
          job.clientName,
          job.jobNumber || job._id,
          req.user.name,
          rejectorRole,
          rejectionReason,
          rejectionTime
        );
        console.log(`KYC rejection email sent to ${targetUser.email} (${targetRole})`);
      } catch (emailErr) {
        console.error(`Failed to send rejection email to ${targetUser.email}:`, emailErr.message);
      }
    }
  }

  for (const targetRole of notificationTargets) {
    try {
      await notificationService.createNotification(
        {
          title: "KYC Document Rejected",
          description: `KYC for ${job.clientName} has been rejected by ${req.user.name} (${rejectorRole.toUpperCase()}): "${rejectionReason}". New document upload required.`,
          type: "job",
          subType: "rejection",
          relatedTo: { model: "Job", id: job._id },
        },
        { [`role.permissions.kycManagement.${targetRole}`]: true }
      );
    } catch (notifErr) {
      console.error(`Failed to send notification to ${targetRole}:`, notifErr.message);
    }
  }

  try {
    await notificationService.createJobNotification(
      {
        title: "KYC Rejected",
        description: `KYC for ${job.clientName}'s job rejected by ${req.user.name} (${rejectorRole.toUpperCase()}): ${rejectionReason}`,
        type: "job",
        subType: "rejection",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (adminNotifErr) {
    console.error("Failed to send job notification:", adminNotifErr.message);
  }

  const populatedKycApproval = await getKycStatusSafely(jobId);

  res.status(200).json({
    exists: true,
    message: "KYC rejected successfully. Document sent back to AML Supervisor for new upload.",
    ...populatedKycApproval.toObject(),
  });
});

// FIXED: Update KYC Document function with proper population
const updateKycDocument = asyncHandler(async (req, res) => {
  const { jobId, stage } = req.params; // stage: lmro, dlmro, ceo
  const { notes } = req.body;

  if (!["amlSupervisor", "lmro", "dlmro", "ceo"].includes(stage)) {
    return res.status(400).json({ message: "Invalid approval stage" });
  }

  if (req.user && (!req.user.role || !req.user.role.permissions.kycManagement[stage])) {
    return res.status(403).json({
      message: `Insufficient permissions. ${stage.toUpperCase()} role required.`
    });
  }

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      message: "Document upload is required",
    });
  }

  try {
    const kycApproval = await KycApproval.findOne({ jobId });

    if (!kycApproval) {
      return res.status(404).json({ message: "KYC approval record not found" });
    }

    // Check if the stage has been approved (can only update approved stages)
    const stageApproval = kycApproval[`${stage}Approval`];
    if (!stageApproval || !stageApproval.approved) {
      return res.status(400).json({
        message: `${stage.toUpperCase()} stage has not been approved yet. Cannot update document.`,
      });
    }

    // Get the job to find clientId for archiving
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Archive old document before deleting if it exists
    if (stageApproval.document?.fileUrl) {
      try {
        const stageLabels = { lmro: 'LMRO', dlmro: 'DLMRO', ceo: 'CEO' };
        await Archive.create({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "kyc_document",
          sourceType: "kyc",
          fileUrl: stageApproval.document.fileUrl,
          fileName: stageApproval.document.fileName || `${stageLabels[stage]} KYC Document`,
          title: `${stageLabels[stage]} KYC Approval Document`,
          description: `Archived ${stageLabels[stage]} KYC approval document - replaced`,
          archivedBy: req.user ? req.user._id : null,
          reason: "replaced",
          originalUploadedAt: stageApproval.document.uploadedAt,
          metadata: {
            stage: stage,
            approvedBy: stageApproval.approvedBy,
            approvedAt: stageApproval.approvedAt
          }
        });
        console.log(`Archived old ${stage} KYC document for job ${jobId}`);
      } catch (archiveError) {
        console.error(`Error archiving ${stage} KYC document:`, archiveError);
      }
    }

    // Delete old document from Cloudinary if it exists
    if (stageApproval.document && stageApproval.document.cloudinaryId) {
      const deleteResult = await deleteFromCloudinary(
        stageApproval.document.cloudinaryId
      );
      if (deleteResult.success) {
        console.log(`Deleted old ${stage} document: ${stageApproval.document.cloudinaryId}`);
      } else {
        console.error(`Error deleting old ${stage} document: ${deleteResult.error}`);
      }
    }

    // Upload new document to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: `kyc-documents/${stage}`,
    });

    if (!cloudinaryResult.success) {
      return res.status(500).json({
        message: "Failed to upload document to cloud storage",
        error: cloudinaryResult.error,
      });
    }

    // Update the document in the approval stage
    stageApproval.document = {
      fileUrl: cloudinaryResult.url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      cloudinaryId: cloudinaryResult.publicId,
      uploadedAt: new Date(),
      uploadedBy: req.user ? req.user._id : null,
    };

    // Update notes if provided
    if (notes) {
      stageApproval.notes = notes;
    }

    // FIXED: Mark as modified by current user (ensure ObjectId)
    stageApproval.modifiedAt = new Date();
    stageApproval.modifiedBy = req.user ? req.user._id : null;

    await kycApproval.save();

    // Add timeline entry
    const userName = req.user ? req.user.name : 'Compliance User';
    const userId = req.user ? req.user._id : null;

    job.timeline.push({
      status: `kyc_${stage}_document_updated`,
      description: `KYC ${stage.toUpperCase()} document updated by ${userName}`,
      timestamp: new Date(),
      updatedBy: userId,
    });
    await job.save();

    // Clean up temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Send notifications (only if authenticated user)
    if (req.user) {
      await notificationService.createJobNotification(
        {
          title: "KYC Documents Updated",
          description: `${stage.toUpperCase()} document updated for ${job.clientName}'s KYC by ${req.user.name}`,
          type: "kyc",
          relatedTo: { model: "Job", id: job._id },
        },
        job,
        req.user._id
      );
    }

    // FIXED: Return populated data after update
    const populatedKycApproval = await getKycStatusSafely(jobId);

    res.status(200).json({
      message: `${stage.toUpperCase()} document updated successfully`,
      document: populatedKycApproval[`${stage}Approval`].document,
      kycApproval: populatedKycApproval, // Return the populated KYC data
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

// FIXED: Delete KYC Document function with proper population
const deleteKycDocument = asyncHandler(async (req, res) => {
  const { jobId, stage } = req.params; // stage: lmro, dlmro, ceo

  // Validate stage
  if (!["lmro", "dlmro", "ceo"].includes(stage)) {
    return res.status(400).json({ message: "Invalid approval stage" });
  }

  // Check permissions
  if (!req.user.role.permissions.kycManagement[stage]) {
    return res.status(403).json({ 
      message: `Insufficient permissions. ${stage.toUpperCase()} role required.` 
    });
  }

  try {
    const kycApproval = await KycApproval.findOne({ jobId });

    if (!kycApproval) {
      return res.status(404).json({ message: "KYC approval record not found" });
    }

    const stageApproval = kycApproval[`${stage}Approval`];
    if (!stageApproval || !stageApproval.document) {
      return res.status(404).json({
        message: `No document found for ${stage.toUpperCase()} stage`,
      });
    }

    // Delete document from Cloudinary
    if (stageApproval.document.cloudinaryId) {
      const deleteResult = await deleteFromCloudinary(
        stageApproval.document.cloudinaryId
      );
      if (deleteResult.success) {
        console.log(`Deleted ${stage} document: ${stageApproval.document.cloudinaryId}`);
      } else {
        console.error(`Error deleting ${stage} document: ${deleteResult.error}`);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Remove document from database
    stageApproval.document = undefined;
    stageApproval.deletedAt = new Date();
    stageApproval.deletedBy = req.user._id;

    await kycApproval.save();

    // Add timeline entry
    const job = await Job.findById(jobId);
    job.timeline.push({
      status: `kyc_${stage}_document_deleted`,
      description: `KYC ${stage.toUpperCase()} document deleted by ${req.user.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Send notifications
    await notificationService.createJobNotification(
      {
        title: "KYC Document Deleted",
        description: `${stage.toUpperCase()} document deleted for ${job.clientName}'s KYC by ${req.user.name}`,
        type: "kyc",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );

    res.status(200).json({
      message: `${stage.toUpperCase()} document deleted successfully`,
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
  initializeKyc,
  getKycStatus,
  amlSupervisorUpload,
  dlmroSign,
  lmroSign,
  ceoSign,
  lmroApprove,
  dlmroApprove,
  ceoApprove,
  rejectKyc,
  getAllKycJobs,
  updateKycDocument,
  deleteKycDocument,
};