// controllers/operationController.js
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const {
  CompanyDetails,
  PersonDetails,
  KycDocument,
  BraDocument,
  OtherDocumentsDetails,
  UboDetails,
  CddDetails,
} = require("../models/OperationModels");
const Job = require("../models/Job");
const notificationService = require("../services/notificationService");
const mongoose = require("mongoose");
const kycService = require("../services/kycService");
const Client = require("../models/Client");
const { findPersonDetailsByGmail, findAllPersonDetailsByGmail } = require("../utils/clientUtils"); // Import the utility functions
const BraApproval = require("../models/braApprovalModel");
const KycApproval = require("../models/kycApprovalModel");
const ExcelJS = require('exceljs'); // You'll need to install this: npm install exceljs
const Archive = require("../models/archiveModel");

// Helper function to archive a document before replacing
const archiveDocument = async ({
  clientId,
  jobId,
  documentType,
  sourceType,
  personName,
  personId,
  fileUrl,
  fileName,
  archivedBy,
  reason = "replaced",
  originalUploadedAt,
  metadata,
}) => {
  try {
    if (!fileUrl) return null;

    const archive = await Archive.create({
      clientId,
      jobId,
      documentType,
      sourceType,
      personName,
      personId,
      fileUrl,
      fileName,
      archivedBy,
      reason,
      originalUploadedAt,
      metadata,
    });

    console.log(`Document archived: ${documentType} - ${fileUrl}`);
    return archive;
  } catch (error) {
    console.error("Error archiving document:", error);
    return null;
  }
};

// Helper function to safely upload to Cloudinary with fallback (reused from jobController)
const safeCloudinaryUpload = async (filePath, options = {}) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const rawExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf'];
    const resourceType = rawExtensions.includes(ext) ? 'raw' : 'auto';

    const result = await cloudinary.uploader.upload(filePath, {
      timeout: 60000,
      resource_type: resourceType,
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

// Fix the findPersonDetailsByGmail function
// const findPersonDetailsByGmail = async (gmail, personType) => {
//   try {
//     // First find the client by Gmail
//     const client = await Client.findOne({ gmail });
//     if (!client) {
//       console.log(`No client found with Gmail: ${gmail}`);
//       return null;
//     }

//     // Find all jobs for this client
//     const clientJobs = await Job.find({ clientId: client._id });
//     if (!clientJobs || clientJobs.length === 0) {
//       console.log(`No jobs found for client with Gmail: ${gmail}`);
//       return null;
//     }

//     // Get all job IDs for this client
//     const jobIds = clientJobs.map(job => job._id);
//     console.log(`Found ${jobIds.length} jobs for Gmail ${gmail}, searching for ${personType} details`);

//     // Find person details of the specified type for any of these jobs
//     const personDetails = await PersonDetails.findOne({
//       jobId: { $in: jobIds },
//       personType
//     }).sort({ updatedAt: -1 }); // Get the most recently updated one

//     if (personDetails) {
//       console.log(`Found existing ${personType} details for Gmail ${gmail}`);
//     } else {
//       console.log(`No existing ${personType} details found for Gmail ${gmail}`);
//     }

//     return personDetails;
//   } catch (error) {
//     console.error(`Error finding ${personType} details by Gmail ${gmail}:`, error);
//     return null;
//   }
// };

// Helper function to find engagement letter for a client email
const findEngagementLetterByGmail = async (gmail) => {
  try {
    // First find the client by Gmail
    const client = await Client.findOne({ gmail });
    if (!client) return null;

    // Find all jobs for this client
    const clientJobs = await Job.find({ clientId: client._id });
    if (!clientJobs || clientJobs.length === 0) return null;

    // Get all job IDs for this client
    const jobIds = clientJobs.map(job => job._id);

    // Find company details with engagement letters for any of these jobs
    const companyDetailsWithLetter = await CompanyDetails.findOne({
      jobId: { $in: jobIds },
      engagementLetters: { $exists: true, $ne: null }
    }).sort({ updatedAt: -1 }); // Get the most recently updated one

    return companyDetailsWithLetter ? companyDetailsWithLetter.engagementLetters : null;
  } catch (error) {
    console.error('Error finding engagement letter by Gmail:', error);
    return null;
  }
};

const parseDateField = (dateValue) => {
  // Return null for undefined, null, empty string, or "undefined" string
  if (!dateValue || dateValue === 'undefined' || dateValue === 'null' || dateValue.trim() === '') {
    return null;
  }
  
  // Try to parse the date
  const parsedDate = new Date(dateValue);
  
  // Return null if invalid date
  if (isNaN(parsedDate.getTime())) {
    return null;
  }
  
  return parsedDate;
};


// Modify the getCompanyDetails function to check for existing engagement letters
const getCompanyDetails = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is authorized to view this job
  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to view this job");
  }

  // Get company details
  let companyDetails = await CompanyDetails.findOne({ jobId })
    .populate("updatedBy", "name email")
    .populate("documentHistory.performedBy", "name email")
    .populate("engagementLetters.uploadedBy", "name email")
    .populate("crExtract.uploadedBy", "name email")
    .populate("companyMemo.uploadedBy", "name email");

  // If company details don't exist, create them
  if (!companyDetails) {
    // Check if there are existing company details for this client
    const { findCompanyDetailsByGmail } = require("../utils/clientUtils");
    const existingCompanyDetails = await findCompanyDetailsByGmail(job.gmail);

    if (existingCompanyDetails) {
      // Create new company details using existing data
      companyDetails = new CompanyDetails({
        jobId,
        companyName: existingCompanyDetails.companyName || job.clientName || "",
        qfcNo: existingCompanyDetails.qfcNo || "",
        registeredAddress: existingCompanyDetails.registeredAddress || "",
        incorporationDate: existingCompanyDetails.incorporationDate,
        serviceType: existingCompanyDetails.serviceType || "",
        engagementLetters: existingCompanyDetails.engagementLetters,
        mainPurpose: existingCompanyDetails.mainPurpose || "",
        expiryDate: existingCompanyDetails.expiryDate,
        companyComputerCard: existingCompanyDetails.companyComputerCard,
        companyComputerCardExpiry:
          existingCompanyDetails.companyComputerCardExpiry,
        taxCard: existingCompanyDetails.taxCard,
        taxCardExpiry: existingCompanyDetails.taxCardExpiry,
        crExtract: existingCompanyDetails.crExtract,
        crExtractExpiry: existingCompanyDetails.crExtractExpiry,
        scopeOfLicense: existingCompanyDetails.scopeOfLicense,
        scopeOfLicenseExpiry: existingCompanyDetails.scopeOfLicenseExpiry,
        articleOfAssociate: existingCompanyDetails.articleOfAssociate,
        certificateOfIncorporate:
          existingCompanyDetails.certificateOfIncorporate,
        companyMemo: existingCompanyDetails.companyMemo,
        kycActiveStatus: existingCompanyDetails.kycActiveStatus || "yes",
        updatedBy: req.user._id,
      });

      await companyDetails.save();

      // Add a timeline entry to indicate auto-population
      job.timeline.push({
        status: job.status,
        description:
          "Company details auto-populated from existing client record",
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await job.save();

      console.log(
        `Auto-populated company details for job ${jobId} from existing client record with Gmail ${job.gmail}`
      );
    } else {
      // If no existing company details, create with basic info
      companyDetails = new CompanyDetails({
        jobId,
        companyName: job.clientName || "",
        updatedBy: req.user._id,
      });
      await companyDetails.save();
    }
  }

  res.status(200).json(companyDetails);
});


// Complete fix for updateCompanyDetails function in operationController.js
// Replace the entire updateCompanyDetails function with this:

const updateCompanyDetails = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const {
    companyName,
    qfcNo,
    registeredAddress,
    incorporationDate,
    serviceType,
    mainPurpose,
    expiryDate,
    kycActiveStatus,
    syncAcrossJobs,
    deletedCompanyMemoIds,
  } = req.body;

  // Helper function to safely parse dates
  const parseDateField = (dateValue) => {
    // Return null for undefined, null, empty string, or "undefined" string
    if (!dateValue || 
        dateValue === 'undefined' || 
        dateValue === 'null' || 
        dateValue === '' ||
        (typeof dateValue === 'string' && dateValue.trim() === '')) {
      return null;
    }
    
    // Try to parse the date
    const parsedDate = new Date(dateValue);
    
    // Return null if invalid date
    if (isNaN(parsedDate.getTime())) {
      return null;
    }
    
    return parsedDate;
  };

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is authorized
  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  // Find company details
  let companyDetails = await CompanyDetails.findOne({ jobId });
  
  // If not found, create a new one
  if (!companyDetails) {
    console.log(`Creating new company details for job ID: ${jobId}`);
    companyDetails = new CompanyDetails({
      jobId,
      companyName: companyName || job.clientName,
      updatedBy: req.user._id,
    });
  } else {
    console.log(`Updating existing company details for job ID: ${jobId}`);
  }

  // Track which documents were changed for timeline description
  const changedDocuments = [];

  // Update text fields with proper validation
  if (companyName !== undefined) companyDetails.companyName = companyName;
  if (qfcNo !== undefined) companyDetails.qfcNo = qfcNo;
  if (registeredAddress !== undefined) companyDetails.registeredAddress = registeredAddress;
  if (serviceType !== undefined) companyDetails.serviceType = serviceType;
  if (mainPurpose !== undefined) companyDetails.mainPurpose = mainPurpose;
  if (kycActiveStatus !== undefined) companyDetails.kycActiveStatus = kycActiveStatus;

  // FIXED: Proper date handling
  if (incorporationDate !== undefined) {
    const parsedIncorporationDate = parseDateField(incorporationDate);
    companyDetails.incorporationDate = parsedIncorporationDate;
  }

  if (expiryDate !== undefined) {
    const parsedExpiryDate = parseDateField(expiryDate);
    companyDetails.expiryDate = parsedExpiryDate;
  }

  companyDetails.updatedBy = req.user._id;

  // Handle document uploads
  if (req.files) {
    // Engagement Letters - Archive old before replacing
    if (req.files["engagementLetters"]) {
      if (companyDetails.engagementLetters) {
        await archiveDocument({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "engagement_letter",
          sourceType: "company",
          fileUrl: companyDetails.engagementLetters,
          fileName: "Engagement Letter",
          archivedBy: req.user._id,
          reason: "replaced",
        });
      }
      const uploadResult = await safeCloudinaryUpload(
        req.files["engagementLetters"][0].path
      );
      companyDetails.engagementLetters = uploadResult.url;
      changedDocuments.push("Engagement Letter");
      fs.unlink(req.files["engagementLetters"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Company Computer Card - Archive old before replacing
    if (req.files["companyComputerCard"]) {
      if (companyDetails.companyComputerCard) {
        await archiveDocument({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "other_document",
          sourceType: "company",
          fileUrl: companyDetails.companyComputerCard,
          fileName: "Company Computer Card",
          archivedBy: req.user._id,
          reason: "replaced",
        });
      }
      const uploadResult = await safeCloudinaryUpload(
        req.files["companyComputerCard"][0].path
      );
      companyDetails.companyComputerCard = uploadResult.url;
      changedDocuments.push("Company Computer Card");

      if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
      companyDetails.documentHistory.push({
        action: companyDetails.companyComputerCard ? "update" : "upload",
        documentType: "Company Computer Card",
        fileName: req.files["companyComputerCard"][0].originalname || "Company Computer Card",
        fileUrl: uploadResult.url,
        performedBy: req.user._id,
        performedAt: new Date(),
      });

      fs.unlink(req.files["companyComputerCard"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Tax Card - Archive old before replacing
    if (req.files["taxCard"]) {
      if (companyDetails.taxCard) {
        await archiveDocument({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "other_document",
          sourceType: "company",
          fileUrl: companyDetails.taxCard,
          fileName: "Tax Card",
          archivedBy: req.user._id,
          reason: "replaced",
        });
      }
      const uploadResult = await safeCloudinaryUpload(
        req.files["taxCard"][0].path
      );
      companyDetails.taxCard = uploadResult.url;
      changedDocuments.push("Tax Card");

      if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
      companyDetails.documentHistory.push({
        action: companyDetails.taxCard ? "update" : "upload",
        documentType: "Tax Card",
        fileName: req.files["taxCard"][0].originalname || "Tax Card",
        fileUrl: uploadResult.url,
        performedBy: req.user._id,
        performedAt: new Date(),
      });

      fs.unlink(req.files["taxCard"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Handle multiple CR Extract files - Archive old and REPLACE
    if (req.files["crExtract"]) {
      console.log(`🔄 CR Extract replacement: Found ${req.files["crExtract"].length} new files`);

      // Archive existing CR Extract files before replacing
      if (Array.isArray(companyDetails.crExtract) && companyDetails.crExtract.length > 0) {
        for (const doc of companyDetails.crExtract) {
          await archiveDocument({
            clientId: job.clientId,
            jobId: job._id,
            documentType: "cr_extract",
            sourceType: "company",
            fileUrl: doc.fileUrl,
            fileName: doc.fileName || "CR Extract Document",
            archivedBy: req.user._id,
            reason: "replaced",
            originalUploadedAt: doc.uploadedAt,
          });
        }
      }

      companyDetails.crExtract = [];

      for (const file of req.files["crExtract"]) {
        const uploadResult = await safeCloudinaryUpload(file.path);

        const crExtractDocument = {
          fileUrl: uploadResult.url,
          fileName: file.originalname || "CR Extract Document",
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
        };

        companyDetails.crExtract.push(crExtractDocument);

        if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
        companyDetails.documentHistory.push({
          action: "upload",
          documentType: "CR Extract",
          fileName: file.originalname || "CR Extract Document",
          fileUrl: uploadResult.url,
          performedBy: req.user._id,
          performedAt: new Date(),
        });

        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
      changedDocuments.push("CR Extract");
      console.log(`✅ CR Extract replacement completed: Now has ${companyDetails.crExtract.length} files`);
    }

    // Scope of License - Archive old before replacing
    if (req.files["scopeOfLicense"]) {
      if (companyDetails.scopeOfLicense) {
        await archiveDocument({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "other_document",
          sourceType: "company",
          fileUrl: companyDetails.scopeOfLicense,
          fileName: "Scope of License",
          archivedBy: req.user._id,
          reason: "replaced",
        });
      }
      const uploadResult = await safeCloudinaryUpload(
        req.files["scopeOfLicense"][0].path
      );
      companyDetails.scopeOfLicense = uploadResult.url;
      changedDocuments.push("Scope of License");

      if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
      companyDetails.documentHistory.push({
        action: companyDetails.scopeOfLicense ? "update" : "upload",
        documentType: "Scope of License",
        fileName: req.files["scopeOfLicense"][0].originalname || "Scope of License",
        fileUrl: uploadResult.url,
        performedBy: req.user._id,
        performedAt: new Date(),
      });

      fs.unlink(req.files["scopeOfLicense"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Article of Associate - Archive old before replacing
    if (req.files["articleOfAssociate"]) {
      if (companyDetails.articleOfAssociate) {
        await archiveDocument({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "other_document",
          sourceType: "company",
          fileUrl: companyDetails.articleOfAssociate,
          fileName: "Article of Associate",
          archivedBy: req.user._id,
          reason: "replaced",
        });
      }
      const uploadResult = await safeCloudinaryUpload(
        req.files["articleOfAssociate"][0].path
      );
      companyDetails.articleOfAssociate = uploadResult.url;
      changedDocuments.push("Article of Associate");

      if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
      companyDetails.documentHistory.push({
        action: companyDetails.articleOfAssociate ? "update" : "upload",
        documentType: "Article of Associate",
        fileName: req.files["articleOfAssociate"][0].originalname || "Article of Associate",
        fileUrl: uploadResult.url,
        performedBy: req.user._id,
        performedAt: new Date(),
      });

      fs.unlink(req.files["articleOfAssociate"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Certificate of Incorporate - Archive old before replacing
    if (req.files["certificateOfIncorporate"]) {
      if (companyDetails.certificateOfIncorporate) {
        await archiveDocument({
          clientId: job.clientId,
          jobId: job._id,
          documentType: "other_document",
          sourceType: "company",
          fileUrl: companyDetails.certificateOfIncorporate,
          fileName: "Certificate of Incorporate",
          archivedBy: req.user._id,
          reason: "replaced",
        });
      }
      const uploadResult = await safeCloudinaryUpload(
        req.files["certificateOfIncorporate"][0].path
      );
      companyDetails.certificateOfIncorporate = uploadResult.url;
      changedDocuments.push("Certificate of Incorporate");

      if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
      companyDetails.documentHistory.push({
        action: companyDetails.certificateOfIncorporate ? "update" : "upload",
        documentType: "Certificate of Incorporate",
        fileName: req.files["certificateOfIncorporate"][0].originalname || "Certificate of Incorporate",
        fileUrl: uploadResult.url,
        performedBy: req.user._id,
        performedAt: new Date(),
      });

      fs.unlink(req.files["certificateOfIncorporate"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // ADD THIS NEW SECTION FOR COMPANY MEMO (supports multiple files like CR Extract)
    if (req.files["companyMemo"]) {
      // Initialize companyMemo as array if it doesn't exist
if (!Array.isArray(companyDetails.companyMemo)) {
        companyDetails.companyMemo = [];
      }

      // Process each uploaded Company Memo file
// Process each uploaded Company Memo file
      for (const file of req.files["companyMemo"]) {
        const uploadResult = await safeCloudinaryUpload(file.path, {
          folder: `clients/${job.gmail}/company/company_memo`
        });

        const companyMemoDocument = {
          fileUrl: uploadResult.url,
          fileName: file.originalname || "Company Memo Document",
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
        };

        companyDetails.companyMemo.push(companyMemoDocument);

        if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
        companyDetails.documentHistory.push({
          action: "upload",
          documentType: "Company Memo",
          fileName: file.originalname || "Company Memo Document",
          fileUrl: uploadResult.url,
          performedBy: req.user._id,
          performedAt: new Date(),
        });

        // Clean up temporary file
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
      changedDocuments.push("Company Memo");
    }

  }

  // ADD THIS: Handle Company Memo deletions
  if (deletedCompanyMemoIds) {
    try {
      const deletedIds = JSON.parse(deletedCompanyMemoIds);
      if (Array.isArray(deletedIds) && deletedIds.length > 0) {
        if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
        const deletedMemos = companyDetails.companyMemo.filter(
          memo => deletedIds.includes(memo._id.toString())
        );
        for (const memo of deletedMemos) {
          companyDetails.documentHistory.push({
            action: "delete",
            documentType: "Company Memo",
            fileName: memo.fileName,
            fileUrl: memo.fileUrl,
            performedBy: req.user._id,
            performedAt: new Date(),
          });
        }
        companyDetails.companyMemo = companyDetails.companyMemo.filter(
          memo => !deletedIds.includes(memo._id.toString())
        );
        changedDocuments.push("Company Memo (deleted)");
        console.log(`Deleted ${deletedIds.length} Company Memo documents`);
      }
    } catch (parseError) {
      console.error("Error parsing deletedCompanyMemoIds:", parseError);
    }
  }


  // FIXED: Update expiry dates with proper parsing
  if (req.body.companyComputerCardExpiry !== undefined) {
    companyDetails.companyComputerCardExpiry = parseDateField(req.body.companyComputerCardExpiry);
  }

  if (req.body.taxCardExpiry !== undefined) {
    companyDetails.taxCardExpiry = parseDateField(req.body.taxCardExpiry);
  }

  if (req.body.crExtractExpiry !== undefined) {
    companyDetails.crExtractExpiry = parseDateField(req.body.crExtractExpiry);
  }

  if (req.body.scopeOfLicenseExpiry !== undefined) {
    companyDetails.scopeOfLicenseExpiry = parseDateField(req.body.scopeOfLicenseExpiry);
  }

  // === Expiry dates are now optional - removed validation ===
  // Documents can exist without expiry dates as per user requirement

  const updatedCompanyDetails = await companyDetails.save();

  // Update job's clientName to match companyName if it was changed
  if (companyName !== undefined && companyName !== job.clientName) {
    console.log(`🔄 Updating job.clientName from "${job.clientName}" to "${companyName}"`);
    job.clientName = companyName;

    // Also update the Client model's name to keep it in sync
    const Client = require("../models/Client");
    const clientUpdateResult = await Client.findOneAndUpdate(
      { gmail: job.gmail },
      { name: companyName },
      { new: true }
    );

    if (clientUpdateResult) {
      console.log(`✅ Client model updated successfully. New name: "${clientUpdateResult.name}" for email: ${job.gmail}`);
    } else {
      console.log(`⚠️ Client not found for email: ${job.gmail}`);
    }
  }

  // Add a timeline entry for the job
  const timelineDescription = changedDocuments.length > 0
    ? `Company document${changedDocuments.length > 1 ? 's' : ''} updated: ${changedDocuments.join(", ")}`
    : "Company details updated";
  job.timeline.push({
    status: job.status,
    description: timelineDescription,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  // Synchronize changes to other jobs for the same client if requested
  // Convert string 'true' to boolean true
  const shouldSync = syncAcrossJobs === true || syncAcrossJobs === 'true' || syncAcrossJobs === undefined; // Default to true
  
  let syncResult = null;
  if (shouldSync) {
    console.log(`Synchronizing company details across jobs for ${job.gmail}`);
    const { synchronizeCompanyDetails } = require("../utils/clientUtils");
    
    try {
      syncResult = await synchronizeCompanyDetails(job.gmail, job._id);
      console.log("Sync result:", syncResult);
    } catch (syncError) {
      console.error(`Error synchronizing company details: ${syncError.message}`);
      // Continue despite synchronization error
    }
  }

  // Create notification for company details update
  try {
    const notificationText = syncResult && syncResult.success && syncResult.updatedRecords > 0
      ? `Company details updated for ${job.clientName}'s ${job.serviceType} job and synchronized across ${syncResult.updatedRecords} other job(s).`
      : `Company details updated for ${job.clientName}'s ${job.serviceType} job.`;

    await notificationService.createJobNotification(
      {
        title: "Company Details Updated",
        description: notificationText,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json({
    ...updatedCompanyDetails.toObject(),
    syncResult: syncResult,
  });
});

const getPersonDetails = asyncHandler(async (req, res) => {
  const { jobId, personType } = req.params;
  console.log(`Getting ${personType} details for job ${jobId}`);

  // Validate personType
  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    res.status(400);
    throw new Error("Invalid person type");
  }

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  console.log(`Job Gmail: ${job.gmail}, checking for existing person details`);

  // Get person details for this specific job
  const personDetails = await PersonDetails.find({
    jobId,
    personType,
  });

  getEngagementLetters; 

  // If no entries found for this job, auto-populate ALL entries from other jobs
  if (personDetails.length === 0) {
    console.log(
      `No ${personType} details found for job ${jobId}, checking other jobs for Gmail ${job.gmail}`
    );

    // Check for entries from other jobs
    const allExistingPersonDetails = await findAllPersonDetailsByGmail(
      job.gmail,
      personType
    );

    // Filter to only entries from OTHER jobs (not this job)
    const entriesFromOtherJobs = allExistingPersonDetails.filter(
      person => person.jobId.toString() !== jobId
    );

    if (entriesFromOtherJobs.length > 0) {
      console.log(
        `Found ${entriesFromOtherJobs.length} ${personType} entries from other jobs. Auto-populating ALL...`
      );

      // Get unique persons by name to avoid duplicates
      const uniquePersonsMap = new Map();
      entriesFromOtherJobs.forEach(person => {
        const key = (person.name || '').toLowerCase().trim();
        if (key && !uniquePersonsMap.has(key)) {
          uniquePersonsMap.set(key, person);
        }
      });
      const uniquePersons = Array.from(uniquePersonsMap.values());

      console.log(`Creating ${uniquePersons.length} unique ${personType} entries for job ${jobId}`);

      // Create new person details entries for ALL unique persons
      const newPersonDetailsList = [];
      for (const existingPerson of uniquePersons) {
        const newPersonDetails = new PersonDetails({
          jobId,
          personType,
          name: existingPerson.name || "",
          nationality: existingPerson.nationality || "",
          visaCopy: existingPerson.visaCopy,
          qidNo: existingPerson.qidNo || "",
          qidDoc: existingPerson.qidDoc,
          qidExpiry: existingPerson.qidExpiry,
          nationalAddress: existingPerson.nationalAddress || "",
          nationalAddressDoc: existingPerson.nationalAddressDoc,
          nationalAddressExpiry: existingPerson.nationalAddressExpiry,
          passportNo: existingPerson.passportNo || "",
          passportDoc: existingPerson.passportDoc,
          passportExpiry: existingPerson.passportExpiry,
          mobileNo: existingPerson.mobileNo || "",
          email: existingPerson.email || "",
          cv: existingPerson.cv,
          otherDocuments: existingPerson.otherDocuments || [],
          updatedBy: req.user._id,
        });

        await newPersonDetails.save();
        newPersonDetailsList.push(newPersonDetails);
      }

      // Add a timeline entry to indicate auto-population
      job.timeline.push({
        status: job.status,
        description: `${uniquePersons.length} ${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } entries auto-populated from existing client records`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await job.save();

      console.log(
        `Successfully auto-populated ${newPersonDetailsList.length} ${personType} entries for job ${jobId}`
      );

      // Return ALL newly created entries
      res.status(200).json(newPersonDetailsList);
      return;
    }

    // No entries from other jobs either
    console.log(
      `No ${personType} details found for job ${jobId} and no other jobs to copy from`
    );

    // If it's a director request and no existing data found, create a default entry with basic info
    if (personType === "director") {
      console.log(
        `Creating default director entry for job ${jobId} with client name ${job.clientName}`
      );
      const defaultPerson = new PersonDetails({
        jobId,
        personType,
        name: job.clientName || "",
        email: job.gmail || "",
        updatedBy: req.user._id,
      });

      await defaultPerson.save();
      res.status(200).json([defaultPerson]);
    } else {
      // For other person types, just return empty array if nothing found
      res.status(200).json([]);
    }
  } else {
    console.log(
      `Found ${personDetails.length} existing ${personType} entries for job ${jobId}`
    );
    // Return the existing person details for this job
    res.status(200).json(personDetails);
  }
});

// Add person details
const addPersonDetails = asyncHandler(async (req, res) => {
  const { jobId, personType } = req.params;
  const {
    name,
    nationality,
    qidNo,
    qidExpiry,
    nationalAddress,
    nationalAddressExpiry,
    passportNo,
    passportExpiry,
    mobileNo,
    email,
  } = req.body;

  // Validate personType
  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    res.status(400);
    throw new Error("Invalid person type");
  }

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is authorized
  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  // Create new person details
  console.log(`📝 Creating new ${personType} for job ${jobId}`);
  console.log(`   Name: ${name}, Files: ${req.files?.length || 0}`);

  const newPerson = new PersonDetails({
    jobId,
    personType,
    name: name || "",
    nationality: nationality || "",
    qidNo: qidNo || "",
    qidExpiry: qidExpiry || null,
    nationalAddress: nationalAddress || "",
    nationalAddressExpiry: nationalAddressExpiry || null,
    passportNo: passportNo || "",
    passportExpiry: passportExpiry || null,
    mobileNo: mobileNo || "",
    email: email || "",
    updatedBy: req.user._id,
  });

  // Handle document uploads (req.files is an array when using upload.any())
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const { fieldname, path: filePath, originalname } = file;

      // Handle standard document fields
      if (fieldname === "visaCopy") {
        const uploadResult = await safeCloudinaryUpload(filePath);
        newPerson.visaCopy = uploadResult.url;
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "qidDoc") {
        const uploadResult = await safeCloudinaryUpload(filePath);
        newPerson.qidDoc = uploadResult.url;
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "nationalAddressDoc") {
        const uploadResult = await safeCloudinaryUpload(filePath);
        newPerson.nationalAddressDoc = uploadResult.url;
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "passportDoc") {
        const uploadResult = await safeCloudinaryUpload(filePath);
        newPerson.passportDoc = uploadResult.url;
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "cv") {
        const uploadResult = await safeCloudinaryUpload(filePath);
        newPerson.cv = uploadResult.url;
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
    }

    // Other Documents - handle with position preservation
    if (req.body.otherDocumentsMetadata) {
      try {
        const metadata = JSON.parse(req.body.otherDocumentsMetadata);
        const { existingDocs, totalCount } = metadata;
        const finalOtherDocs = [];

        // Create array with correct size
        for (let i = 0; i < totalCount; i++) {
          finalOtherDocs[i] = null;
        }

        // Place existing documents at their positions
        if (Array.isArray(existingDocs)) {
          existingDocs.forEach(doc => {
            finalOtherDocs[doc.index] = {
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              uploadedAt: doc.uploadedAt,
            };
          });
        }

        // Upload and place new files at their positions
        for (const file of req.files) {
          const match = file.fieldname.match(/^otherDocument_(\d+)$/);
          if (match) {
            const index = parseInt(match[1]);
            const uploadResult = await safeCloudinaryUpload(file.path);
            finalOtherDocs[index] = {
              fileUrl: uploadResult.url,
              fileName: file.originalname,
              uploadedAt: new Date(),
            };
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }
        }

        // Filter out null values
        newPerson.otherDocuments = finalOtherDocs.filter(doc => doc !== null);
      } catch (err) {
        console.error("Error parsing otherDocumentsMetadata:", err);
        newPerson.otherDocuments = [];
      }
    }
  }

  const savedPerson = await newPerson.save();

  // Add a timeline entry for the job
  job.timeline.push({
    status: job.status,
    description: `${
      personType.charAt(0).toUpperCase() + personType.slice(1)
    } details added`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  // SYNC: Create this entry in ALL other jobs for the same client
  let syncResult = null;
  if (savedPerson.name) {
    try {
      console.log(`[SYNC] Adding new ${personType} "${savedPerson.name}" to other jobs for client ${job.gmail}`);

      // Find all other jobs for this client
      const Client = require("../models/Client");
      const client = await Client.findOne({ gmail: job.gmail });

      if (client) {
        const otherJobs = await Job.find({
          clientId: client._id,
          _id: { $ne: jobId } // Exclude current job
        });

        console.log(`[SYNC] Found ${otherJobs.length} other jobs for this client`);

        let syncedCount = 0;
        for (const otherJob of otherJobs) {
          // Check if this person already exists in the other job (by name)
          const existingPerson = await PersonDetails.findOne({
            jobId: otherJob._id,
            personType,
            name: { $regex: new RegExp(`^${savedPerson.name.trim()}$`, 'i') }
          });

          if (!existingPerson) {
            // Create the same person in the other job
            const newPersonInOtherJob = new PersonDetails({
              jobId: otherJob._id,
              personType,
              name: savedPerson.name || "",
              nationality: savedPerson.nationality || "",
              visaCopy: savedPerson.visaCopy,
              qidNo: savedPerson.qidNo || "",
              qidDoc: savedPerson.qidDoc,
              qidExpiry: savedPerson.qidExpiry,
              nationalAddress: savedPerson.nationalAddress || "",
              nationalAddressDoc: savedPerson.nationalAddressDoc,
              nationalAddressExpiry: savedPerson.nationalAddressExpiry,
              passportNo: savedPerson.passportNo || "",
              passportDoc: savedPerson.passportDoc,
              passportExpiry: savedPerson.passportExpiry,
              mobileNo: savedPerson.mobileNo || "",
              email: savedPerson.email || "",
              cv: savedPerson.cv,
              otherDocuments: savedPerson.otherDocuments || [],
              updatedBy: req.user._id,
            });

            await newPersonInOtherJob.save();
            syncedCount++;

            // Add timeline entry for the other job
            otherJob.timeline.push({
              status: otherJob.status,
              description: `${personType.charAt(0).toUpperCase() + personType.slice(1)} "${savedPerson.name}" auto-synced from job ${job.jobNumber}`,
              timestamp: new Date(),
              updatedBy: req.user._id,
            });
            await otherJob.save();

            console.log(`[SYNC] Created ${personType} "${savedPerson.name}" in job ${otherJob.jobNumber}`);
          } else {
            console.log(`[SYNC] ${personType} "${savedPerson.name}" already exists in job ${otherJob.jobNumber}`);
          }
        }

        syncResult = { success: true, syncedCount };
        console.log(`[SYNC] Synced to ${syncedCount} other jobs`);
      }
    } catch (syncError) {
      console.error("[SYNC] Error syncing new person to other jobs:", syncError);
      syncResult = { success: false, error: syncError.message };
    }
  }

  // Create notification for person details add
  try {
    await notificationService.createJobNotification(
      {
        title: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } Details Added`,
        description: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } details added for ${job.clientName}'s ${job.serviceType} job.${
          syncResult?.syncedCount > 0 ? ` Also synced to ${syncResult.syncedCount} other jobs.` : ''
        }`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(201).json({ ...savedPerson.toObject(), syncResult });
});

// controllers/operationController.js

// Update person details with synchronization
const updatePersonDetails = asyncHandler(async (req, res) => {
  const { jobId, personType, personId } = req.params;
  const {
    name,
    nationality,
    qidNo,
    qidExpiry,
    nationalAddress,
    nationalAddressExpiry,
    passportNo,
    passportExpiry,
    mobileNo,
    email,
    syncAcrossJobs, // Parameter from client
  } = req.body;

  console.log(`Updating ${personType} details for job ${jobId}, person ${personId}`);

  // Validate personType
  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    res.status(400);
    throw new Error("Invalid person type");
  }

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is authorized
  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  // Find person details
  const personDetails = await PersonDetails.findOne({
    _id: personId,
    jobId,
    personType,
  });

  if (!personDetails) {
    res.status(404);
    throw new Error("Person details not found");
  }

  // Track which documents were changed for timeline description
  const changedDocuments = [];

  // Store original values of all fields before updating
  const originalValues = {
    name: personDetails.name,
    nationality: personDetails.nationality,
    qidNo: personDetails.qidNo,
    qidExpiry: personDetails.qidExpiry,
    nationalAddress: personDetails.nationalAddress,
    nationalAddressExpiry: personDetails.nationalAddressExpiry,
    passportNo: personDetails.passportNo,
    passportExpiry: personDetails.passportExpiry,
    mobileNo: personDetails.mobileNo,
    email: personDetails.email,
    visaCopy: personDetails.visaCopy,
    qidDoc: personDetails.qidDoc,
    nationalAddressDoc: personDetails.nationalAddressDoc,
    passportDoc: personDetails.passportDoc,
    cv: personDetails.cv
  };

  console.log("Original values:", JSON.stringify(originalValues));

  // Update text fields
  if (name !== undefined) personDetails.name = name;
  if (nationality !== undefined) personDetails.nationality = nationality;
  if (qidNo !== undefined) personDetails.qidNo = qidNo;
  if (qidExpiry !== undefined) personDetails.qidExpiry = qidExpiry;
  if (nationalAddress !== undefined)
    personDetails.nationalAddress = nationalAddress;
  if (nationalAddressExpiry !== undefined)
    personDetails.nationalAddressExpiry = nationalAddressExpiry;
  if (passportNo !== undefined) personDetails.passportNo = passportNo;
  if (passportExpiry !== undefined)
    personDetails.passportExpiry = passportExpiry;
  if (mobileNo !== undefined) personDetails.mobileNo = mobileNo;
  if (email !== undefined) personDetails.email = email;
  personDetails.updatedBy = req.user._id;

  // Handle document uploads (req.files is an array when using upload.any())
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const { fieldname, path: filePath, originalname } = file;

      // Handle standard document fields - Archive old document before replacing
      if (fieldname === "visaCopy") {
        if (originalValues.visaCopy) {
          await archiveDocument({
            clientId: job.clientId,
            jobId: job._id,
            documentType: "passport",
            sourceType: personType,
            personName: personDetails.name,
            personId: personDetails._id,
            fileUrl: originalValues.visaCopy,
            fileName: "Visa Copy",
            archivedBy: req.user._id,
            reason: "replaced",
          });
        }
        const uploadResult = await safeCloudinaryUpload(filePath);
        personDetails.visaCopy = uploadResult.url;
        changedDocuments.push("Visa Copy");
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "qidDoc") {
        if (originalValues.qidDoc) {
          await archiveDocument({
            clientId: job.clientId,
            jobId: job._id,
            documentType: "qid",
            sourceType: personType,
            personName: personDetails.name,
            personId: personDetails._id,
            fileUrl: originalValues.qidDoc,
            fileName: "QID Document",
            archivedBy: req.user._id,
            reason: "replaced",
          });
        }
        const uploadResult = await safeCloudinaryUpload(filePath);
        personDetails.qidDoc = uploadResult.url;
        changedDocuments.push("QID Document");
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "nationalAddressDoc") {
        if (originalValues.nationalAddressDoc) {
          await archiveDocument({
            clientId: job.clientId,
            jobId: job._id,
            documentType: "other_document",
            sourceType: personType,
            personName: personDetails.name,
            personId: personDetails._id,
            fileUrl: originalValues.nationalAddressDoc,
            fileName: "National Address Document",
            archivedBy: req.user._id,
            reason: "replaced",
          });
        }
        const uploadResult = await safeCloudinaryUpload(filePath);
        personDetails.nationalAddressDoc = uploadResult.url;
        changedDocuments.push("National Address Document");
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "passportDoc") {
        if (originalValues.passportDoc) {
          await archiveDocument({
            clientId: job.clientId,
            jobId: job._id,
            documentType: "passport",
            sourceType: personType,
            personName: personDetails.name,
            personId: personDetails._id,
            fileUrl: originalValues.passportDoc,
            fileName: "Passport Document",
            archivedBy: req.user._id,
            reason: "replaced",
          });
        }
        const uploadResult = await safeCloudinaryUpload(filePath);
        personDetails.passportDoc = uploadResult.url;
        changedDocuments.push("Passport Document");
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      } else if (fieldname === "cv") {
        if (originalValues.cv) {
          await archiveDocument({
            clientId: job.clientId,
            jobId: job._id,
            documentType: "other_document",
            sourceType: personType,
            personName: personDetails.name,
            personId: personDetails._id,
            fileUrl: originalValues.cv,
            fileName: "CV",
            archivedBy: req.user._id,
            reason: "replaced",
          });
        }
        const uploadResult = await safeCloudinaryUpload(filePath);
        personDetails.cv = uploadResult.url;
        changedDocuments.push("CV");
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
    }

    // Other Documents - handle with position preservation
    if (req.body.otherDocumentsMetadata) {
      try {
        const metadata = JSON.parse(req.body.otherDocumentsMetadata);
        const { existingDocs, totalCount, replacedDocs } = metadata;
        const finalOtherDocs = [];

        // Archive replaced documents
        if (Array.isArray(replacedDocs)) {
          for (const doc of replacedDocs) {
            await archiveDocument({
              clientId: job.clientId,
              jobId: job._id,
              documentType: "other_document",
              sourceType: personType,
              personName: personDetails.name,
              personId: personDetails._id,
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              archivedBy: req.user._id,
              reason: "replaced",
              originalUploadedAt: doc.uploadedAt,
            });
          }
        }

        // Create array with correct size
        for (let i = 0; i < totalCount; i++) {
          finalOtherDocs[i] = null;
        }

        // Place existing documents at their positions
        if (Array.isArray(existingDocs)) {
          existingDocs.forEach(doc => {
            finalOtherDocs[doc.index] = {
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              uploadedAt: doc.uploadedAt,
            };
          });
        }

        // Upload and place new files at their positions
        for (const file of req.files) {
          const match = file.fieldname.match(/^otherDocument_(\d+)$/);
          if (match) {
            const index = parseInt(match[1]);
            const uploadResult = await safeCloudinaryUpload(file.path);
            finalOtherDocs[index] = {
              fileUrl: uploadResult.url,
              fileName: file.originalname,
              uploadedAt: new Date(),
            };
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }
        }

        // Filter out null values and replace the array
        personDetails.otherDocuments = finalOtherDocs.filter(doc => doc !== null);
        changedDocuments.push("Other Documents");
      } catch (err) {
        console.error("Error parsing otherDocumentsMetadata:", err);
      }
    }
  }

  // MANUALLY ADD FIELD HISTORY - Create history entries for changed fields
  const fieldsToTrack = [
    'name', 'nationality', 'qidNo', 'qidExpiry', 'nationalAddress', 
    'nationalAddressExpiry', 'passportNo', 'passportExpiry', 'mobileNo', 
    'email', 'visaCopy', 'qidDoc', 'nationalAddressDoc', 'passportDoc', 'cv'
  ];
  
  // Track changes for each field
  fieldsToTrack.forEach(field => {
    const oldValue = originalValues[field];
    const newValue = personDetails[field];
    
    // Only add history if value changed
    if (oldValue !== newValue && 
        (oldValue !== undefined || newValue !== undefined) && 
        String(oldValue) !== String(newValue)) {
        
      console.log(`Field '${field}' changed from '${oldValue}' to '${newValue}'`);
      
      personDetails.fieldHistory.push({
        field,
        value: newValue,
        previousValue: oldValue,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
    }
  });

  console.log(`Field history now has ${personDetails.fieldHistory.length} entries`);

  // Save the updated document with history entries
  const updatedPerson = await personDetails.save();

  // Add a timeline entry for the job
  const personTypeName = personType.charAt(0).toUpperCase() + personType.slice(1);
  const timelineDescription = changedDocuments.length > 0
    ? `${personTypeName} document${changedDocuments.length > 1 ? 's' : ''} updated: ${changedDocuments.join(", ")}`
    : `${personTypeName} details updated`;
  job.timeline.push({
    status: job.status,
    description: timelineDescription,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  // Check if we need to sync this change across all jobs for this client
  // Convert string 'true' to boolean true
  const shouldSync = syncAcrossJobs === true || syncAcrossJobs === 'true';
  
  let syncResult = null;
  if (shouldSync) {
    console.log(`Synchronizing ${personType} details across jobs for ${job.gmail}`);
    const { synchronizePersonDetails } = require("../utils/clientUtils");
    syncResult = await synchronizePersonDetails(
      job.gmail,
      personType,
      personDetails._id.toString()
    );
    console.log("Sync result:", syncResult);
  }

  // Only notify about person details update
  try {
    await notificationService.createJobNotification(
      {
        title: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } Details Updated`,
        description: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } details updated for ${job.clientName}'s ${job.serviceType} job.${
          syncResult?.success
            ? " Changes synchronized across all jobs for this client."
            : ""
        }`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json({
    ...updatedPerson.toObject(),
    syncResult: syncResult,
  });
});


// Delete person details
const deletePersonDetails = asyncHandler(async (req, res) => {
  const { jobId, personType, personId } = req.params;

  // Validate personType
  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    res.status(400);
    throw new Error("Invalid person type");
  }

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is authorized
  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  // Find and delete person details
  const personDetails = await PersonDetails.findOneAndDelete({
    _id: personId,
    jobId,
    personType,
  });

  if (!personDetails) {
    res.status(404);
    throw new Error("Person details not found");
  }

  // Add a timeline entry for the job
  job.timeline.push({
    status: job.status,
    description: `${
      personType.charAt(0).toUpperCase() + personType.slice(1)
    } details removed`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  // SYNC DELETE: Remove the same person from ALL other jobs for the same client
  let syncDeleteResult = null;
  const deletedPersonName = personDetails.name;

  if (deletedPersonName) {
    try {
      console.log(`[SYNC DELETE] Removing ${personType} "${deletedPersonName}" from all other jobs for client ${job.gmail}`);

      // Find all other jobs for this client
      const Client = require("../models/Client");
      const client = await Client.findOne({ gmail: job.gmail });

      if (client) {
        const otherJobs = await Job.find({
          clientId: client._id,
          _id: { $ne: jobId } // Exclude current job
        });

        console.log(`[SYNC DELETE] Found ${otherJobs.length} other jobs for this client`);

        let deletedCount = 0;
        for (const otherJob of otherJobs) {
          // Find and delete the same person (by name) in other jobs
          const deletedInOtherJob = await PersonDetails.findOneAndDelete({
            jobId: otherJob._id,
            personType,
            name: { $regex: new RegExp(`^${deletedPersonName.trim()}$`, 'i') }
          });

          if (deletedInOtherJob) {
            deletedCount++;

            // Add timeline entry for the other job
            otherJob.timeline.push({
              status: otherJob.status,
              description: `${personType.charAt(0).toUpperCase() + personType.slice(1)} "${deletedPersonName}" auto-removed (synced from job ${job.jobNumber})`,
              timestamp: new Date(),
              updatedBy: req.user._id,
            });
            await otherJob.save();

            console.log(`[SYNC DELETE] Removed ${personType} "${deletedPersonName}" from job ${otherJob.jobNumber}`);
          }
        }

        syncDeleteResult = { success: true, deletedCount };
        console.log(`[SYNC DELETE] Removed from ${deletedCount} other jobs`);
      }
    } catch (syncError) {
      console.error("[SYNC DELETE] Error syncing delete to other jobs:", syncError);
      syncDeleteResult = { success: false, error: syncError.message };
    }
  }

  // Create notification for person details removal
  try {
    await notificationService.createJobNotification(
      {
        title: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } Details Removed`,
        description: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } "${deletedPersonName || 'entry'}" removed from ${job.clientName}'s ${job.serviceType} job.${
          syncDeleteResult?.deletedCount > 0 ? ` Also removed from ${syncDeleteResult.deletedCount} other jobs.` : ''
        }`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json({
    message: "Person details removed successfully",
    syncDeleteResult
  });
});

// Get KYC documents
const getKycDocuments = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is authorized
  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to view this job");
  }

  // Get KYC documents
  let kycDocuments = await KycDocument.findOne({ jobId });

  if (!kycDocuments) {
    kycDocuments = new KycDocument({
      jobId,
      activeStatus: "yes",
      documents: [],
      updatedBy: req.user._id,
    });
    await kycDocuments.save();
  }

  res.status(200).json(kycDocuments);
});

// Update KYC documents
const updateKycDocuments = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { activeStatus, documents } = req.body;

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if user is authorized
  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  // Find or create KYC documents
  let kycDocuments = await KycDocument.findOne({ jobId });

  if (!kycDocuments) {
    kycDocuments = new KycDocument({
      jobId,
      activeStatus: activeStatus || "yes",
      documents: [],
      updatedBy: req.user._id,
    });
  } else {
    kycDocuments.activeStatus = activeStatus || kycDocuments.activeStatus;
    kycDocuments.updatedBy = req.user._id;
  }

  // Handle document uploads
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(async (file, index) => {
      const uploadResult = await safeCloudinaryUpload(file.path);

      if (uploadResult.success) {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }

      // Get description and date from request body if available
      const description = req.body[`description_${index}`] || "";
      const date = req.body[`date_${index}`] || new Date();

      return {
        file: uploadResult.url,
        description,
        date,
      };
    });

    const uploadedDocuments = await Promise.all(uploadPromises);

    // If documents array in request body, merge with uploads
    if (documents && Array.isArray(documents)) {
      kycDocuments.documents = [
        ...kycDocuments.documents,
        ...uploadedDocuments,
      ];
    } else {
      kycDocuments.documents = [
        ...kycDocuments.documents,
        ...uploadedDocuments,
      ];
    }
  } else if (documents && Array.isArray(documents)) {
    // If only document metadata in request body (no files)
    kycDocuments.documents = documents;
  }

  const updatedKycDocuments = await kycDocuments.save();

  // Add a timeline entry for the job
  const uploadCount = req.files ? req.files.length : 0;
  const timelineDescription = uploadCount > 0
    ? `KYC document${uploadCount > 1 ? 's' : ''} uploaded (${uploadCount} file${uploadCount > 1 ? 's' : ''})`
    : "KYC documents updated";
  job.timeline.push({
    status: job.status,
    description: timelineDescription,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  // Create notification for KYC documents update
  try {
    await notificationService.createJobNotification(
      {
        title: "KYC Documents Updated",
        description: `KYC documents updated for ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedKycDocuments);
});

const replaceKycDocument = asyncHandler(async (req, res) => {
  const { jobId, documentIndex } = req.params;
  const { documentName, notes } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  let kycDocuments = await KycDocument.findOne({ jobId });

  if (!kycDocuments) {
    res.status(404);
    throw new Error("KYC documents not found");
  }

  const docIndex = parseInt(documentIndex);
  if (isNaN(docIndex) || docIndex < 0 || docIndex >= kycDocuments.documents.length) {
    res.status(400);
    throw new Error("Invalid document index");
  }

  const oldDocument = kycDocuments.documents[docIndex];

  if (oldDocument && oldDocument.file) {
    try {
      await Archive.create({
        clientId: job.clientId,
        jobId: job._id,
        documentType: "kyc_document",
        sourceType: "kyc",
        fileUrl: oldDocument.file,
        fileName: oldDocument.description || "KYC Document",
        title: oldDocument.description || "General KYC Document",
        description: `Archived general KYC document - replaced`,
        archivedBy: req.user._id,
        reason: "replaced",
        originalUploadedAt: oldDocument.date,
        metadata: {
          originalDescription: oldDocument.description
        }
      });
      console.log(`Archived old KYC document for job ${jobId}`);
    } catch (archiveError) {
      console.error("Error archiving KYC document:", archiveError);
    }
  }

  if (req.file) {
    const uploadResult = await safeCloudinaryUpload(req.file.path);

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    const description = notes ? `${documentName} - ${notes}` : documentName;

    kycDocuments.documents[docIndex] = {
      file: uploadResult.url,
      description: description || oldDocument.description,
      date: new Date(),
    };
  } else if (documentName) {
    const description = notes ? `${documentName} - ${notes}` : documentName;
    kycDocuments.documents[docIndex].description = description;
  }

  kycDocuments.updatedBy = req.user._id;
  await kycDocuments.save();

  job.timeline.push({
    status: job.status,
    description: "KYC document replaced",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  res.status(200).json({
    success: true,
    message: "KYC document replaced successfully",
    documents: kycDocuments.documents,
  });
});

// Updated uploadEngagementLetter function for operationController.js
const uploadEngagementLetter = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    console.log(`Starting engagement letter upload for job ${jobId}`);
    
    // Check if job exists and if user has permission to access it
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job not found: ${jobId}`);
      res.status(404);
      throw new Error("Job not found");
    }

    // Get the client's Gmail address
    const gmail = job.gmail;

    // Check if user is authorized
    const isAdmin = req.user.role?.name === "admin";
    const hasCompliancePermission =
      req.user.role?.permissions?.complianceManagement;
    const hasOperationPermission =
      req.user.role?.permissions?.operationManagement;
    const isAssignedPerson =
      job.assignedPerson?.toString() === req.user._id.toString();

    if (
      !isAdmin &&
      !hasCompliancePermission &&
      !hasOperationPermission &&
      !isAssignedPerson
    ) {
      console.log(`User ${req.user._id} not authorized to update job ${jobId}`);
      res.status(403);
      throw new Error("You are not authorized to update this job");
    }

    // Check if file was received
    if (!req.file) {
      console.log(`No file uploaded for job ${jobId}`);
      res.status(400);
      throw new Error("Engagement letter file is required");
    }
    
    console.log(`File received: ${req.file.path}`);

    // Find or create company details for current job
    let companyDetails = await CompanyDetails.findOne({ jobId });
    if (!companyDetails) {
      console.log(`Creating new company details for job ${jobId}`);
      companyDetails = new CompanyDetails({
        jobId,
        companyName: job.clientName || "",
        updatedBy: req.user._id,
        engagementLetters: [] // Initialize as empty array
      });
    } else if (!Array.isArray(companyDetails.engagementLetters)) {
      // Ensure engagementLetters is an array
      companyDetails.engagementLetters = [];
    }

    // Upload engagement letter to Cloudinary
    const uploadResult = await safeCloudinaryUpload(
      req.file.path,
      { folder: `clients/${job.gmail}/engagement_letters`, resource_type: 'auto' }
    );
    
    if (!uploadResult.success) {
      console.warn(`Using fallback URL due to Cloudinary upload failure: ${uploadResult.url}`);
    }
    
    // Create a properly formatted engagement letter object
    const engagementLetterObject = {
      fileUrl: uploadResult.url,
      fileName: req.file.originalname || 'Engagement Letter',
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      description: req.body.description || `Uploaded on ${new Date().toLocaleDateString()}`
    };
    
    // Add the new engagement letter to the array
    companyDetails.engagementLetters.push(engagementLetterObject);
    companyDetails.updatedBy = req.user._id;

    if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
    companyDetails.documentHistory.push({
      action: "upload",
      documentType: "Engagement Letter",
      fileName: req.file.originalname || 'Engagement Letter',
      fileUrl: uploadResult.url,
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    await companyDetails.save();
    
    console.log(`Company details updated with engagement letter: ${uploadResult.url}`);

    // Clean up temporary file after successful upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error(`Error deleting temp file ${req.file.path}:`, err);
    });

    // Add a timeline entry for the job
    job.timeline.push({
      status: job.status,
      description: "Engagement letter uploaded",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Now update all other jobs for the same client to share this engagement letter
    try {
      // Find the client by Gmail
      const client = await Client.findOne({ gmail });
      if (client) {
        // Find all jobs for this client (except the current one)
        const otherClientJobs = await Job.find({ 
          clientId: client._id,
          _id: { $ne: jobId }
        });
        
        if (otherClientJobs && otherClientJobs.length > 0) {
          console.log(`Found ${otherClientJobs.length} other jobs for client ${gmail}`);
          
          // Update company details for all other jobs
          for (const otherJob of otherClientJobs) {
            let otherCompanyDetails = await CompanyDetails.findOne({ jobId: otherJob._id });
            
            if (otherCompanyDetails) {
              // Update existing company details with proper array format
              if (!Array.isArray(otherCompanyDetails.engagementLetters)) {
                otherCompanyDetails.engagementLetters = [];
              }
              
              // Add the same engagement letter to other jobs
              otherCompanyDetails.engagementLetters.push(engagementLetterObject);
              otherCompanyDetails.updatedBy = req.user._id;
              await otherCompanyDetails.save();
              
              // Add timeline entry for the other job
              otherJob.timeline.push({
                status: otherJob.status,
                description: "Engagement letter updated from another job",
                timestamp: new Date(),
                updatedBy: req.user._id,
              });
              await otherJob.save();
              
              console.log(`Updated engagement letter for job ${otherJob._id}`);
            } else {
              // Create new company details for the other job
              const newCompanyDetails = new CompanyDetails({
                jobId: otherJob._id,
                companyName: otherJob.clientName || "",
                engagementLetters: [engagementLetterObject],
                updatedBy: req.user._id,
              });
              await newCompanyDetails.save();
              
              // Add timeline entry for the other job
              otherJob.timeline.push({
                status: otherJob.status,
                description: "Engagement letter added from another job",
                timestamp: new Date(),
                updatedBy: req.user._id,
              });
              await otherJob.save();
              
              console.log(`Created company details with engagement letter for job ${otherJob._id}`);
            }
          }
        }
      }
    } catch (updateError) {
      // Log error but don't fail the request - the primary job was updated successfully
      console.error(`Error updating engagement letters for other jobs: ${updateError.message}`);
    }

    // Create notification for engagement letter upload
    try {
      await notificationService.createJobNotification(
        {
          title: "Engagement Letter Uploaded",
          description: `Engagement letter uploaded for ${job.clientName}'s ${job.serviceType} job.`,
          type: "job",
          relatedTo: { model: "Job", id: job._id },
        },
        job,
        req.user._id
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    res.status(200).json({
      message: "Engagement letter uploaded successfully",
      engagementLetter: engagementLetterObject
    });
  } catch (error) {
    console.error(`Error in uploadEngagementLetter: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to upload engagement letter",
        error: error.message,
      });
    }
  }
});

// An additional endpoint to get all engagement letters
const getEngagementLetters = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // Check if job exists and if user has permission
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Get company details
  const companyDetails = await CompanyDetails.findOne({ jobId });
  if (!companyDetails) {
    return res.status(200).json([]);
  }

  // Handle both array and string formats for backward compatibility
  let engagementLetters = [];
  if (Array.isArray(companyDetails.engagementLetters)) {
    engagementLetters = companyDetails.engagementLetters;
  } else if (companyDetails.engagementLetters) {
    // Convert string to object format
    engagementLetters = [{
      fileUrl: companyDetails.engagementLetters,
      fileName: 'Engagement Letter',
      uploadedAt: companyDetails.updatedAt,
      uploadedBy: companyDetails.updatedBy
    }];
  }

  res.status(200).json(engagementLetters);
});


// This function should be in operationController.js
const completeOperation = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  
  // Find the job
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  
  // Check if job is in approved status
  if (job.status !== "approved") {
    res.status(400);
    throw new Error("Only approved jobs can be marked as complete");
  }
  
  // Verify user permissions
  const isAdmin = req.user.role?.name === "admin";
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();
    
  if (!isAdmin && !hasOperationPermission && !isAssignedPerson) {
    res.status(403);
    throw new Error("You are not authorized to complete this job");
  }
  
  // Check for required documents
  const companyDetails = await CompanyDetails.findOne({ jobId });
  if (!companyDetails || !companyDetails.engagementLetters) {
    res.status(400);
    throw new Error(
      "An engagement letter must be uploaded before marking operation as complete"
    );
  }
  
  // Update job status
  job.status = "om_completed";
  job.timeline.push({
    status: "om_completed",
    description: "Operation completed",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  
  const updatedJob = await job.save();

  // Notify job parties (creator, assigned person, selected service users)
  await notificationService.createJobNotification(
    {
      title: "Operation Completed",
      description: `Operation for ${job.clientName}'s ${job.serviceType} job has been completed by ${req.user.name}.`,
      type: "job",
      relatedTo: { model: "Job", id: job._id },
    },
    job,
    req.user._id
  );

  // Notify KYC management (LMRO) team - workflow notification
  await notificationService.createNotification(
    {
      title: "Operation Completed - Ready for KYC",
      description: `The operation for job ${job._id} (${job.clientName}'s ${job.serviceType}) has been completed. Please initialize the KYC process.`,
      type: "job",
      relatedTo: { model: "Job", id: job._id },
    },
    { "role.permissions.kycManagement.lmro": true }
  );

  // Special processing for KYC jobs
  const isKycJob = job.serviceType &&
                  (job.serviceType.toLowerCase().includes('kyc') ||
                   job.type === 'kyc');

  if (isKycJob) {
    // Process KYC-specific notifications using the dedicated service
    try {
      await kycService.processCompletedKycJob(updatedJob, req.user);
    } catch (kycError) {
      console.error(
        `Error in KYC notification processing: ${kycError.message}`
      );
    }

    // If KYC documents are missing, notify job parties
    const kycDocuments = await KycDocument.findOne({ jobId: job._id });
    if (!kycDocuments || kycDocuments.documents.length === 0) {
      await notificationService.createJobNotification(
        {
          title: "KYC Documents Missing",
          description: `Attention: KYC job #${job._id} for ${job.clientName} has been completed, but no KYC documents have been uploaded. Please follow up.`,
          type: "job",
          subType: "kyc",
          relatedTo: { model: "Job", id: job._id },
        },
        job,
        req.user._id
      );
    }

    console.log(`KYC notification sent to management team for job #${job._id}`);
  }

  res.status(200).json(updatedJob);
});


// Fix for createPreApprovedJob function in operationController.js

// Fixed createPreApprovedJob function in operationController.js

// FIXED createPreApprovedJob function with enhanced debugging
// Replace the existing function in operationController.js

const createPreApprovedJob = asyncHandler(async (req, res) => {
  try {
    console.log("🚀 === STARTING PRE-APPROVED JOB CREATION ===");
    console.log("📦 Raw request body keys:", Object.keys(req.body));
    console.log("📁 Files received:", Object.keys(req.files || {}));

    const {
      jobNumber,
      serviceType,
      assignedPerson,
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
      crNo,
      contactNumber,
      // Company details
      companyDetails,
      // Person details
      directors, // Array of director details
      shareholders, // Array of shareholder details
      secretaries, // Array of secretary details
      sefs, // Array of SEF details
      // KYC documents info
      kycDocumentInfo,
      // BRA documents info
      braDocumentInfo,
    } = req.body;

    // ENHANCED DEBUGGING for directors
    console.log("👥 === DIRECTOR DATA DEBUGGING ===");
    console.log("Directors raw:", directors);
    console.log("Directors type:", typeof directors);
    console.log("Directors is array:", Array.isArray(directors));
    if (directors) {
      console.log("Directors length:", directors.length);
      console.log("Directors content:", JSON.stringify(directors, null, 2));
    }
    console.log("===============================");

    // Validate required fields (including job number)
    if (
      !jobNumber ||
      !serviceType ||
      !assignedPerson ||
      !jobDetails ||
      !clientName ||
      !gmail ||
      !startingPoint
    ) {
      return res.status(400).json({ message: "Missing required job fields" });
    }

    // Validate job number format
    if (!/^[A-Za-z0-9-]+$/.test(jobNumber)) {
      return res.status(400).json({
        message: "Job number must contain only letters, numbers, and hyphens",
      });
    }

    // Check if job number already exists
    const existingJob = await Job.findOne({ jobNumber });
    if (existingJob) {
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

    // Start a MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log("✅ Creating pre-approved job for:", clientName, "with job number:", jobNumber);

      // 1. Check if client exists, create if not
      let client = await Client.findOne({ gmail });
      if (!client) {
        const nextClientCode = await Client.getNextClientCode();
        client = new Client({
          name: clientName,
          gmail,
          startingPoint,
          clientCode: nextClientCode,
          crNo: crNo || '',
          contactNumber: contactNumber || ''
        });
        await client.save({ session });
        console.log("✅ Created new client:", client._id, "with code:", nextClientCode);
      } else {
        console.log("ℹ️ Using existing client:", client._id);
        // Update existing client with crNo and contactNumber if provided
        if (crNo !== undefined || contactNumber !== undefined) {
          const updateFields = {};
          if (crNo !== undefined) updateFields.crNo = crNo;
          if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
          await Client.findByIdAndUpdate(client._id, updateFields, { session });
        }
      }

      // 2. Upload job documents (now optional) OR use existing document URLs
      let documentPassportUrl = { url: null };
      let documentIDUrl = { url: null };

      // Handle passport document - new file OR existing URL
      if (req.files["documentPassport"] && req.files["documentPassport"][0]) {
        documentPassportUrl = await safeCloudinaryUpload(
          req.files["documentPassport"][0].path,
          { folder: `clients/${gmail}/passport` }
        );
        fs.unlink(req.files["documentPassport"][0].path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
        console.log("📄 Uploaded new passport document:", documentPassportUrl.url);
      } else if (req.body.documentPassportUrl) {
        documentPassportUrl = { url: req.body.documentPassportUrl };
        console.log("📄 Using existing passport document URL:", documentPassportUrl.url);
      }

      // Handle ID document - new file OR existing URL
      if (req.files["documentID"] && req.files["documentID"][0]) {
        documentIDUrl = await safeCloudinaryUpload(
          req.files["documentID"][0].path,
          { folder: `clients/${gmail}/id` }
        );
        fs.unlink(req.files["documentID"][0].path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
        console.log("📄 Uploaded new ID document:", documentIDUrl.url);
      } else if (req.body.documentIDUrl) {
        documentIDUrl = { url: req.body.documentIDUrl };
        console.log("📄 Using existing ID document URL:", documentIDUrl.url);
      }

      // Handle other documents - new files OR existing URLs
      let otherDocumentsUrls = [];
      
      if (req.files["otherDocuments"] && req.files["otherDocuments"].length > 0) {
        otherDocumentsUrls = await Promise.all(
          req.files["otherDocuments"].map((file) =>
            safeCloudinaryUpload(file.path, {
              folder: `clients/${gmail}/other_documents`,
            })
          )
        );
        console.log("📄 Uploaded new other documents:", otherDocumentsUrls.length);
        
        // Clean up temporary files for other documents
        req.files["otherDocuments"].forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        });
      } else if (req.body.otherDocumentsUrls) {
        try {
          const existingUrls = JSON.parse(req.body.otherDocumentsUrls);
          otherDocumentsUrls = existingUrls.map(url => ({ url }));
          console.log("📄 Using existing other document URLs:", existingUrls.length);
        } catch (e) {
          console.error("Error parsing otherDocumentsUrls:", e);
          otherDocumentsUrls = [];
        }
      }

      // 3. Create job with fully completed status (including job number)
      const currentTime = new Date();
      const job = new Job({
        jobNumber,
        clientId: client._id,
        serviceType,
        documentPassport: documentPassportUrl.url,
        documentID: documentIDUrl.url,
        otherDocuments: otherDocumentsUrls.map((result) => result.url),
        assignedPerson,
        jobDetails,
        specialDescription,
        clientName,
        gmail,
        startingPoint,
        status: "fully_completed_bra",
        createdBy: req.user._id,
        // Create a complete timeline with timestamps at 1-second intervals
        timeline: [
          {
            status: "created",
            description: `Job created by Operation Management with number: ${jobNumber}`,
            timestamp: new Date(currentTime.getTime()),
            updatedBy: req.user._id,
          },
          {
            status: "screening_done",
            description: "Screening auto-approved by Operation Management",
            timestamp: new Date(currentTime.getTime() + 1000),
            updatedBy: req.user._id,
          },
          {
            status: "approved",
            description: "Job auto-approved by Operation Management",
            timestamp: new Date(currentTime.getTime() + 2000),
            updatedBy: req.user._id,
          },
          {
            status: "om_completed",
            description: "Operation Management completed",
            timestamp: new Date(currentTime.getTime() + 3000),
            updatedBy: req.user._id,
          },
          {
            status: "kyc_pending",
            description: "KYC process initialized",
            timestamp: new Date(currentTime.getTime() + 4000),
            updatedBy: req.user._id,
          },
          {
            status: "kyc_mlro_approved",
            description: "KYC auto-approved by MLRO",
            timestamp: new Date(currentTime.getTime() + 5000),
            updatedBy: req.user._id,
          },
          {
            status: "kyc_dmlro_approved",
            description: "KYC auto-approved by DMLRO",
            timestamp: new Date(currentTime.getTime() + 6000),
            updatedBy: req.user._id,
          },
          {
            status: "completed",
            description: "KYC process auto-completed",
            timestamp: new Date(currentTime.getTime() + 7000),
            updatedBy: req.user._id,
          },
          {
            status: "bra_pending",
            description: "BRA process initialized",
            timestamp: new Date(currentTime.getTime() + 8000),
            updatedBy: req.user._id,
          },
          {
            status: "bra_mlro_approved",
            description: "BRA auto-approved by MLRO",
            timestamp: new Date(currentTime.getTime() + 9000),
            updatedBy: req.user._id,
          },
          {
            status: "bra_dmlro_approved",
            description: "BRA auto-approved by DMLRO",
            timestamp: new Date(currentTime.getTime() + 10000),
            updatedBy: req.user._id,
          },
          {
            status: "fully_completed_bra",
            description: "BRA process auto-completed",
            timestamp: new Date(currentTime.getTime() + 11000),
            updatedBy: req.user._id,
          },
        ],
      });

      const savedJob = await job.save({ session });
      console.log("✅ Created job:", savedJob._id, "with job number:", savedJob.jobNumber);

      // 4. Create company details if provided
      if (companyDetails) {
        const parsedCompanyDetails = typeof companyDetails === 'string' 
          ? JSON.parse(companyDetails) 
          : companyDetails;

        const newCompanyDetails = new CompanyDetails({
          jobId: savedJob._id,
          companyName: parsedCompanyDetails.companyName || clientName,
          qfcNo: parsedCompanyDetails.qfcNo || "",
          registeredAddress: parsedCompanyDetails.registeredAddress || "",
          incorporationDate: parsedCompanyDetails.incorporationDate || null,
          serviceType: parsedCompanyDetails.serviceType || serviceType,
          mainPurpose: parsedCompanyDetails.mainPurpose || "",
          expiryDate: parsedCompanyDetails.expiryDate || null,
          kycActiveStatus: parsedCompanyDetails.kycActiveStatus || "yes",
          updatedBy: req.user._id,
        });

        // Handle company document uploads OR existing URLs
        
        // Engagement Letters - new file OR existing URLs
        if (req.files && req.files["engagementLetters"]) {
          const uploadResult = await safeCloudinaryUpload(
            req.files["engagementLetters"][0].path,
            { folder: `clients/${gmail}/company/engagement_letters` }
          );
          
          newCompanyDetails.engagementLetters = [{
            fileUrl: uploadResult.url,
            fileName: req.files["engagementLetters"][0].originalname || 'Engagement Letter',
            uploadedAt: new Date(),
            uploadedBy: req.user._id,
            description: `Uploaded during job creation on ${new Date().toLocaleDateString()}`
          }];
          
          fs.unlink(req.files["engagementLetters"][0].path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
          console.log("📄 Uploaded new engagement letters:", newCompanyDetails.engagementLetters.length);
        } else if (req.body.engagementLettersUrls) {
          try {
            const existingLetters = JSON.parse(req.body.engagementLettersUrls);
            // Transform URL format from {url: "..."} to {fileUrl: "..."}
            newCompanyDetails.engagementLetters = existingLetters.map(letter => ({
              fileUrl: letter.url || letter.fileUrl,
              fileName: letter.fileName || 'engagement_letter.pdf',
              uploadedAt: letter.uploadedAt || new Date(),
              description: letter.description || 'Engagement letter'
            }));
            console.log("📄 Using existing engagement letters URLs:", existingLetters.length);
          } catch (e) {
            console.error("Error parsing engagementLettersUrls:", e);
            newCompanyDetails.engagementLetters = [];
          }
        }

        // Company Computer Card - new file OR existing URL
        if (req.files && req.files["companyComputerCard"]) {
          const uploadResult = await safeCloudinaryUpload(
            req.files["companyComputerCard"][0].path,
            { folder: `clients/${gmail}/company/computer_card` }
          );
          newCompanyDetails.companyComputerCard = uploadResult.url;
          fs.unlink(req.files["companyComputerCard"][0].path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
          console.log("📄 Uploaded new company computer card:", newCompanyDetails.companyComputerCard);
        } else if (req.body.companyComputerCardUrl) {
          newCompanyDetails.companyComputerCard = req.body.companyComputerCardUrl;
          console.log("📄 Using existing company computer card URL:", newCompanyDetails.companyComputerCard);
        }

        // Tax Card - new file OR existing URL
        if (req.files && req.files["taxCard"]) {
          const uploadResult = await safeCloudinaryUpload(
            req.files["taxCard"][0].path,
            { folder: `clients/${gmail}/company/tax_card` }
          );
          newCompanyDetails.taxCard = uploadResult.url;
          fs.unlink(req.files["taxCard"][0].path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
          console.log("📄 Uploaded new tax card:", newCompanyDetails.taxCard);
        } else if (req.body.taxCardUrl) {
          newCompanyDetails.taxCard = req.body.taxCardUrl;
          console.log("📄 Using existing tax card URL:", newCompanyDetails.taxCard);
        }

        // CR Extract - new files OR existing URLs
        if (req.files && req.files["crExtract"]) {
          newCompanyDetails.crExtract = [];

          for (const file of req.files["crExtract"]) {
            const uploadResult = await safeCloudinaryUpload(file.path, {
              folder: `clients/${gmail}/company/cr_extract`,
            });

            newCompanyDetails.crExtract.push({
              fileUrl: uploadResult.url,
              fileName: file.originalname || "CR Extract Document",
              uploadedAt: new Date(),
              uploadedBy: req.user._id,
              description: `Uploaded during job creation on ${new Date().toLocaleDateString()}`,
            });

            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }
          console.log("📄 Uploaded new CR Extract files:", newCompanyDetails.crExtract.length);
        } else if (req.body.crExtractUrls) {
          try {
            const existingCrExtract = JSON.parse(req.body.crExtractUrls);
            // Transform URL format from {url: "..."} to {fileUrl: "..."}
            newCompanyDetails.crExtract = existingCrExtract.map(extract => ({
              fileUrl: extract.url || extract.fileUrl,
              fileName: extract.fileName || 'cr_extract.pdf',
              uploadedAt: extract.uploadedAt || new Date(),
              description: extract.description || 'CR Extract document'
            }));
            console.log("📄 Using existing CR Extract URLs:", existingCrExtract.length);
          } catch (e) {
            console.error("Error parsing crExtractUrls:", e);
            newCompanyDetails.crExtract = [];
          }
        }

        // Scope of License - new file OR existing URL
        if (req.files && req.files["scopeOfLicense"]) {
          const uploadResult = await safeCloudinaryUpload(
            req.files["scopeOfLicense"][0].path,
            { folder: `clients/${gmail}/company/scope_of_license` }
          );
          newCompanyDetails.scopeOfLicense = uploadResult.url;
          fs.unlink(req.files["scopeOfLicense"][0].path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
          console.log("📄 Uploaded new scope of license:", newCompanyDetails.scopeOfLicense);
        } else if (req.body.scopeOfLicenseUrl) {
          newCompanyDetails.scopeOfLicense = req.body.scopeOfLicenseUrl;
          console.log("📄 Using existing scope of license URL:", newCompanyDetails.scopeOfLicense);
        }

        // Article of Associate - new file OR existing URL
        if (req.files && req.files["articleOfAssociate"]) {
          const uploadResult = await safeCloudinaryUpload(
            req.files["articleOfAssociate"][0].path,
            { folder: `clients/${gmail}/company/article_of_associate` }
          );
          newCompanyDetails.articleOfAssociate = uploadResult.url;
          fs.unlink(req.files["articleOfAssociate"][0].path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
          console.log("📄 Uploaded new article of associate:", newCompanyDetails.articleOfAssociate);
        } else if (req.body.articleOfAssociateUrl) {
          newCompanyDetails.articleOfAssociate = req.body.articleOfAssociateUrl;
          console.log("📄 Using existing article of associate URL:", newCompanyDetails.articleOfAssociate);
        }

        // Certificate of Incorporate - new file OR existing URL
        if (req.files && req.files["certificateOfIncorporate"]) {
          const uploadResult = await safeCloudinaryUpload(
            req.files["certificateOfIncorporate"][0].path,
            { folder: `clients/${gmail}/company/certificate_of_incorporate` }
          );
          newCompanyDetails.certificateOfIncorporate = uploadResult.url;
          fs.unlink(req.files["certificateOfIncorporate"][0].path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
          console.log("📄 Uploaded new certificate of incorporate:", newCompanyDetails.certificateOfIncorporate);
        } else if (req.body.certificateOfIncorporateUrl) {
          newCompanyDetails.certificateOfIncorporate = req.body.certificateOfIncorporateUrl;
          console.log("📄 Using existing certificate of incorporate URL:", newCompanyDetails.certificateOfIncorporate);
        }

        // Company Memo - new files OR existing URLs
        if (req.files && req.files["companyMemo"]) {
          newCompanyDetails.companyMemo = [];

          for (const file of req.files["companyMemo"]) {
            const uploadResult = await safeCloudinaryUpload(file.path, {
              folder: `clients/${gmail}/company/company_memo`,
            });

            newCompanyDetails.companyMemo.push({
              fileUrl: uploadResult.url,
              fileName: file.originalname || "Company Memo Document",
              uploadedAt: new Date(),
              uploadedBy: req.user._id,
              description: `Uploaded during job creation on ${new Date().toLocaleDateString()}`,
            });

            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }
          console.log("📄 Uploaded new company memo files:", newCompanyDetails.companyMemo.length);
        } else if (req.body.companyMemoUrls) {
          try {
            const existingMemos = JSON.parse(req.body.companyMemoUrls);
            // Transform URL format from {url: "..."} to {fileUrl: "..."}
            newCompanyDetails.companyMemo = existingMemos.map(memo => ({
              fileUrl: memo.url || memo.fileUrl,
              fileName: memo.fileName || 'company_memo.pdf',
              uploadedAt: memo.uploadedAt || new Date(),
              description: memo.description || 'Company memo document'
            }));
            console.log("📄 Using existing company memo URLs:", existingMemos.length);
          } catch (e) {
            console.error("Error parsing companyMemoUrls:", e);
            newCompanyDetails.companyMemo = [];
          }
        }

        // Set expiry dates if provided
        if (parsedCompanyDetails.companyComputerCardExpiry) {
          newCompanyDetails.companyComputerCardExpiry =
            parsedCompanyDetails.companyComputerCardExpiry;
        }
        if (parsedCompanyDetails.taxCardExpiry) {
          newCompanyDetails.taxCardExpiry = parsedCompanyDetails.taxCardExpiry;
        }
        if (parsedCompanyDetails.crExtractExpiry) {
          newCompanyDetails.crExtractExpiry = parsedCompanyDetails.crExtractExpiry;
        }
        if (parsedCompanyDetails.scopeOfLicenseExpiry) {
          newCompanyDetails.scopeOfLicenseExpiry =
            parsedCompanyDetails.scopeOfLicenseExpiry;
        }

        await newCompanyDetails.save({ session });
        console.log("✅ Created company details for job:", savedJob._id);
      }

      // 5. FIXED: Process person details (directors, shareholders, etc.)
      console.log("👥 === PROCESSING DIRECTORS ===");
      
      // ENHANCED debugging and processing for directors
      if (directors) {
        console.log("📋 Directors data received");
        console.log("Raw directors:", directors);
        console.log("Type:", typeof directors);
        
        let parsedDirectors;
        try {
          // Handle both string and array formats
          if (typeof directors === 'string') {
            console.log("🔄 Parsing directors from string");
            parsedDirectors = JSON.parse(directors);
          } else if (Array.isArray(directors)) {
            console.log("✅ Directors already in array format");
            parsedDirectors = directors;
          } else {
            console.log("❌ Directors in unexpected format");
            parsedDirectors = [];
          }
          
          console.log("📊 Parsed directors:", parsedDirectors);
          console.log("📊 Directors count:", parsedDirectors.length);
          
          if (Array.isArray(parsedDirectors) && parsedDirectors.length > 0) {
            console.log(`🚀 Processing ${parsedDirectors.length} directors...`);
            
            for (let index = 0; index < parsedDirectors.length; index++) {
              const director = parsedDirectors[index];
              console.log(`\n👤 Processing Director ${index + 1}:`);
              console.log(`   Name: ${director.name || 'MISSING NAME'}`);
              console.log(`   Email: ${director.email || 'NO EMAIL'}`);
              console.log(`   Nationality: ${director.nationality || 'NO NATIONALITY'}`);
              
              try {
                // ENHANCED: More detailed validation
                if (!director || !director.name || director.name.trim() === '') {
                  console.log(`⚠️  Skipping Director ${index + 1} - Missing or empty name`);
                  continue;
                }
                
                console.log(`✅ Creating director ${index + 1}: ${director.name}`);
                
                const createdDirector = await createPersonDetails(
                  savedJob._id,
                  "director",
                  director,
                  req.user._id,
                  req.files,
                  gmail,
                  session,
                  index,
                  req
                );
                
                if (createdDirector) {
                  console.log(`✅ Successfully created director ${index + 1}: ${director.name} (ID: ${createdDirector._id})`);
                } else {
                  console.log(`⚠️  Director ${index + 1} creation returned null`);
                }
              } catch (error) {
                console.error(`❌ Error creating director ${index + 1}:`, error);
                // Don't throw here, continue with other directors
                // throw error; // Comment this out to continue processing
              }
            }
            
            console.log(`✅ Completed processing ${parsedDirectors.length} director records`);
          } else {
            console.log("⚠️  No valid directors to process");
          }
        } catch (parseError) {
          console.error("❌ Error parsing directors data:", parseError);
          console.log("Raw directors data that failed to parse:", directors);
        }
      } else {
        console.log("⚠️  No directors data provided");
      }
      
      console.log("=== DIRECTORS PROCESSING COMPLETE ===\n");

      // Process shareholders (similar enhanced debugging)
      console.log("👥 === PROCESSING SHAREHOLDERS ===");
      if (shareholders) {
        console.log("📋 Shareholders data received");
        let parsedShareholders;
        try {
          if (typeof shareholders === 'string') {
            parsedShareholders = JSON.parse(shareholders);
          } else if (Array.isArray(shareholders)) {
            parsedShareholders = shareholders;
          } else {
            parsedShareholders = [];
          }
          
          console.log(`📊 Shareholders count: ${parsedShareholders.length}`);
          
          if (Array.isArray(parsedShareholders) && parsedShareholders.length > 0) {
            console.log(`🚀 Processing ${parsedShareholders.length} shareholders...`);
            
            for (let index = 0; index < parsedShareholders.length; index++) {
              const shareholder = parsedShareholders[index];
              console.log(`👤 Processing Shareholder ${index + 1}: ${shareholder.name || 'Unnamed'}`);
              
              try {
                if (!shareholder || !shareholder.name || shareholder.name.trim() === '') {
                  console.log(`⚠️  Skipping Shareholder ${index + 1} - Missing name`);
                  continue;
                }
                
                const createdShareholder = await createPersonDetails(
                  savedJob._id,
                  "shareholder",
                  shareholder,
                  req.user._id,
                  req.files,
                  gmail,
                  session,
                  index,
                  req
                );
                
                if (createdShareholder) {
                  console.log(`✅ Successfully created shareholder ${index + 1}: ${shareholder.name}`);
                }
              } catch (error) {
                console.error(`❌ Error creating shareholder ${index + 1}:`, error);
              }
            }
            
            console.log(`✅ Completed processing ${parsedShareholders.length} shareholder records`);
          }
        } catch (parseError) {
          console.error("❌ Error parsing shareholders data:", parseError);
        }
      } else {
        console.log("ℹ️  No shareholders data provided");
      }
      console.log("=== SHAREHOLDERS PROCESSING COMPLETE ===\n");

      // Process secretaries
      console.log("👥 === PROCESSING SECRETARIES ===");
      if (secretaries) {
        let parsedSecretaries;
        try {
          if (typeof secretaries === 'string') {
            parsedSecretaries = JSON.parse(secretaries);
          } else if (Array.isArray(secretaries)) {
            parsedSecretaries = secretaries;
          } else {
            parsedSecretaries = [];
          }
          
          console.log(`📊 Secretaries count: ${parsedSecretaries.length}`);
          
          if (Array.isArray(parsedSecretaries) && parsedSecretaries.length > 0) {
            for (let index = 0; index < parsedSecretaries.length; index++) {
              const secretary = parsedSecretaries[index];
              console.log(`👤 Processing Secretary ${index + 1}: ${secretary.name || 'Unnamed'}`);
              
              try {
                if (!secretary || !secretary.name || secretary.name.trim() === '') {
                  console.log(`⚠️  Skipping Secretary ${index + 1} - Missing name`);
                  continue;
                }
                
                const createdSecretary = await createPersonDetails(
                  savedJob._id,
                  "secretary",
                  secretary,
                  req.user._id,
                  req.files,
                  gmail,
                  session,
                  index,
                  req
                );
                
                if (createdSecretary) {
                  console.log(`✅ Successfully created secretary ${index + 1}: ${secretary.name}`);
                }
              } catch (error) {
                console.error(`❌ Error creating secretary ${index + 1}:`, error);
              }
            }
          }
        } catch (parseError) {
          console.error("❌ Error parsing secretaries data:", parseError);
        }
      } else {
        console.log("ℹ️  No secretaries data provided");
      }
      console.log("=== SECRETARIES PROCESSING COMPLETE ===\n");

      // Process SEFs
      console.log("👥 === PROCESSING SEFS ===");
      if (sefs) {
        let parsedSefs;
        try {
          if (typeof sefs === 'string') {
            parsedSefs = JSON.parse(sefs);
          } else if (Array.isArray(sefs)) {
            parsedSefs = sefs;
          } else {
            parsedSefs = [];
          }
          
          console.log(`📊 SEFs count: ${parsedSefs.length}`);
          
          if (Array.isArray(parsedSefs) && parsedSefs.length > 0) {
            for (let index = 0; index < parsedSefs.length; index++) {
              const sef = parsedSefs[index];
              console.log(`👤 Processing SEF ${index + 1}: ${sef.name || 'Unnamed'}`);
              
              try {
                if (!sef || !sef.name || sef.name.trim() === '') {
                  console.log(`⚠️  Skipping SEF ${index + 1} - Missing name`);
                  continue;
                }
                
                const createdSef = await createPersonDetails(
                  savedJob._id,
                  "sef",
                  sef,
                  req.user._id,
                  req.files,
                  gmail,
                  session,
                  index,
                  req
                );
                
                if (createdSef) {
                  console.log(`✅ Successfully created SEF ${index + 1}: ${sef.name}`);
                }
              } catch (error) {
                console.error(`❌ Error creating SEF ${index + 1}:`, error);
              }
            }
          }
        } catch (parseError) {
          console.error("❌ Error parsing SEFs data:", parseError);
        }
      } else {
        console.log("ℹ️  No SEFs data provided");
      }
      console.log("=== SEFS PROCESSING COMPLETE ===\n");

      // 6. Create KYC documents collection
      let kycDocuments = [];
      let kycDocUrls = {};

      // Process and upload KYC documents first
      if (req.files["kycDocuments"] && req.files["kycDocuments"].length > 0) {
        console.log(
          `📄 Processing ${req.files["kycDocuments"].length} KYC documents`
        );

        const parsedKycDocumentInfo = typeof kycDocumentInfo === 'string' 
          ? JSON.parse(kycDocumentInfo) 
          : kycDocumentInfo;

        // Upload all KYC documents and store results
        for (let i = 0; i < req.files["kycDocuments"].length; i++) {
          const file = req.files["kycDocuments"][i];
          const uploadResult = await safeCloudinaryUpload(file.path, {
            folder: `clients/${gmail}/kyc_documents`,
          });

          kycDocuments.push({
            file: uploadResult.url,
            description:
              parsedKycDocumentInfo && parsedKycDocumentInfo[i]
                ? parsedKycDocumentInfo[i].description
                : `KYC Document ${i + 1}`,
            date:
              parsedKycDocumentInfo && parsedKycDocumentInfo[i]
                ? parsedKycDocumentInfo[i].date
                : new Date(),
          });

          // Store URLs for later use in approvals
          kycDocUrls[i] = {
            url: uploadResult.url,
            fileName: file.originalname,
            fileType: file.mimetype,
            cloudinaryId: uploadResult.publicId || "manual-upload",
          };

          // Clean up temporary file
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        }
      }

      // 7. Create KYC document entries
      if (kycDocuments.length > 0) {
        const kycDoc = new KycDocument({
          jobId: savedJob._id,
          activeStatus: "yes",
          documents: kycDocuments,
          updatedBy: req.user._id,
        });

        await kycDoc.save({ session });
        console.log(`✅ Created KYC documents with ${kycDocuments.length} files`);
      }

      // 8. Create and complete KYC approval AFTER documents are processed
      const kycApproval = new KycApproval({
        jobId: savedJob._id,
        status: "completed",
        currentApprovalStage: "completed",
        lmroApproval: {
          approved: true,
          approvedBy: req.user._id,
          approvedAt: new Date(currentTime.getTime() + 5000),
          notes: "Auto-approved during job creation by Operation Management",
        },
        dlmroApproval: {
          approved: true,
          approvedBy: req.user._id,
          approvedAt: new Date(currentTime.getTime() + 6000),
          notes: "Auto-approved during job creation by Operation Management",
        },
        ceoApproval: {
          approved: true,
          approvedBy: req.user._id,
          approvedAt: new Date(currentTime.getTime() + 7000),
          notes: "Auto-approved during job creation by Operation Management",
        },
        completedAt: new Date(currentTime.getTime() + 7000),
      });

      // Add document references to KYC approval if any documents were uploaded
      if (Object.keys(kycDocUrls).length > 0) {
        // Use the first document for LMRO
        kycApproval.lmroApproval.document = {
          fileUrl: kycDocUrls[0].url,
          fileName: kycDocUrls[0].fileName,
          fileType: kycDocUrls[0].fileType,
          cloudinaryId: kycDocUrls[0].cloudinaryId,
          uploadedAt: new Date(currentTime.getTime() + 5000),
          uploadedBy: req.user._id,
        };

        // If there are at least 2 documents, use the second for DLMRO
        if (Object.keys(kycDocUrls).length > 1) {
          kycApproval.dlmroApproval.document = {
            fileUrl: kycDocUrls[1].url,
            fileName: kycDocUrls[1].fileName,
            fileType: kycDocUrls[1].fileType,
            cloudinaryId: kycDocUrls[1].cloudinaryId,
            uploadedAt: new Date(currentTime.getTime() + 6000),
            uploadedBy: req.user._id,
          };
        }

        // Use the last document for CEO
        const lastIdx = Object.keys(kycDocUrls).length - 1;
        kycApproval.ceoApproval.document = {
          fileUrl: kycDocUrls[lastIdx].url,
          fileName: kycDocUrls[lastIdx].fileName,
          fileType: kycDocUrls[lastIdx].fileType,
          cloudinaryId: kycDocUrls[lastIdx].cloudinaryId,
          uploadedAt: new Date(currentTime.getTime() + 7000),
          uploadedBy: req.user._id,
        };
      }

      await kycApproval.save({ session });
      console.log("✅ Created and completed KYC approval with documents");

      // 9. Process BRA documents similarly
      let braDocUrls = {};
      if (req.files["braDocuments"] && req.files["braDocuments"].length > 0) {
        // Upload all BRA documents and store results
        for (let i = 0; i < req.files["braDocuments"].length; i++) {
          const file = req.files["braDocuments"][i];
          const uploadResult = await safeCloudinaryUpload(file.path, {
            folder: `clients/${gmail}/bra_documents`,
          });

          // Store URLs for later use in approvals
          braDocUrls[i] = {
            url: uploadResult.url,
            fileName: file.originalname,
            fileType: file.mimetype,
            cloudinaryId: uploadResult.publicId || "manual-upload",
          };

          // Clean up temporary file
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        }
      }

      // 10. Create and complete BRA approval with documents
      const braApproval = new BraApproval({
        jobId: savedJob._id,
        status: "completed",
        currentApprovalStage: "completed",
        lmroApproval: {
          approved: true,
          approvedBy: req.user._id,
          approvedAt: new Date(currentTime.getTime() + 9000),
          notes: "Auto-approved during job creation by Operation Management",
        },
        dlmroApproval: {
          approved: true,
          approvedBy: req.user._id,
          approvedAt: new Date(currentTime.getTime() + 10000),
          notes: "Auto-approved during job creation by Operation Management",
        },
        ceoApproval: {
          approved: true,
          approvedBy: req.user._id,
          approvedAt: new Date(currentTime.getTime() + 11000),
          notes: "Auto-approved during job creation by Operation Management",
        },
        completedAt: new Date(currentTime.getTime() + 11000),
      });

      // Add document references to BRA approval if any documents were uploaded
      if (Object.keys(braDocUrls).length > 0) {
        // Use the last document for CEO approval (final approval)
        const lastIdx = Object.keys(braDocUrls).length - 1;
        braApproval.ceoApproval.document = {
          fileUrl: braDocUrls[lastIdx].url,
          fileName: braDocUrls[lastIdx].fileName,
          fileType: braDocUrls[lastIdx].fileType,
          cloudinaryId: braDocUrls[lastIdx].cloudinaryId,
          uploadedAt: new Date(currentTime.getTime() + 11000),
          uploadedBy: req.user._id,
        };
      }

      await braApproval.save({ session });
      console.log("✅ Created and completed BRA approval with documents");

      // 11. Send notifications to job parties
      await notificationService.createJobNotification(
        {
          title: "New Pre-Approved Job Created",
          description: `A new pre-approved ${serviceType} job (${jobNumber}) has been created for ${clientName} by ${req.user.name}.`,
          type: "job",
          relatedTo: { model: "Job", id: savedJob._id },
        },
        savedJob,
        req.user._id
      );

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log("🎉 Pre-approved job creation completed successfully");
      res.status(201).json({
        message: "Pre-approved job created successfully",
        job: savedJob,
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();

      console.error("❌ Error creating pre-approved job:", error);
      res.status(500).json({
        message: "Failed to create pre-approved job",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("❌ Error creating pre-approved job:", error);
    res.status(500).json({ 
      message: "Failed to create pre-approved job", 
      error: error.message 
    });
  }
});

// ENHANCED: createPersonDetails helper function with better debugging and URL handling
const createPersonDetails = async (jobId, personType, personData, userId, files, gmail, session, personIndex = 0, req = null) => {
  console.log(`\n🔧 === CREATING ${personType.toUpperCase()} DETAILS ===`);
  console.log(`📋 Person Index: ${personIndex}`);
  console.log(`👤 Person Data:`, JSON.stringify(personData, null, 2));
  
  // Validate personData
  if (!personData) {
    console.log(`❌ Skipping ${personType} record - personData is null/undefined`);
    return null;
  }
  
  if (!personData.name || personData.name.trim() === '') {
    console.log(`❌ Skipping ${personType} record - missing or empty name`);
    console.log(`📋 Full person data:`, personData);
    return null;
  }

  console.log(`✅ Creating ${personType} details for: ${personData.name} (index: ${personIndex})`);
  
  // DEBUG: Log person data to see what documents are being passed
  console.log(`🔍 Person data received:`, {
    name: personData.name,
    visaCopy: personData.visaCopy,
    qidDoc: personData.qidDoc,
    nationalAddressDoc: personData.nationalAddressDoc,
    passportDoc: personData.passportDoc,
    cv: personData.cv
  });

  const newPerson = new PersonDetails({
    jobId,
    personType,
    name: personData.name.trim(),
    nationality: personData.nationality || "",
    qidNo: personData.qidNo || "",
    qidExpiry: personData.qidExpiry ? new Date(personData.qidExpiry) : null,
    nationalAddress: personData.nationalAddress || "",
    nationalAddressExpiry: personData.nationalAddressExpiry ? new Date(personData.nationalAddressExpiry) : null,
    passportNo: personData.passportNo || "",
    passportExpiry: personData.passportExpiry ? new Date(personData.passportExpiry) : null,
    mobileNo: personData.mobileNo || "",
    email: personData.email || "",
    updatedBy: userId,
  });

  console.log(`📋 Created PersonDetails object:`, {
    jobId: newPerson.jobId,
    personType: newPerson.personType,
    name: newPerson.name,
    nationality: newPerson.nationality,
    email: newPerson.email
  });

  // Process document uploads for person with proper indexing
  const fieldPrefix = personType.toLowerCase();
  
  console.log(`📁 Processing documents for ${personType} ${personIndex}`);
  if (files) console.log(`🔍 Available file fields:`, Object.keys(files));

  // Check for indexed documents first (new format)
  const visaCopyField = `${fieldPrefix}VisaCopy_${personIndex}`;
  const qidDocField = `${fieldPrefix}QidDoc_${personIndex}`;
  const nationalAddressDocField = `${fieldPrefix}NationalAddressDoc_${personIndex}`;
  const passportDocField = `${fieldPrefix}PassportDoc_${personIndex}`;
  const cvField = `${fieldPrefix}Cv_${personIndex}`;

  // URL field names for existing documents
  const visaCopyUrlField = `${fieldPrefix}VisaCopyUrl_${personIndex}`;
  const qidDocUrlField = `${fieldPrefix}QidDocUrl_${personIndex}`;
  const nationalAddressDocUrlField = `${fieldPrefix}NationalAddressDocUrl_${personIndex}`;
  const passportDocUrlField = `${fieldPrefix}PassportDocUrl_${personIndex}`;
  const cvUrlField = `${fieldPrefix}CvUrl_${personIndex}`;

  console.log(`🔍 Looking for files with patterns:`, {
    visaCopy: visaCopyField,
    qidDoc: qidDocField,
    nationalAddress: nationalAddressDocField,
    passport: passportDocField,
    cv: cvField
  });

  console.log(`🔗 Looking for URL fields:`, {
    visaCopyUrl: visaCopyUrlField,
    qidDocUrl: qidDocUrlField,
    nationalAddressUrl: nationalAddressDocUrlField,
    passportUrl: passportDocUrlField,
    cvUrl: cvUrlField
  });

  console.log(`🔍 req.body contents for URL fields:`, {
    visaCopyUrl: req.body[visaCopyUrlField],
    qidDocUrl: req.body[qidDocUrlField],
    nationalAddressUrl: req.body[nationalAddressDocUrlField],
    passportUrl: req.body[passportDocUrlField],
    cvUrl: req.body[cvUrlField]
  });

  let documentsProcessed = 0;

  // Visa Copy - new file OR existing URL
  if (files && files[visaCopyField] && files[visaCopyField].length > 0) {
    console.log(`📄 Found visa copy file: ${visaCopyField}`);
    try {
      const uploadResult = await safeCloudinaryUpload(
        files[visaCopyField][0].path,
        { folder: `clients/${gmail}/people/${personType}/visa` }
      );
      newPerson.visaCopy = uploadResult.url;
      documentsProcessed++;
      console.log(`✅ Uploaded visa copy: ${uploadResult.url}`);
      
      fs.unlink(files[visaCopyField][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (uploadError) {
      console.error(`❌ Error uploading visa copy:`, uploadError);
    }
  } else if (req && req.body && req.body[visaCopyUrlField]) {
    newPerson.visaCopy = req.body[visaCopyUrlField];
    documentsProcessed++;
    console.log(`📄 Using existing visa copy URL: ${newPerson.visaCopy}`);
  } else if (personData.visaCopy) {
    newPerson.visaCopy = personData.visaCopy;
    documentsProcessed++;
    console.log(`📄 Using visa copy from person data: ${newPerson.visaCopy}`);
  }

  // QID Document - new file OR existing URL
  if (files && files[qidDocField] && files[qidDocField].length > 0) {
    console.log(`📄 Found QID doc file: ${qidDocField}`);
    try {
      const uploadResult = await safeCloudinaryUpload(
        files[qidDocField][0].path,
        { folder: `clients/${gmail}/people/${personType}/qid` }
      );
      newPerson.qidDoc = uploadResult.url;
      documentsProcessed++;
      console.log(`✅ Uploaded QID doc: ${uploadResult.url}`);
      
      fs.unlink(files[qidDocField][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (uploadError) {
      console.error(`❌ Error uploading QID doc:`, uploadError);
    }
  } else if (req && req.body && req.body[qidDocUrlField]) {
    newPerson.qidDoc = req.body[qidDocUrlField];
    documentsProcessed++;
    console.log(`📄 Using existing QID doc URL: ${newPerson.qidDoc}`);
  } else if (personData.qidDoc) {
    newPerson.qidDoc = personData.qidDoc;
    documentsProcessed++;
    console.log(`📄 Using QID doc from person data: ${newPerson.qidDoc}`);
  }

  // National Address Document - new file OR existing URL
  if (files && files[nationalAddressDocField] && files[nationalAddressDocField].length > 0) {
    console.log(`📄 Found national address doc file: ${nationalAddressDocField}`);
    try {
      const uploadResult = await safeCloudinaryUpload(
        files[nationalAddressDocField][0].path,
        { folder: `clients/${gmail}/people/${personType}/national_address` }
      );
      newPerson.nationalAddressDoc = uploadResult.url;
      documentsProcessed++;
      console.log(`✅ Uploaded national address doc: ${uploadResult.url}`);
      
      fs.unlink(files[nationalAddressDocField][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (uploadError) {
      console.error(`❌ Error uploading national address doc:`, uploadError);
    }
  } else if (req && req.body && req.body[nationalAddressDocUrlField]) {
    newPerson.nationalAddressDoc = req.body[nationalAddressDocUrlField];
    documentsProcessed++;
    console.log(`📄 Using existing national address doc URL: ${newPerson.nationalAddressDoc}`);
  } else if (personData.nationalAddressDoc) {
    newPerson.nationalAddressDoc = personData.nationalAddressDoc;
    documentsProcessed++;
    console.log(`📄 Using national address doc from person data: ${newPerson.nationalAddressDoc}`);
  }

  // Passport Document - new file OR existing URL
  if (files && files[passportDocField] && files[passportDocField].length > 0) {
    console.log(`📄 Found passport doc file: ${passportDocField}`);
    try {
      const uploadResult = await safeCloudinaryUpload(
        files[passportDocField][0].path,
        { folder: `clients/${gmail}/people/${personType}/passport` }
      );
      newPerson.passportDoc = uploadResult.url;
      documentsProcessed++;
      console.log(`✅ Uploaded passport doc: ${uploadResult.url}`);
      
      fs.unlink(files[passportDocField][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (uploadError) {
      console.error(`❌ Error uploading passport doc:`, uploadError);
    }
  } else if (req && req.body && req.body[passportDocUrlField]) {
    newPerson.passportDoc = req.body[passportDocUrlField];
    documentsProcessed++;
    console.log(`📄 Using existing passport doc URL: ${newPerson.passportDoc}`);
  } else if (personData.passportDoc) {
    newPerson.passportDoc = personData.passportDoc;
    documentsProcessed++;
    console.log(`📄 Using passport doc from person data: ${newPerson.passportDoc}`);
  }

  // CV - new file OR existing URL
  if (files && files[cvField] && files[cvField].length > 0) {
    console.log(`📄 Found CV file: ${cvField}`);
    try {
      const uploadResult = await safeCloudinaryUpload(
        files[cvField][0].path,
        { folder: `clients/${gmail}/people/${personType}/cv` }
      );
      newPerson.cv = uploadResult.url;
      documentsProcessed++;
      console.log(`✅ Uploaded CV: ${uploadResult.url}`);
      
      fs.unlink(files[cvField][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (uploadError) {
      console.error(`❌ Error uploading CV:`, uploadError);
    }
  } else if (req && req.body && req.body[cvUrlField]) {
    newPerson.cv = req.body[cvUrlField];
    documentsProcessed++;
    console.log(`📄 Using existing CV URL: ${newPerson.cv}`);
  } else if (personData.cv) {
    newPerson.cv = personData.cv;
    documentsProcessed++;
    console.log(`📄 Using CV from person data: ${newPerson.cv}`);
  }

  console.log(`📊 Documents processed for ${personType} ${personIndex}: ${documentsProcessed}`);

  try {
    const savedPerson = await newPerson.save({ session });
    console.log(`✅ Successfully saved ${personType}: ${personData.name} (DB ID: ${savedPerson._id})`);
    
    // DEBUG: Log final saved document URLs
    console.log(`🔍 Final saved document URLs for ${personType}:`, {
      name: savedPerson.name,
      visaCopy: savedPerson.visaCopy,
      qidDoc: savedPerson.qidDoc,
      nationalAddressDoc: savedPerson.nationalAddressDoc,
      passportDoc: savedPerson.passportDoc,
      cv: savedPerson.cv
    });
    
    return savedPerson;
  } catch (saveError) {
    console.error(`❌ Error saving ${personType} to database:`, saveError);
    throw saveError;
  }
};

// Get field history for a person detail
const getPersonFieldHistory = asyncHandler(async (req, res) => {
  const { jobId, personType, personId } = req.params;
  const { field } = req.query;
  
  if (!field) {
    return res.status(400).json({ message: "Field parameter is required" });
  }

  // Check if job exists and if user has permission to access it
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Find person details
  const personDetails = await PersonDetails.findOne({
    _id: personId,
    jobId,
    personType,
  }).populate("fieldHistory.updatedBy", "name");

  if (!personDetails) {
    res.status(404);
    throw new Error("Person details not found");
  }

  // Filter history for the specific field
  const fieldHistory = personDetails.fieldHistory
    .filter((item) => item.field === field)
    .map((item) => ({
      value: item.value,
      previousValue: item.previousValue,
      timestamp: item.timestamp,
      updatedBy: item.updatedBy ? item.updatedBy.name : "Unknown",
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Add current value to history if it's not already there
  const currentValue = personDetails[field];
  // When no history exists, it automatically creates one with current value
  if (
    fieldHistory.length === 0 ||
    String(fieldHistory[0].value) !== String(currentValue)
  ) {
    fieldHistory.unshift({
      value: currentValue,
      previousValue: null,
      timestamp: personDetails.updatedAt,
      updatedBy: personDetails.updatedBy
        ? await getUserName(personDetails.updatedBy)
        : "Unknown",
    });
  }
  console.log(
    `History request for ${personType} ${personId}, field ${field}. Found ${fieldHistory.length} history entries.`
  );

  res.status(200).json({
    field,
    history: fieldHistory,
  });
});

// Helper function to get user name
const getUserName = async (userId) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    return user ? user.name : 'Unknown';
  } catch (error) {
    console.error('Error getting user name:', error);
    return 'Unknown';
  }
};

// Get all engagement letters for a client by Gmail
const getClientEngagementLetters = asyncHandler(async (req, res) => {
  const { gmail } = req.params;

  try {
    // Find the client by Gmail
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Find all jobs for this client
    const clientJobs = await Job.find({ clientId: client._id });
    if (!clientJobs || clientJobs.length === 0) {
      return res.status(200).json([]);
    }

    // Get all job IDs for this client
    const jobIds = clientJobs.map(job => job._id);

    // Find all company details with engagement letters for these jobs
    const companyDetailsWithLetters = await CompanyDetails.find({
      jobId: { $in: jobIds },
      engagementLetters: { $exists: true, $ne: null }
    }).populate('jobId', 'serviceType clientName jobNumber createdAt');

    // Collect all engagement letters with job context
    let allEngagementLetters = [];

    for (const companyDetail of companyDetailsWithLetters) {
      if (Array.isArray(companyDetail.engagementLetters)) {
        // Handle array format (new format)
        companyDetail.engagementLetters.forEach(letter => {
          allEngagementLetters.push({
            ...letter.toObject(),
            jobId: companyDetail.jobId._id,
            jobNumber: companyDetail.jobId.jobNumber,
            serviceType: companyDetail.jobId.serviceType,
            clientName: companyDetail.jobId.clientName,
            jobCreatedAt: companyDetail.jobId.createdAt
          });
        });
      } else if (companyDetail.engagementLetters) {
        // Handle string format (legacy format)
        allEngagementLetters.push({
          fileUrl: companyDetail.engagementLetters,
          fileName: 'Engagement Letter',
          uploadedAt: companyDetail.updatedAt,
          uploadedBy: companyDetail.updatedBy,
          description: 'Legacy engagement letter',
          jobId: companyDetail.jobId._id,
          jobNumber: companyDetail.jobId.jobNumber,
          serviceType: companyDetail.jobId.serviceType,
          clientName: companyDetail.jobId.clientName,
          jobCreatedAt: companyDetail.jobId.createdAt
        });
      }
    }

    // Remove duplicates based on fileUrl and sort by upload date
    const uniqueLetters = allEngagementLetters.filter((letter, index, self) =>
      index === self.findIndex(l => l.fileUrl === letter.fileUrl)
    ).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.status(200).json(uniqueLetters);
  } catch (error) {
    console.error('Error fetching client engagement letters:', error);
    res.status(500).json({ 
      message: 'Failed to fetch engagement letters', 
      error: error.message 
    });
  }
});

// Fixed expiring jobs functions in operationController.js

/**
 * Get expiring jobs with proper notification timing
 * Shows jobs that are:
 * - Expired (past expiration date)
 * - Expiring within 1 week (7 days) - Critical notification
 * - Expiring within 1 month (30 days) - Warning notification
 */


// FIXED: Expiring jobs functions in operationController.js


// HELPER FUNCTION: Calculate urgency level
// Critical: 0-30 days, Warning: 30-60 days, Normal: 60+ days
const calculateUrgencyLevel = (actualExpiryDate, currentDate = new Date()) => {
  const diffDays = Math.ceil((new Date(actualExpiryDate) - currentDate) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      level: "expired",
      daysUntilExpiry: diffDays,
      description: `Expired ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
      priority: 1
    };
  } else if (diffDays <= 30) {
    return {
      level: "critical",
      daysUntilExpiry: diffDays,
      description: diffDays === 0 ? "Expires today" : `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      priority: diffDays === 0 ? 2 : 3
    };
  } else if (diffDays <= 60) {
    return {
      level: "warning",
      daysUntilExpiry: diffDays,
      description: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      priority: 4
    };
  }
  return {
    level: "normal",
    daysUntilExpiry: diffDays,
    description: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
    priority: 5
  };
};

// FIXED: Main getExpiringJobs function (for modal "View All") 
// Replace the existing getExpiringJobs function in operationController.js

const getExpiringJobs = async (req, res) => {
  try {
    console.log("📋 Fetching ALL expiring documents within 2 months (excluding already expired)...");

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // Changed to 60 days

    console.log("📅 Date calculations:");
    console.log("Now:", now.toISOString());
    console.log("One week from now:", oneWeekFromNow.toISOString());
    console.log("Two months from now:", twoMonthsFromNow.toISOString());

    // STEP 1: Get CompanyDetails with documents expiring within 2 months (exclude already expired)
    const expiringCompanyDetails = await CompanyDetails.find({
      $or: [
        { expiryDate: { $exists: true, $ne: null, $gte: now, $lte: twoMonthsFromNow } },
        { companyComputerCardExpiry: { $exists: true, $ne: null, $gte: now, $lte: twoMonthsFromNow } },
        { taxCardExpiry: { $exists: true, $ne: null, $gte: now, $lte: twoMonthsFromNow } },
        { crExtractExpiry: { $exists: true, $ne: null, $gte: now, $lte: twoMonthsFromNow } },
        { scopeOfLicenseExpiry: { $exists: true, $ne: null, $gte: now, $lte: twoMonthsFromNow } },
      ],
    })
    .populate({
      path: 'jobId',
      select: 'jobNumber clientName serviceType status gmail createdAt assignedPerson',
      populate: { 
        path: 'assignedPerson', 
        select: 'name email' 
      },
      match: { 
        status: { $nin: ['cancelled'] } // Only exclude cancelled jobs
      }
    })
    .sort({ expiryDate: 1 });

    console.log(`📊 Found ${expiringCompanyDetails.length} company details with expiry dates within range`);

    // STEP 2: Get PersonDetails with expiring documents  
    const expiringPersonDetails = await PersonDetails.find({
      $or: [
        { qidExpiry: { $exists: true, $ne: null, $lte: oneMonthFromNow } },
        { nationalAddressExpiry: { $exists: true, $ne: null, $lte: oneMonthFromNow } },
        { passportExpiry: { $exists: true, $ne: null, $lte: oneMonthFromNow } },
      ],
    })
    .populate({
      path: 'jobId',
      select: 'jobNumber clientName serviceType status gmail createdAt assignedPerson',
      populate: { path: 'assignedPerson', select: 'name email' },
      match: { status: { $nin: ['cancelled'] } }, // Only exclude cancelled jobs
    })
    .lean();

    console.log(`📊 Found ${expiringPersonDetails.length} person details with expiry dates within range`);

    // STEP 3: Process CompanyDetails results - CREATE INDIVIDUAL ENTRIES FOR EACH DOCUMENT
    const companyDetailJobs = [];
    
    expiringCompanyDetails
      .filter(detail => detail && detail.jobId)
      .forEach(detail => {
        const job = detail.jobId;

        // Process each document type individually
        const documentTypes = [
          { date: detail.expiryDate, type: 'Trade License' },
          { date: detail.companyComputerCardExpiry, type: 'Company Computer Card' },
          { date: detail.taxCardExpiry, type: 'Tax Card' },
          { date: detail.crExtractExpiry, type: 'CR Extract' },
          { date: detail.scopeOfLicenseExpiry, type: 'Scope of License' },
        ];

        documentTypes.forEach(docType => {
          // Only include if expiry date exists, is not already expired, and is within 2 months
          if (docType.date && docType.date >= now && docType.date <= twoMonthsFromNow) {
            const urgencyData = calculateUrgencyLevel(docType.date, now);
            
            companyDetailJobs.push({
              jobId: job._id,
              jobNumber: job.jobNumber || 'N/A',
              clientName: job.clientName || 'Unknown Client',
              companyName: detail.companyName || job.clientName || 'Unknown Company',
              serviceType: job.serviceType || 'Unknown Service',
              status: job.status || 'unknown',
              expiryDate: docType.date,
              expiryType: docType.type,
              daysUntilExpiry: urgencyData.daysUntilExpiry,
              urgencyLevel: urgencyData.level,
              urgencyDescription: urgencyData.description,
              priority: urgencyData.priority,
              assignedPerson: {
                name: job.assignedPerson?.name || 'Unassigned',
                email: job.assignedPerson?.email
              },
              createdAt: job.createdAt,
              updatedAt: job.updatedAt || detail.updatedAt,
              isServiceCompleted: job.status === 'fully_completed_bra' || job.status === 'completed'
            });
          }
        });
      });

    // STEP 4: Process PersonDetails results - CREATE INDIVIDUAL ENTRIES FOR EACH DOCUMENT
    const personDetailJobs = [];
    
    expiringPersonDetails
      .filter(pd => pd.jobId)
      .forEach(pd => {
        const documentTypes = [
          { date: pd.qidExpiry, type: `${pd.personType} QID (${pd.name})` },
          { date: pd.nationalAddressExpiry, type: `${pd.personType} National Address (${pd.name})` },
          { date: pd.passportExpiry, type: `${pd.personType} Passport (${pd.name})` },
        ];

        documentTypes.forEach(docType => {
          if (docType.date && docType.date <= oneMonthFromNow) {
            const urgencyData = calculateUrgencyLevel(docType.date, now);
            
            personDetailJobs.push({
              jobId: pd.jobId._id,
              jobNumber: pd.jobId.jobNumber || 'N/A',
              clientName: pd.jobId.clientName || 'Unknown Client',
              companyName: pd.jobId.clientName || 'Unknown Company',
              serviceType: pd.jobId.serviceType || 'Unknown Service',
              status: pd.jobId.status || 'unknown',
              expiryDate: docType.date,
              expiryType: docType.type,
              daysUntilExpiry: urgencyData.daysUntilExpiry,
              urgencyLevel: urgencyData.level,
              urgencyDescription: urgencyData.description,
              priority: urgencyData.priority,
              assignedPerson: {
                name: pd.jobId.assignedPerson?.name || 'Unassigned',
                email: pd.jobId.assignedPerson?.email
              },
              createdAt: pd.jobId.createdAt,
              updatedAt: pd.jobId.updatedAt,
              isServiceCompleted: pd.jobId.status === 'fully_completed_bra' || pd.jobId.status === 'completed'
            });
          }
        });
      });

    // STEP 5: Combine all results
    const allJobs = [...companyDetailJobs, ...personDetailJobs];

    // STEP 6: Remove duplicates based on jobId + expiryType + expiryDate combination
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => 
        j.jobId.toString() === job.jobId.toString() && 
        j.expiryType === job.expiryType &&
        j.expiryDate.getTime() === job.expiryDate.getTime()
      )
    );

    // STEP 7: Sort by priority (expired first, then by days until expiry)
    uniqueJobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    // STEP 8: Calculate comprehensive summary statistics
    const summary = {
      total: uniqueJobs.length,
      expired: uniqueJobs.filter(job => job.urgencyLevel === 'expired').length,
      critical: uniqueJobs.filter(job => job.urgencyLevel === 'critical').length,
      warning: uniqueJobs.filter(job => job.urgencyLevel === 'warning').length,
      normal: uniqueJobs.filter(job => job.urgencyLevel === 'normal').length,
      fromCompletedServices: uniqueJobs.filter(job => job.isServiceCompleted).length,
      // ADDED: Show unique jobs count and document breakdown
      uniqueJobs: [...new Set(uniqueJobs.map(job => job.jobId.toString()))].length,
      documentTypes: {
        companyDocuments: uniqueJobs.filter(job =>
          ['Trade License', 'Company Computer Card', 'Tax Card', 'CR Extract', 'Scope of License'].includes(job.expiryType)
        ).length,
        personalDocuments: uniqueJobs.filter(job => 
          job.expiryType.includes('QID') || job.expiryType.includes('National Address') || job.expiryType.includes('Passport')
        ).length
      }
    };

    console.log("📈 COMPLETE expiring jobs summary:", summary);
    console.log("📋 Document breakdown:");
    console.log(`  - Company documents: ${summary.documentTypes.companyDocuments}`);
    console.log(`  - Personal documents: ${summary.documentTypes.personalDocuments}`);
    console.log(`  - From completed services: ${summary.fromCompletedServices}`);
    console.log(`  - Unique jobs affected: ${summary.uniqueJobs}`);

    // Log sample of most urgent items
    const mostUrgent = uniqueJobs.slice(0, 5);
    console.log("🚨 Most urgent documents:");
    mostUrgent.forEach(job => {
      console.log(`  - ${job.clientName}: ${job.expiryType} (${job.urgencyDescription})`);
    });

    res.status(200).json({
      success: true,
      data: uniqueJobs,
      summary,
      message: `Found ${uniqueJobs.length} expiring documents from ${summary.uniqueJobs} unique jobs (${summary.fromCompletedServices} from completed services)`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching ALL expiring jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring jobs",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// 2. FIXED: getExpiringJobsForDashboard function
const getExpiringJobsForDashboard = async (req, res) => {
  try {
    console.log("📊 Fetching future expiring documents for dashboard (2 months, excluding expired)");

    const now = new Date();
    const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Get CompanyDetails with expiring documents (exclude already expired)
    const expiringCompanyDetails = await CompanyDetails.find({
      $or: [
        { expiryDate: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
        { companyComputerCardExpiry: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
        { taxCardExpiry: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
        { crExtractExpiry: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
        { scopeOfLicenseExpiry: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
      ],
    })
    .populate({
      path: 'jobId',
      select: 'jobNumber clientName serviceType status gmail createdAt assignedPerson',
      populate: { 
        path: 'assignedPerson', 
        select: 'name email' 
      },
      match: { 
        status: { $nin: ['cancelled'] } // Only exclude cancelled jobs
      }
    })
    .lean();

    // Get PersonDetails with expiring documents (exclude already expired)
    const expiringPersonDetails = await PersonDetails.find({
      $or: [
        { qidExpiry: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
        { nationalAddressExpiry: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
        { passportExpiry: { $exists: true, $ne: null, $gt: now, $lte: twoMonthsFromNow } },
      ],
    })
    .populate({
      path: 'jobId',
      select: 'jobNumber clientName serviceType status gmail createdAt assignedPerson',
      populate: { path: 'assignedPerson', select: 'name email' },
      match: { status: { $nin: ['cancelled'] } },
    })
    .lean();

    console.log(`Found ${expiringCompanyDetails.length} company details + ${expiringPersonDetails.length} person details`);

    const allJobs = [];

    // Process CompanyDetails - CREATE SEPARATE ENTRY FOR EACH EXPIRED DOCUMENT
    expiringCompanyDetails
      .filter(detail => detail && detail.jobId)
      .forEach(detail => {
        const job = detail.jobId;

        // IMPORTANT: Create separate entries for EACH expiring document type
        const expiryChecks = [
          { date: detail.expiryDate, type: 'Trade License' },
          { date: detail.companyComputerCardExpiry, type: 'Company Computer Card' },
          { date: detail.taxCardExpiry, type: 'Tax Card' },
          { date: detail.crExtractExpiry, type: 'CR Extract' },
          { date: detail.scopeOfLicenseExpiry, type: 'Scope of License' },
        ];

        // Check each document type separately
        expiryChecks.forEach(check => {
          // Only include if the document has an expiry date, is within our range, and NOT already expired
          if (check.date && check.date > now && check.date <= twoMonthsFromNow) {
            const urgencyData = calculateUrgencyLevel(check.date, now);
            
            allJobs.push({
              jobId: job._id,
              jobNumber: job.jobNumber || 'N/A',
              clientName: job.clientName || 'Unknown Client',
              companyName: detail.companyName || job.clientName || 'Unknown Company',
              serviceType: job.serviceType || 'Unknown Service',
              status: job.status || 'unknown',
              expiryDate: check.date,
              expiryType: check.type,
              daysUntilExpiry: urgencyData.daysUntilExpiry,
              urgencyLevel: urgencyData.level,
              urgencyDescription: urgencyData.description,
              priority: urgencyData.priority,
              assignedPerson: {
                name: job.assignedPerson?.name || 'Unassigned',
                email: job.assignedPerson?.email
              },
              isServiceCompleted: job.status === 'fully_completed_bra' || job.status === 'completed'
            });
          }
        });
      });

    // Process PersonDetails - CREATE SEPARATE ENTRY FOR EACH EXPIRED DOCUMENT
    expiringPersonDetails
      .filter(pd => pd.jobId)
      .forEach(pd => {
        const expiryChecks = [
          { date: pd.qidExpiry, type: `${pd.personType} QID (${pd.name})` },
          { date: pd.nationalAddressExpiry, type: `${pd.personType} National Address (${pd.name})` },
          { date: pd.passportExpiry, type: `${pd.personType} Passport (${pd.name})` },
        ];

        // Check each document type separately
        expiryChecks.forEach(check => {
          if (check.date && check.date > now && check.date <= twoMonthsFromNow) {
            const urgencyData = calculateUrgencyLevel(check.date, now);
            
            allJobs.push({
              jobId: pd.jobId._id,
              jobNumber: pd.jobId.jobNumber || 'N/A',
              clientName: pd.jobId.clientName || 'Unknown Client',
              companyName: pd.jobId.clientName || 'Unknown Company',
              serviceType: pd.jobId.serviceType || 'Unknown Service',
              status: pd.jobId.status || 'unknown',
              expiryDate: check.date,
              expiryType: check.type,
              daysUntilExpiry: urgencyData.daysUntilExpiry,
              urgencyLevel: urgencyData.level,
              urgencyDescription: urgencyData.description,
              priority: urgencyData.priority,
              assignedPerson: {
                name: pd.jobId.assignedPerson?.name || 'Unassigned',
                email: pd.jobId.assignedPerson?.email
              },
              isServiceCompleted: pd.jobId.status === 'fully_completed_bra' || pd.jobId.status === 'completed'
            });
          }
        });
      });

    // IMPORTANT: Remove duplicates based on jobId + expiryType + expiryDate combination
    // This ensures that the same document with the same expiry date isn't duplicated
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => 
        j.jobId.toString() === job.jobId.toString() && 
        j.expiryType === job.expiryType &&
        j.expiryDate.getTime() === job.expiryDate.getTime()
      )
    );

    // Sort by priority (expired first, then critical, then warning)
    uniqueJobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // If same priority, sort by days until expiry (most urgent first)
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    // REMOVED: No artificial limits - show ALL expired documents
    // Previously was: const finalJobs = uniqueJobs.slice(0, 15);
    // Now we show all expired/expiring documents
    const finalJobs = uniqueJobs;

    const summary = {
      total: finalJobs.length,
      critical: finalJobs.filter(j => j.urgencyLevel === 'critical').length,
      warning: finalJobs.filter(j => j.urgencyLevel === 'warning').length,
      normal: finalJobs.filter(j => j.urgencyLevel === 'normal').length,
      fromCompletedServices: finalJobs.filter(j => j.isServiceCompleted).length,
      // Count of unique jobs (to show how many jobs have expiring docs)
      uniqueJobs: [...new Set(finalJobs.map(j => j.jobId.toString()))].length,
    };

    console.log(`✅ Dashboard result - Showing ${finalJobs.length} future expiring documents from ${summary.uniqueJobs} jobs`);
    console.log("📊 Breakdown by urgency:", {
      critical: summary.critical, 
      warning: summary.warning,
      normal: summary.normal,
      fromCompleted: summary.fromCompletedServices
    });

    res.status(200).json({
      success: true,
      data: finalJobs,
      summary,
      message: `Found ${finalJobs.length} future expiring documents from ${summary.uniqueJobs} unique jobs`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching expiring jobs for dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring jobs for dashboard",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// 3. FIXED: getExpiringJobsStats function
const getExpiringJobsStats = async (req, res) => {
  try {
    console.log("📊 Calculating expiring jobs statistics from CompanyDetails...");

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get active job IDs (exclude only cancelled jobs)
    const activeJobIds = await Job.find({ 
      status: { $nin: ["cancelled"] } // FIXED: Include fully_completed_bra
    }).distinct('_id');

    const [expired, expiringSoon, expiringThisMonth, total] = await Promise.all([
      // Expired documents
      CompanyDetails.countDocuments({
        $or: [
          { expiryDate: { $exists: true, $ne: null, $lt: now } },
          { companyComputerCardExpiry: { $exists: true, $ne: null, $lt: now } },
          { taxCardExpiry: { $exists: true, $ne: null, $lt: now } },
          { crExtractExpiry: { $exists: true, $ne: null, $lt: now } },
          { scopeOfLicenseExpiry: { $exists: true, $ne: null, $lt: now } },
        ],
        jobId: { $in: activeJobIds }
      }),

      // Expiring within 7 days
      CompanyDetails.countDocuments({
        $or: [
          { expiryDate: { $exists: true, $ne: null, $gte: now, $lte: oneWeekFromNow } },
          { companyComputerCardExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneWeekFromNow } },
          { taxCardExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneWeekFromNow } },
          { crExtractExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneWeekFromNow } },
          { scopeOfLicenseExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneWeekFromNow } },
        ],
        jobId: { $in: activeJobIds }
      }),

      // Expiring within 30 days
      CompanyDetails.countDocuments({
        $or: [
          { expiryDate: { $exists: true, $ne: null, $gte: now, $lte: oneMonthFromNow } },
          { companyComputerCardExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneMonthFromNow } },
          { taxCardExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneMonthFromNow } },
          { crExtractExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneMonthFromNow } },
          { scopeOfLicenseExpiry: { $exists: true, $ne: null, $gte: now, $lte: oneMonthFromNow } },
        ],
        jobId: { $in: activeJobIds }
      }),

      // Total active company details with expiry dates
      CompanyDetails.countDocuments({
        $or: [
          { expiryDate: { $exists: true, $ne: null } },
          { companyComputerCardExpiry: { $exists: true, $ne: null } },
          { taxCardExpiry: { $exists: true, $ne: null } },
          { crExtractExpiry: { $exists: true, $ne: null } },
          { scopeOfLicenseExpiry: { $exists: true, $ne: null } },
        ],
        jobId: { $in: activeJobIds }
      }),
    ]);

    // ADDED: Get count of completed services
    const completedServicesWithExpiry = await CompanyDetails.countDocuments({
      $or: [
        { expiryDate: { $exists: true, $ne: null } },
        { companyComputerCardExpiry: { $exists: true, $ne: null } },
        { taxCardExpiry: { $exists: true, $ne: null } },
        { crExtractExpiry: { $exists: true, $ne: null } },
        { scopeOfLicenseExpiry: { $exists: true, $ne: null } },
      ],
      jobId: { 
        $in: await Job.find({ 
          status: { $in: ["completed", "fully_completed_bra"] }
        }).distinct('_id') 
      }
    });

    const stats = {
      expired,
      expiringSoon, // 7 days
      expiringThisMonth, // 30 days
      total,
      fromCompletedServices: completedServicesWithExpiry, // ADDED
      lastUpdated: new Date().toISOString(),
    };

    console.log("📈 Expiring jobs statistics:", stats);

    res.status(200).json({
      success: true,
      data: stats,
      message: "Expiring jobs statistics retrieved successfully (including completed services)",
    });
  } catch (error) {
    console.error("❌ Error calculating expiring jobs statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate expiring jobs statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// 4. FIXED: sendExpiryNotifications function
const sendExpiryNotifications = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    const warningDate = new Date();
    warningDate.setDate(currentDate.getDate() + 60); // 60 days to capture WARNING level (31-60 days)

    const criticallyExpiringCompanyDetails = await CompanyDetails.find({
      $or: [
        { expiryDate: { $exists: true, $ne: null, $lte: warningDate } },
        { companyComputerCardExpiry: { $exists: true, $ne: null, $lte: warningDate } },
        { taxCardExpiry: { $exists: true, $ne: null, $lte: warningDate } },
        { crExtractExpiry: { $exists: true, $ne: null, $lte: warningDate } },
        { scopeOfLicenseExpiry: { $exists: true, $ne: null, $lte: warningDate } },
      ],
    }).populate({
      path: "jobId",
      select: "jobNumber clientName serviceType assignedPerson status",
      populate: { path: "assignedPerson", select: "_id name email" },
      // FIXED: Include fully_completed_bra jobs for notifications
      match: { 
        status: { $nin: ["cancelled"] } // Only exclude cancelled jobs
      }
    });

    let notificationsSent = 0;

    for (const companyDetail of criticallyExpiringCompanyDetails) {
      if (!companyDetail.jobId) continue;

      const job = companyDetail.jobId;
      
      // Find the earliest expiring document
      const expiryDates = [
        { date: companyDetail.expiryDate, type: 'Trade License' },
        { date: companyDetail.companyComputerCardExpiry, type: 'Company Computer Card' },
        { date: companyDetail.taxCardExpiry, type: 'Tax Card' },
        { date: companyDetail.crExtractExpiry, type: 'CR Extract' },
        { date: companyDetail.scopeOfLicenseExpiry, type: 'Scope of License' },
      ]
        .filter(item => item.date && item.date <= warningDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (expiryDates.length === 0) continue;

      const earliestExpiry = expiryDates[0];
      const daysUntilExpiry = Math.ceil(
        (earliestExpiry.date - currentDate) / (1000 * 60 * 60 * 24)
      );

      // MILESTONE NOTIFICATIONS: Only send on specific days (60, 30, 0)
      // Skip if not a milestone day
      const isMilestoneDay = daysUntilExpiry === 60 || daysUntilExpiry === 30 || daysUntilExpiry === 0;
      if (!isMilestoneDay) continue;

      // Calculate urgency level based on milestone
      let urgencyLevel, urgencyLabel, urgencyText;
      if (daysUntilExpiry === 0) {
        urgencyLevel = "expired";
        urgencyLabel = "🔴 EXPIRED";
        urgencyText = "expires today! Immediate action required";
      } else if (daysUntilExpiry === 30) {
        urgencyLevel = "critical";
        urgencyLabel = "🔴 CRITICAL";
        urgencyText = "expires in 30 days";
      } else if (daysUntilExpiry === 60) {
        urgencyLevel = "warning";
        urgencyLabel = "⚠️ WARNING";
        urgencyText = "expires in 60 days";
      } else {
        continue; // Skip non-milestone days
      }

      // ADDED: Include service status in notification
      const serviceStatus = job.status === 'fully_completed_bra' || job.status === 'completed'
        ? ' (Service Completed - Document Renewal Required)'
        : '';

      // Send notification to job parties only
      await notificationService.createJobNotification(
        {
          title: `${urgencyLabel}: Document Expiry Alert`,
          description: `${earliestExpiry.type} for ${job.clientName} (Job #${job.jobNumber}) ${urgencyText}${serviceStatus}. Assigned to: ${job.assignedPerson?.name || 'Unassigned'}`,
          type: "expiry_alert",
          subType: urgencyLevel,
          priority: daysUntilExpiry === 0 ? "high" : daysUntilExpiry === 30 ? "medium" : "normal",
          relatedTo: { model: "Job", id: job._id },
        },
        job,
        null
      );
      notificationsSent++;
    }

    // Also check PersonDetails for expiring documents (QID, Passport, National Address)
    const expiringPersonDetails = await PersonDetails.find({
      $or: [
        { qidExpiry: { $exists: true, $ne: null, $lte: warningDate } },
        { passportExpiry: { $exists: true, $ne: null, $lte: warningDate } },
        { nationalAddressExpiry: { $exists: true, $ne: null, $lte: warningDate } },
      ],
    }).populate({
      path: "jobId",
      select: "jobNumber clientName serviceType assignedPerson status",
      populate: { path: "assignedPerson", select: "_id name email" },
      match: { status: { $nin: ["cancelled"] } }
    });

    for (const person of expiringPersonDetails) {
      if (!person.jobId) continue;

      const job = person.jobId;
      const personTypeLabel = person.personType.charAt(0).toUpperCase() + person.personType.slice(1);

      // Check each expiry field
      const personExpiryDates = [
        { date: person.qidExpiry, type: `${personTypeLabel} QID` },
        { date: person.passportExpiry, type: `${personTypeLabel} Passport` },
        { date: person.nationalAddressExpiry, type: `${personTypeLabel} National Address` },
      ]
        .filter(item => item.date && item.date <= warningDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (personExpiryDates.length === 0) continue;

      const earliestPersonExpiry = personExpiryDates[0];
      const personDaysUntilExpiry = Math.ceil(
        (earliestPersonExpiry.date - currentDate) / (1000 * 60 * 60 * 24)
      );

      // MILESTONE NOTIFICATIONS: Only send on specific days (60, 30, 0)
      const isPersonMilestoneDay = personDaysUntilExpiry === 60 || personDaysUntilExpiry === 30 || personDaysUntilExpiry === 0;
      if (!isPersonMilestoneDay) continue;

      // Calculate urgency level based on milestone
      let personUrgencyLevel, personUrgencyLabel, personUrgencyText;
      if (personDaysUntilExpiry === 0) {
        personUrgencyLevel = "expired";
        personUrgencyLabel = "🔴 EXPIRED";
        personUrgencyText = "expires today! Immediate action required";
      } else if (personDaysUntilExpiry === 30) {
        personUrgencyLevel = "critical";
        personUrgencyLabel = "🔴 CRITICAL";
        personUrgencyText = "expires in 30 days";
      } else if (personDaysUntilExpiry === 60) {
        personUrgencyLevel = "warning";
        personUrgencyLabel = "⚠️ WARNING";
        personUrgencyText = "expires in 60 days";
      } else {
        continue; // Skip non-milestone days
      }

      const personName = person.name || 'Unknown';

      // Send notification to job parties only
      await notificationService.createJobNotification(
        {
          title: `${personUrgencyLabel}: ${earliestPersonExpiry.type} Expiry`,
          description: `${earliestPersonExpiry.type} for ${personName} (${job.clientName} - Job #${job.jobNumber}) ${personUrgencyText}. Assigned to: ${job.assignedPerson?.name || 'Unassigned'}`,
          type: "expiry_alert",
          subType: personUrgencyLevel,
          priority: personDaysUntilExpiry === 0 ? "high" : personDaysUntilExpiry === 30 ? "medium" : "normal",
          relatedTo: { model: "Job", id: job._id },
        },
        job,
        null
      );
      notificationsSent++;
    }

    const result = {
      message: `Expiry notifications sent successfully (including completed services)`,
      notificationsSent,
      jobsChecked: criticallyExpiringCompanyDetails.length + expiringPersonDetails.length,
    };

    // Handle both API calls (with res) and cron job calls (without res)
    if (res) {
      res.status(200).json(result);
    }
    return result;

  } catch (error) {
    console.error('Error sending expiry notifications:', error);
    if (res) {
      res.status(500).json({
        message: 'Failed to send expiry notifications',
        error: error.message,
      });
    }
    return { notificationsSent: 0, error: error.message };
  }
});




/**
 * Fallback function to create mock expiring jobs if database is empty
 * This ensures the dashboard doesn't break when there's no data
 */
const createMockExpiringJobs = (count = 5) => {
  const mockJobs = [];
  const serviceTypes = ['Company Registration', 'Tax Filing', 'Business License', 'Legal Consultation', 'Audit Service'];
  const clientNames = ['ABC Corp', 'XYZ Ltd', 'Tech Solutions Inc', 'Global Services', 'Innovation Hub'];
  
  for (let i = 0; i < count; i++) {
    const daysFromNow = Math.floor(Math.random() * 60) - 10; // -10 to +50 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysFromNow);
    
    let urgencyLevel, urgencyDescription;
    if (daysFromNow < 0) {
      urgencyLevel = "expired";
      urgencyDescription = `Expired ${Math.abs(daysFromNow)} day${Math.abs(daysFromNow) !== 1 ? 's' : ''} ago`;
    } else if (daysFromNow <= 7) {
      urgencyLevel = "critical";
      urgencyDescription = `Expires in ${daysFromNow} day${daysFromNow !== 1 ? 's' : ''}`;
    } else if (daysFromNow <= 30) {
      urgencyLevel = "warning";
      urgencyDescription = `Expires in ${daysFromNow} day${daysFromNow !== 1 ? 's' : ''}`;
    } else {
      urgencyLevel = "normal";
      urgencyDescription = `Expires in ${daysFromNow} day${daysFromNow !== 1 ? 's' : ''}`;
    }
    
    mockJobs.push({
      jobId: `mock-${i}`,
      jobNumber: `MOCK-${1000 + i}`,
      clientName: clientNames[i % clientNames.length],
      serviceType: serviceTypes[i % serviceTypes.length],
      status: 'pending',
      expiryDate: expiryDate,
      daysUntilExpiry: daysFromNow,
      urgencyLevel,
      urgencyDescription,
      assignedPerson: {
        name: 'Demo User'
      }
    });
  }
  
  return mockJobs.sort((a, b) => {
    const urgencyOrder = { expired: 0, critical: 1, warning: 2, normal: 3 };
    return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
  });
};

/**
 * Enhanced expiring jobs function with fallback
 */
const getExpiringJobsWithFallback = async (req, res) => {
  try {
    console.log("📊 Fetching expiring jobs with fallback...");

    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Try to get real jobs first
    let expiringJobs = [];
    
    try {
      expiringJobs = await Job.find({
        expiryDate: { 
          $exists: true, 
          $ne: null,
          $lte: oneMonthFromNow
        },
        status: { 
          $nin: ['completed', 'fully_completed_bra', 'cancelled'] 
        }
      })
      .populate('assignedPerson', 'name')
      .populate('clientId', 'name companyName')
      .sort({ expiryDate: 1 })
      .limit(10)
      .lean();
    } catch (dbError) {
      console.warn("Database query failed, using fallback:", dbError.message);
      expiringJobs = [];
    }

    let processedJobs = [];

    if (expiringJobs.length > 0) {
      // Process real jobs
      processedJobs = expiringJobs
        .filter(job => job && job.expiryDate)
        .map(job => {
          const expiryDate = new Date(job.expiryDate);
          const diffTime = expiryDate - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let urgencyLevel, urgencyDescription;
          if (diffDays < 0) {
            const daysOverdue = Math.abs(diffDays);
            urgencyLevel = "expired";
            urgencyDescription = `Expired ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`;
          } else if (diffDays <= 7) {
            urgencyLevel = "critical";
            urgencyDescription = `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
          } else if (diffDays <= 30) {
            urgencyLevel = "warning";
            urgencyDescription = `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
          } else {
            urgencyLevel = "normal";
            urgencyDescription = `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
          }

          const clientData = job.clientId || {};
          const clientName = clientData.name || 
                           clientData.companyName || 
                           job.clientName || 
                           'Unknown Client';

          return {
            jobId: job._id,
            jobNumber: job.jobNumber || 'N/A',
            clientName,
            serviceType: job.serviceType || 'Unknown Service',
            status: job.status,
            expiryDate: job.expiryDate,
            daysUntilExpiry: diffDays,
            urgencyLevel,
            urgencyDescription,
            assignedPerson: {
              name: job.assignedPerson?.name || 'Unassigned'
            }
          };
        });
    } else {
      // Use mock data if no real jobs found
      console.log("No expiring jobs found, generating mock data for demonstration");
      processedJobs = createMockExpiringJobs(5);
    }

    res.status(200).json({
      success: true,
      data: processedJobs,
      message: `Found ${processedJobs.length} expiring jobs for dashboard`,
      timestamp: new Date().toISOString(),
      isMockData: expiringJobs.length === 0
    });

  } catch (error) {
    console.error("❌ Error in expiring jobs with fallback:", error);
    
    // Last resort: return mock data
    const mockJobs = createMockExpiringJobs(3);
    
    res.status(200).json({
      success: true,
      data: mockJobs,
      message: "Using demo data due to system error",
      timestamp: new Date().toISOString(),
      isMockData: true,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * Update job expiry date
 * Allows authorized users to extend or modify expiry dates
 */
const updateJobExpiryDate = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { expiryDate, reason } = req.body;

    console.log(`📝 Updating expiry date for job ${jobId}`);

    // Check permissions
    if (!req.user || !req.user.permissions.includes('operationManagement')) {
      return res.status(403).json({
        message: "Access denied. Operation management permission required."
      });
    }

    // Validate inputs
    if (!expiryDate) {
      return res.status(400).json({
        message: "Expiry date is required"
      });
    }

    const newExpiryDate = new Date(expiryDate);
    if (isNaN(newExpiryDate.getTime())) {
      return res.status(400).json({
        message: "Invalid expiry date format"
      });
    }

    // Find and update the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    const oldExpiryDate = job.expiryDate;
    job.expiryDate = newExpiryDate;
    job.expiryUpdateReason = reason || 'Updated via operations dashboard';
    job.expiryUpdatedBy = req.user._id;
    job.expiryUpdatedAt = new Date();

    await job.save();

    console.log(`✅ Updated expiry date for job ${jobId} from ${oldExpiryDate} to ${newExpiryDate}`);

    res.status(200).json({
      success: true,
      message: "Job expiry date updated successfully",
      data: {
        jobId: job._id,
        jobNumber: job.jobNumber,
        oldExpiryDate,
        newExpiryDate,
        updatedBy: req.user.name,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Error updating job expiry date:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job expiry date",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// FIXED: exportExpiringJobs function to show ALL expired documents per job
// Replace the existing exportExpiringJobs function in operationController.js

const exportExpiringJobs = asyncHandler(async (req, res) => {
  try {
    const { urgency, search } = req.query;
    console.log("📊 Exporting future expiring documents to Excel (2 months, excluding expired)");
    console.log(`📋 Filters - Urgency: ${urgency || 'all'}, Search: ${search || 'none'}`);

    const currentDate = new Date();
    const twoMonthsFromNow = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Get CompanyDetails with expiring documents (excluding expired)
    const expiringCompanyDetails = await CompanyDetails.find({
      $or: [
        { expiryDate: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
        { companyComputerCardExpiry: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
        { taxCardExpiry: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
        { crExtractExpiry: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
        { scopeOfLicenseExpiry: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
      ],
    })
    .populate({
      path: "jobId",
      select: "jobNumber clientName serviceType status gmail createdAt assignedPerson",
      populate: { path: "assignedPerson", select: "name email" },
      match: { 
        status: { $nin: ['cancelled'] } // Only exclude cancelled jobs
      }
    })
    .lean();

    // Get PersonDetails with expiring documents (excluding expired)
    const expiringPersonDetails = await PersonDetails.find({
      $or: [
        { qidExpiry: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
        { nationalAddressExpiry: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
        { passportExpiry: { $exists: true, $ne: null, $gt: currentDate, $lte: twoMonthsFromNow } },
      ],
    })
    .populate({
      path: "jobId",
      select: "jobNumber clientName serviceType status gmail createdAt assignedPerson",
      populate: { path: "assignedPerson", select: "name email" },
      match: { 
        status: { $nin: ['cancelled'] }
      }
    })
    .lean();

    console.log(`📋 Found ${expiringCompanyDetails.length} company details + ${expiringPersonDetails.length} person details for export`);

    const allExpiringJobs = [];

    // Process CompanyDetails - CREATE SEPARATE ENTRY FOR EACH EXPIRED DOCUMENT
    expiringCompanyDetails
      .filter(detail => detail && detail.jobId)
      .forEach(detail => {
        const job = detail.jobId;

        // Check each document type separately and create individual entries
        const documentChecks = [
          {
            date: detail.expiryDate,
            type: 'Trade License',
            hasDocument: detail.expiryDate
          },
          { 
            date: detail.companyComputerCardExpiry, 
            type: 'Company Computer Card',
            hasDocument: detail.companyComputerCard 
          },
          { 
            date: detail.taxCardExpiry, 
            type: 'Tax Card',
            hasDocument: detail.taxCard 
          },
          { 
            date: detail.crExtractExpiry, 
            type: 'CR Extract',
            hasDocument: Array.isArray(detail.crExtract) && detail.crExtract.length > 0 
          },
          { 
            date: detail.scopeOfLicenseExpiry, 
            type: 'Scope of License',
            hasDocument: detail.scopeOfLicense 
          },
        ];

        // Process each document type individually
        documentChecks.forEach(check => {
          // Include if expiry date exists, is within range, and NOT already expired
          if (check.date && check.date > currentDate && check.date <= twoMonthsFromNow) {
            const urgencyData = calculateUrgencyLevel(check.date, currentDate);

            allExpiringJobs.push({
              jobNumber: job.jobNumber || 'N/A',
              clientName: job.clientName || 'Unknown Client',
              companyName: detail.companyName || job.clientName || 'Unknown Company',
              serviceType: job.serviceType || 'Unknown Service',
              status: job.status || 'unknown',
              gmail: job.gmail || '',
              expiryDate: check.date,
              expiryType: check.type,
              daysUntilExpiry: urgencyData.daysUntilExpiry,
              urgencyLevel: urgencyData.level.toUpperCase(),
              urgencyDescription: urgencyData.description,
              assignedPersonName: job.assignedPerson?.name || 'Unassigned',
              assignedPersonEmail: job.assignedPerson?.email || '',
              createdAt: job.createdAt,
              hasDocumentFile: check.hasDocument ? 'Yes' : 'No',
              isServiceCompleted: job.status === 'fully_completed_bra' || job.status === 'completed' ? 'Yes' : 'No'
            });
          }
        });
      });

    // Process PersonDetails - CREATE SEPARATE ENTRY FOR EACH EXPIRED DOCUMENT
    expiringPersonDetails
      .filter(pd => pd && pd.jobId)
      .forEach(pd => {
        const documentChecks = [
          { 
            date: pd.qidExpiry, 
            type: `${pd.personType} QID (${pd.name})`,
            hasDocument: pd.qidDoc 
          },
          { 
            date: pd.nationalAddressExpiry, 
            type: `${pd.personType} National Address (${pd.name})`,
            hasDocument: pd.nationalAddressDoc 
          },
          { 
            date: pd.passportExpiry, 
            type: `${pd.personType} Passport (${pd.name})`,
            hasDocument: pd.passportDoc 
          },
        ];

        // Process each document type individually
        documentChecks.forEach(check => {
          if (check.date && check.date > currentDate && check.date <= twoMonthsFromNow) {
            const urgencyData = calculateUrgencyLevel(check.date, currentDate);

            allExpiringJobs.push({
              jobNumber: pd.jobId.jobNumber || 'N/A',
              clientName: pd.jobId.clientName || 'Unknown Client',
              companyName: pd.jobId.clientName || 'Unknown Company',
              serviceType: pd.jobId.serviceType || 'Unknown Service',
              status: pd.jobId.status || 'unknown',
              gmail: pd.jobId.gmail || '',
              expiryDate: check.date,
              expiryType: check.type,
              daysUntilExpiry: urgencyData.daysUntilExpiry,
              urgencyLevel: urgencyData.level.toUpperCase(),
              urgencyDescription: urgencyData.description,
              assignedPersonName: pd.jobId.assignedPerson?.name || 'Unassigned',
              assignedPersonEmail: pd.jobId.assignedPerson?.email || '',
              createdAt: pd.jobId.createdAt,
              hasDocumentFile: check.hasDocument ? 'Yes' : 'No',
              isServiceCompleted: pd.jobId.status === 'fully_completed_bra' || pd.jobId.status === 'completed' ? 'Yes' : 'No'
            });
          }
        });
      });

    // Remove duplicates based on jobId + expiryType + expiryDate combination
    const uniqueExpiringJobs = allExpiringJobs.filter((job, index, self) =>
      index === self.findIndex(j => 
        j.jobNumber === job.jobNumber && 
        j.expiryType === job.expiryType &&
        j.expiryDate.getTime() === job.expiryDate.getTime()
      )
    );

    // Sort by urgency level first, then by days until expiry
    uniqueExpiringJobs.sort((a, b) => {
      const urgencyOrder = { EXPIRED: 0, CRITICAL: 1, WARNING: 2, NORMAL: 3 };

      if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
        return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
      }

      // If same urgency, sort by days until expiry (most urgent first)
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    // Apply filters from query parameters
    let filteredJobs = [...uniqueExpiringJobs];

    // Filter by urgency level if specified
    if (urgency && urgency !== 'all') {
      const urgencyUpper = urgency.toUpperCase();
      filteredJobs = filteredJobs.filter(job => job.urgencyLevel === urgencyUpper);
      console.log(`📋 After urgency filter (${urgency}): ${filteredJobs.length} documents`);
    }

    // Filter by search term if specified
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredJobs = filteredJobs.filter(job =>
        (job.clientName && job.clientName.toLowerCase().includes(searchLower)) ||
        (job.companyName && job.companyName.toLowerCase().includes(searchLower)) ||
        (job.jobNumber && job.jobNumber.toLowerCase().includes(searchLower)) ||
        (job.serviceType && job.serviceType.toLowerCase().includes(searchLower)) ||
        (job.expiryType && job.expiryType.toLowerCase().includes(searchLower))
      );
      console.log(`📋 After search filter (${search}): ${filteredJobs.length} documents`);
    }

    console.log(`📈 Exporting ${filteredJobs.length} individual document expiries (filtered from ${uniqueExpiringJobs.length} total)`);

    // Calculate statistics for summary (based on filtered data)
    const stats = {
      total: filteredJobs.length,
      expired: filteredJobs.filter(j => j.urgencyLevel === 'EXPIRED').length,
      critical: filteredJobs.filter(j => j.urgencyLevel === 'CRITICAL').length,
      warning: filteredJobs.filter(j => j.urgencyLevel === 'WARNING').length,
      normal: filteredJobs.filter(j => j.urgencyLevel === 'NORMAL').length,
      uniqueJobs: [...new Set(filteredJobs.map(j => j.jobNumber))].length,
      fromCompletedServices: filteredJobs.filter(j => j.isServiceCompleted === 'Yes').length,
      filterApplied: urgency && urgency !== 'all' ? urgency.toUpperCase() : 'ALL'
    };

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Expiring Documents');

    // ENHANCED: Better column structure
    worksheet.columns = [
      { header: 'Job Number', key: 'jobNumber', width: 15 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Company Name', key: 'companyName', width: 25 },
      { header: 'Service Type', key: 'serviceType', width: 20 },
      { header: 'Job Status', key: 'status', width: 15 },
      { header: 'Service Completed', key: 'isServiceCompleted', width: 18 },
      { header: 'Email', key: 'gmail', width: 30 },
      { header: 'Document Type', key: 'expiryType', width: 25 }, // Wider for better readability
      { header: 'Expiry Date', key: 'expiryDate', width: 15 },
      { header: 'Days Until Expiry', key: 'daysUntilExpiry', width: 18 },
      { header: 'Urgency Level', key: 'urgencyLevel', width: 15 },
      { header: 'Urgency Description', key: 'urgencyDescription', width: 25 },
      { header: 'Has Document File', key: 'hasDocumentFile', width: 18 },
      { header: 'Assigned To', key: 'assignedPersonName', width: 20 },
      { header: 'Assigned Email', key: 'assignedPersonEmail', width: 30 },
      { header: 'Job Created Date', key: 'createdAt', width: 18 },
    ];

    // Style the header row
    worksheet.getRow(2).font = { bold: true, size: 11 };
    worksheet.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' } // Blue header
    };
    worksheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text

    // Add summary row at the top
    const filterLabel = stats.filterApplied !== 'ALL' ? ` (Filtered: ${stats.filterApplied})` : '';
    const summaryRow = worksheet.insertRow(1, [
      `EXPIRING DOCUMENTS REPORT${filterLabel}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Total Documents: ${stats.total}`,
      `From ${stats.uniqueJobs} Jobs`,
      `Expired: ${stats.expired}`,
      `Critical: ${stats.critical}`,
      `Warning: ${stats.warning}`,
      `Completed Services: ${stats.fromCompletedServices}`,
    ]);
    
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5E8D4' } // Light green
    };

    // Merge cells for the summary
    worksheet.mergeCells('A1:P1');

    // Add data rows with enhanced formatting (use filtered data)
filteredJobs.forEach((job, index) => {
  const row = worksheet.addRow({
    ...job,
    expiryDate: job.expiryDate.toLocaleDateString(),
    createdAt: job.createdAt.toLocaleDateString(),
  });

  // CORRECTED: Better color scheme with visible WARNING background
  let fillColor;
  let fontColor = { argb: 'FF000000' }; // Default black

  switch (job.urgencyLevel) {
    case 'EXPIRED':
      fillColor = 'FFFFE6E6'; // Light red - more visible
      fontColor = { argb: 'FF8B0000' }; // Dark red text
      break;
    case 'CRITICAL':
      fillColor = 'FFFFD4B3'; // Light orange - more saturated
      fontColor = { argb: 'FFCC4400' }; // Dark orange text
      break;
    case 'WARNING':
      fillColor = 'FFFFFF99'; // FIXED: Better yellow - more visible than before
      fontColor = { argb: 'FF996600' }; // FIXED: Dark yellow/brown text for better contrast
      break;
    default:
      fillColor = 'FFE6F7E6'; // Light green
      fontColor = { argb: 'FF006400' }; // Dark green text
  }

  // Apply the background color
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: fillColor }
  };

  // Apply font colors to important columns
  row.getCell('urgencyLevel').font = { bold: true, color: fontColor };
  row.getCell('daysUntilExpiry').font = { bold: true, color: fontColor };
  row.getCell('urgencyDescription').font = { bold: true, color: fontColor }; // ADDED: Color the description too
  
  // Highlight completed services
  if (job.isServiceCompleted === 'Yes') {
    row.getCell('isServiceCompleted').font = { bold: true, color: { argb: 'FF0066CC' } };
  }

  // Add conditional formatting for document files
  if (job.hasDocumentFile === 'No') {
    row.getCell('hasDocumentFile').font = { bold: true, color: { argb: 'FFCC0000' } };
  }

  // ADDED: Apply borders for better visibility
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
  });
});

    // Add a separator row
    worksheet.insertRow(2, []);

    // Apply borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) { // Skip summary and separator rows
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Add autofilter to headers
    worksheet.autoFilter = 'A3:P3';

    // Add a legend at the bottom
const lastRow = worksheet.rowCount + 2;
worksheet.addRow([]);
worksheet.addRow(['COLOR LEGEND:']);

// FIXED: Create colored legend cells
const legendRow = worksheet.addRow(['', 'EXPIRED = Light Red', 'CRITICAL = Light Orange', 'WARNING = Bright Yellow', 'NORMAL = Light Green']);

// Apply colors to legend
legendRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
legendRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD4B3' } };
legendRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Fixed WARNING color
legendRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7E6' } };

// Make legend text bold
legendRow.eachCell((cell, colNumber) => {
  if (colNumber > 1) {
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
});

worksheet.getRow(lastRow + 1).font = { bold: true };

    console.log(`✅ Excel export ready with ${uniqueExpiringJobs.length} document entries from ${stats.uniqueJobs} unique jobs`);

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=all-expiring-documents-${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Error exporting expiring documents:', error);
    res.status(500).json({
      message: 'Failed to export expiring documents',
      error: error.message,
    });
  }
});


const deleteEngagementLetter = asyncHandler(async (req, res) => {
  const { jobId, letterId } = req.params;

  try {
    console.log(`Starting engagement letter deletion for job ${jobId}, letter ${letterId}`);
    
    // Check if job exists and if user has permission to access it
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job not found: ${jobId}`);
      res.status(404);
      throw new Error("Job not found");
    }

    // Get the client's Gmail address
    const gmail = job.gmail;

    // Check if user is authorized
    const isAdmin = req.user.role?.name === "admin";
    const hasCompliancePermission =
      req.user.role?.permissions?.complianceManagement;
    const hasOperationPermission =
      req.user.role?.permissions?.operationManagement;
    const isAssignedPerson =
      job.assignedPerson?.toString() === req.user._id.toString();

    if (
      !isAdmin &&
      !hasCompliancePermission &&
      !hasOperationPermission &&
      !isAssignedPerson
    ) {
      console.log(`User ${req.user._id} not authorized to update job ${jobId}`);
      res.status(403);
      throw new Error("You are not authorized to update this job");
    }

    // Find company details for current job
    let companyDetails = await CompanyDetails.findOne({ jobId });
    if (!companyDetails || !Array.isArray(companyDetails.engagementLetters)) {
      console.log(`No engagement letters found for job ${jobId}`);
      res.status(404);
      throw new Error("No engagement letters found for this job");
    }

    // Find the engagement letter to delete
    const letterIndex = companyDetails.engagementLetters.findIndex(
      letter => letter._id.toString() === letterId
    );

    if (letterIndex === -1) {
      console.log(`Engagement letter not found: ${letterId}`);
      res.status(404);
      throw new Error("Engagement letter not found");
    }

    // Get the letter details before deletion for logging
    const deletedLetter = companyDetails.engagementLetters[letterIndex];
    console.log(`Deleting engagement letter: ${deletedLetter.fileName}`);

    // Remove the engagement letter from the array
    companyDetails.engagementLetters.splice(letterIndex, 1);
    companyDetails.updatedBy = req.user._id;

    if (!companyDetails.documentHistory) companyDetails.documentHistory = [];
    companyDetails.documentHistory.push({
      action: "delete",
      documentType: "Engagement Letter",
      fileName: deletedLetter.fileName,
      fileUrl: deletedLetter.fileUrl,
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    await companyDetails.save();
    
    console.log(`Engagement letter deleted from job ${jobId}`);

    // Add a timeline entry for the job
    job.timeline.push({
      status: job.status,
      description: `Engagement letter "${deletedLetter.fileName}" deleted`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    // Now delete from all other jobs for the same client
    try {
      // Find the client by Gmail
      const client = await Client.findOne({ gmail });
      if (client) {
        // Find all jobs for this client (except the current one)
        const otherClientJobs = await Job.find({ 
          clientId: client._id,
          _id: { $ne: jobId }
        });
        
        if (otherClientJobs && otherClientJobs.length > 0) {
          console.log(`Found ${otherClientJobs.length} other jobs for client ${gmail}`);
          
          // Remove the same engagement letter from all other jobs
          for (const otherJob of otherClientJobs) {
            let otherCompanyDetails = await CompanyDetails.findOne({ jobId: otherJob._id });
            
            if (otherCompanyDetails && Array.isArray(otherCompanyDetails.engagementLetters)) {
              // Find and remove the same letter (matching by fileUrl)
              const otherLetterIndex = otherCompanyDetails.engagementLetters.findIndex(
                letter => letter.fileUrl === deletedLetter.fileUrl
              );
              
              if (otherLetterIndex !== -1) {
                otherCompanyDetails.engagementLetters.splice(otherLetterIndex, 1);
                otherCompanyDetails.updatedBy = req.user._id;
                await otherCompanyDetails.save();
                
                // Add timeline entry for the other job
                otherJob.timeline.push({
                  status: otherJob.status,
                  description: `Engagement letter "${deletedLetter.fileName}" deleted from another job`,
                  timestamp: new Date(),
                  updatedBy: req.user._id,
                });
                await otherJob.save();
                
                console.log(`Deleted engagement letter from job ${otherJob._id}`);
              }
            }
          }
        }
      }
    } catch (syncError) {
      // Log error but don't fail the request - the primary deletion was successful
      console.error(`Error syncing engagement letter deletion: ${syncError.message}`);
    }

    // Create notification for engagement letter deletion
    try {
      await notificationService.createJobNotification(
        {
          title: "Engagement Letter Deleted",
          description: `Engagement letter "${deletedLetter.fileName}" was deleted from ${job.clientName}'s ${job.serviceType} job.`,
          type: "job",
          relatedTo: { model: "Job", id: job._id },
        },
        job,
        req.user._id
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    res.status(200).json({
      message: "Engagement letter deleted successfully",
      deletedLetter: {
        id: deletedLetter._id,
        fileName: deletedLetter.fileName,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(`Error in deleteEngagementLetter: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to delete engagement letter",
        error: error.message,
      });
    }
  }
});

const replaceEngagementLetter = asyncHandler(async (req, res) => {
  const { jobId, letterId } = req.params;

  try {
    console.log(`Starting engagement letter replacement for job ${jobId}, letter ${letterId}`);

    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    const isAdmin = req.user.role?.name === "admin";
    const hasCompliancePermission = req.user.role?.permissions?.complianceManagement;
    const hasOperationPermission = req.user.role?.permissions?.operationManagement;
    const isAssignedPerson = job.assignedPerson?.toString() === req.user._id.toString();

    if (!isAdmin && !hasCompliancePermission && !hasOperationPermission && !isAssignedPerson) {
      res.status(403);
      throw new Error("You are not authorized to update this job");
    }

    let companyDetails = await CompanyDetails.findOne({ jobId });
    if (!companyDetails || !Array.isArray(companyDetails.engagementLetters)) {
      res.status(404);
      throw new Error("No engagement letters found for this job");
    }

    const letterIndex = companyDetails.engagementLetters.findIndex(
      letter => letter._id.toString() === letterId
    );

    if (letterIndex === -1) {
      res.status(404);
      throw new Error("Engagement letter not found");
    }

    const oldLetter = companyDetails.engagementLetters[letterIndex];
    console.log(`Replacing engagement letter: ${oldLetter.fileName}`);

    await archiveDocument({
      clientId: job.clientId,
      jobId: job._id,
      documentType: "engagement_letter",
      sourceType: "engagement_letter",
      fileUrl: oldLetter.fileUrl,
      fileName: oldLetter.fileName,
      archivedBy: req.user._id,
      reason: "replaced",
      originalUploadedAt: oldLetter.uploadedAt,
    });

    const uploadResult = await safeCloudinaryUpload(req.file.path, {
      folder: `engagement-letters/${jobId}`,
      resource_type: "auto",
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    companyDetails.engagementLetters[letterIndex] = {
      _id: oldLetter._id,
      fileUrl: uploadResult.url,
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      description: oldLetter.description,
    };

    companyDetails.updatedBy = req.user._id;
    await companyDetails.save();

    job.timeline.push({
      status: job.status,
      description: `Engagement letter "${oldLetter.fileName}" replaced with "${req.file.originalname}"`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    console.log(`Engagement letter replaced successfully`);

    res.status(200).json({
      message: "Engagement letter replaced successfully",
      engagementLetters: companyDetails.engagementLetters,
    });

  } catch (error) {
    console.error(`Error in replaceEngagementLetter: ${error.message}`);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to replace engagement letter",
        error: error.message,
      });
    }
  }
});

// Delete company document
const deleteCompanyDocument = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { documentType, documentIndex } = req.body;

  try {
    console.log(`🗑️ Deleting company document: ${documentType} for job ${jobId}`);

    const companyDetails = await CompanyDetails.findOne({ jobId });
    if (!companyDetails) {
      return res.status(404).json({ message: "Company details not found" });
    }

    // Handle array documents (crExtract, companyMemo, engagementLetters)
    if (['crExtract', 'companyMemo', 'engagementLetters'].includes(documentType)) {
      if (documentIndex === undefined || documentIndex === null) {
        return res.status(400).json({ message: "Document index required for array documents" });
      }

      const documentArray = companyDetails[documentType];
      if (!Array.isArray(documentArray) || documentIndex >= documentArray.length) {
        return res.status(400).json({ message: "Invalid document index" });
      }

      // Remove the document from array
      documentArray.splice(documentIndex, 1);
      companyDetails[documentType] = documentArray;
    } else {
      // Handle single documents
      if (!companyDetails[documentType]) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Set the document field to null
      companyDetails[documentType] = null;
      
      // Also clear expiry date if applicable
      const expiryField = `${documentType}Expiry`;
      if (companyDetails[expiryField] !== undefined) {
        companyDetails[expiryField] = null;
      }
    }

    await companyDetails.save();

    const job = await Job.findById(jobId);
    if (job) {
      job.timeline.push({
        status: job.status,
        description: `Company document "${documentType}" deleted`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await job.save();
    }

    console.log(`✅ Successfully deleted ${documentType} document`);
    res.status(200).json({
      success: true,
      message: `${documentType} document deleted successfully`,
      companyDetails
    });
  } catch (error) {
    console.error("Error deleting company document:", error);
    res.status(500).json({
      message: "Failed to delete document",
      error: error.message
    });
  }
});

// Delete person document
const deletePersonDocument = asyncHandler(async (req, res) => {
  const { jobId, personType, personId } = req.params;
  const { documentType } = req.body;

  try {
    console.log(`🗑️ Deleting ${personType} document: ${documentType} for person ${personId}`);

    const personDetails = await PersonDetails.findOne({
      _id: personId,
      jobId,
      personType
    });

    if (!personDetails) {
      return res.status(404).json({ message: "Person details not found" });
    }

    // Set the document field to null
    if (!personDetails[documentType]) {
      return res.status(404).json({ message: "Document not found" });
    }

    personDetails[documentType] = null;

    // Also clear expiry date if applicable
    const expiryField = `${documentType.replace('Doc', '')}Expiry`;
    if (personDetails[expiryField] !== undefined) {
      personDetails[expiryField] = null;
    }

    await personDetails.save();

    const job = await Job.findById(jobId);
    if (job) {
      job.timeline.push({
        status: job.status,
        description: `${personType.charAt(0).toUpperCase() + personType.slice(1)} document "${documentType}" deleted`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await job.save();
    }

    console.log(`✅ Successfully deleted ${documentType} document for ${personType}`);
    res.status(200).json({
      success: true,
      message: `${documentType} document deleted successfully`,
      personDetails
    });
  } catch (error) {
    console.error("Error deleting person document:", error);
    res.status(500).json({
      message: "Failed to delete document",
      error: error.message
    });
  }
});

const replacePersonDocument = asyncHandler(async (req, res) => {
  const { jobId, personType, personId, documentType } = req.params;

  try {
    console.log(`🔄 Replacing ${documentType} for ${personType} ${personId} in job ${jobId}`);

    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    const isAdmin = req.user.role?.name === "admin";
    const hasCompliancePermission = req.user.role?.permissions?.complianceManagement;
    const hasOperationPermission = req.user.role?.permissions?.operationManagement;
    const isAssignedPerson = job.assignedPerson?.toString() === req.user._id.toString();

    if (!isAdmin && !hasCompliancePermission && !hasOperationPermission && !isAssignedPerson) {
      res.status(403);
      throw new Error("You are not authorized to update this job");
    }

    const personDetails = await PersonDetails.findOne({
      _id: personId,
      jobId,
      personType
    });

    if (!personDetails) {
      res.status(404);
      throw new Error("Person details not found");
    }

    const oldDocUrl = personDetails[documentType];

    if (oldDocUrl && typeof oldDocUrl === 'string') {
      try {
        const documentTypeLabels = {
          qidDoc: 'QID Document',
          passportDoc: 'Passport Document',
          nationalAddressDoc: 'National Address Document',
          cv: 'CV'
        };

        await Archive.create({
          clientId: job.clientId,
          jobId: job._id,
          documentType: documentType === 'cv' ? 'other_document' : 'id_document',
          sourceType: personType,
          fileUrl: oldDocUrl,
          fileName: documentTypeLabels[documentType] || documentType,
          personName: personDetails.name,
          personId: personDetails._id,
          title: `${personDetails.name} - ${documentTypeLabels[documentType] || documentType}`,
          description: `Archived ${personType} ${documentTypeLabels[documentType] || documentType} - replaced`,
          archivedBy: req.user._id,
          reason: "replaced",
          metadata: {
            personType: personType,
            documentField: documentType
          }
        });
        console.log(`📦 Archived old ${documentType} for ${personType}`);
      } catch (archiveError) {
        console.error("Error archiving person document:", archiveError);
      }
    }

    const uploadResult = await safeCloudinaryUpload(req.file.path, {
      folder: `person-documents/${personType}/${documentType}`,
      resource_type: "auto",
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    personDetails[documentType] = uploadResult.url;
    await personDetails.save();

    job.timeline.push({
      status: job.status,
      description: `${personType.charAt(0).toUpperCase() + personType.slice(1)} ${documentType} replaced for ${personDetails.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();

    console.log(`✅ Successfully replaced ${documentType} for ${personType}`);
    res.status(200).json({
      success: true,
      message: `${documentType} replaced successfully`,
      personDetails,
      newDocumentUrl: uploadResult.url
    });

  } catch (error) {
    console.error(`Error replacing person document: ${error.message}`);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to replace document",
        error: error.message
      });
    }
  }
});

// Delete KYC document
const deleteKycSignedDocument = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { documentIndex } = req.body;

  try {
    console.log(`🗑️ Request body:`, req.body);
    console.log(`🗑️ Deleting KYC signed document at index ${documentIndex} for job ${jobId}`);

    const kycDocument = await KycDocument.findOne({ jobId });
    if (!kycDocument) {
      return res.status(404).json({ message: "KYC documents not found" });
    }

    if (documentIndex === undefined || documentIndex === null || 
        documentIndex >= kycDocument.documents.length) {
      console.log(`❌ Invalid index: ${documentIndex}, array length: ${kycDocument.documents.length}`);
      return res.status(400).json({ message: "Invalid document index" });
    }

    // Remove the document from array
    kycDocument.documents.splice(documentIndex, 1);
    await kycDocument.save();

    console.log(`✅ Successfully deleted KYC document at index ${documentIndex}`);
    res.status(200).json({
      success: true,
      message: "KYC document deleted successfully",
      kycDocument
    });
  } catch (error) {
    console.error("Error deleting KYC document:", error);
    res.status(500).json({
      message: "Failed to delete document",
      error: error.message
    });
  }
});

// Get job data by email for auto-fill functionality
const getJobDataByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  
  try {
    console.log(`📧 Looking up jobs for email: ${email}`);
    
    // Find the most recent job for this email (any status except rejected/cancelled)
    const latestJob = await Job.findOne({ 
      gmail: email, 
      status: { 
        $nin: ['rejected', 'cancelled'] // Exclude only rejected and cancelled jobs
      }
    })
    .populate('clientId')
    .sort({ createdAt: -1 })
    .lean();

    if (!latestJob) {
      return res.status(404).json({ 
        message: 'No previous job found for this email',
        found: false 
      });
    }

    console.log(`✅ Found job: ${latestJob.jobNumber}`);

    // Get company details for this job
    const companyDetails = await CompanyDetails.findOne({ jobId: latestJob._id })
      .lean();

    // Get all person details for this job
    const personDetails = await PersonDetails.find({ jobId: latestJob._id })
      .lean();

    // Get KYC documents for this job
    const kycDocuments = await KycDocument.findOne({ jobId: latestJob._id })
      .lean();

    // Get BRA approval documents for this job
    const braApproval = await BraApproval.findOne({ jobId: latestJob._id })
      .lean();

    // Separate person details by type
    const directors = personDetails.filter(person => person.personType === 'director');
    const shareholders = personDetails.filter(person => person.personType === 'shareholder');
    const secretaries = personDetails.filter(person => person.personType === 'secretary');
    const sefs = personDetails.filter(person => person.personType === 'sef');

    // Structure the response data for auto-fill
    const autoFillData = {
      found: true,
      jobNumber: latestJob.jobNumber,
      basicInfo: {
        clientName: latestJob.clientName,
        gmail: latestJob.gmail,
        startingPoint: latestJob.startingPoint,
        jobDetails: latestJob.jobDetails,
        specialDescription: latestJob.specialDescription || ''
      },
      companyDetails: companyDetails ? {
        companyName: companyDetails.companyName,
        qfcNo: companyDetails.qfcNo,
        registeredAddress: companyDetails.registeredAddress,
        incorporationDate: companyDetails.incorporationDate,
        serviceType: companyDetails.serviceType,
        mainPurpose: companyDetails.mainPurpose,
        expiryDate: companyDetails.expiryDate,
        companyComputerCardExpiry: companyDetails.companyComputerCardExpiry,
        taxCardExpiry: companyDetails.taxCardExpiry,
        crExtractExpiry: companyDetails.crExtractExpiry,
        scopeOfLicenseExpiry: companyDetails.scopeOfLicenseExpiry,
        kycActiveStatus: companyDetails.kycActiveStatus
      } : {},
      directors: directors.map(director => ({
        name: director.name,
        nationality: director.nationality,
        qidNo: director.qidNo,
        qidExpiry: director.qidExpiry,
        nationalAddress: director.nationalAddress,
        nationalAddressExpiry: director.nationalAddressExpiry,
        passportNo: director.passportNo,
        passportExpiry: director.passportExpiry,
        mobileNo: director.mobileNo,
        email: director.email,
        // Document URLs for reference
        visaCopy: director.visaCopy,
        qidDoc: director.qidDoc,
        nationalAddressDoc: director.nationalAddressDoc,
        passportDoc: director.passportDoc,
        cv: director.cv
      })),
      shareholders: shareholders.map(shareholder => ({
        name: shareholder.name,
        nationality: shareholder.nationality,
        qidNo: shareholder.qidNo,
        qidExpiry: shareholder.qidExpiry,
        nationalAddress: shareholder.nationalAddress,
        nationalAddressExpiry: shareholder.nationalAddressExpiry,
        passportNo: shareholder.passportNo,
        passportExpiry: shareholder.passportExpiry,
        mobileNo: shareholder.mobileNo,
        email: shareholder.email,
        // Document URLs for reference
        visaCopy: shareholder.visaCopy,
        qidDoc: shareholder.qidDoc,
        nationalAddressDoc: shareholder.nationalAddressDoc,
        passportDoc: shareholder.passportDoc,
        cv: shareholder.cv
      })),
      secretaries: secretaries.map(secretary => ({
        name: secretary.name,
        nationality: secretary.nationality,
        qidNo: secretary.qidNo,
        qidExpiry: secretary.qidExpiry,
        nationalAddress: secretary.nationalAddress,
        nationalAddressExpiry: secretary.nationalAddressExpiry,
        passportNo: secretary.passportNo,
        passportExpiry: secretary.passportExpiry,
        mobileNo: secretary.mobileNo,
        email: secretary.email,
        // Document URLs for reference
        visaCopy: secretary.visaCopy,
        qidDoc: secretary.qidDoc,
        nationalAddressDoc: secretary.nationalAddressDoc,
        passportDoc: secretary.passportDoc,
        cv: secretary.cv
      })),
      sefs: sefs.map(sef => ({
        name: sef.name,
        nationality: sef.nationality,
        qidNo: sef.qidNo,
        qidExpiry: sef.qidExpiry,
        nationalAddress: sef.nationalAddress,
        nationalAddressExpiry: sef.nationalAddressExpiry,
        passportNo: sef.passportNo,
        passportExpiry: sef.passportExpiry,
        mobileNo: sef.mobileNo,
        email: sef.email,
        // Document URLs for reference
        visaCopy: sef.visaCopy,
        qidDoc: sef.qidDoc,
        nationalAddressDoc: sef.nationalAddressDoc,
        passportDoc: sef.passportDoc,
        cv: sef.cv
      })),
      documents: {
        // Basic job documents
        documentPassport: latestJob.documentPassport,
        documentID: latestJob.documentID,
        otherDocuments: latestJob.otherDocuments || [],
        // Company documents from CompanyDetails
        engagementLetters: companyDetails?.engagementLetters || [],
        companyComputerCard: companyDetails?.companyComputerCard,
        taxCard: companyDetails?.taxCard,
        crExtract: companyDetails?.crExtract || [],
        companyMemo: companyDetails?.companyMemo || [],
        scopeOfLicense: companyDetails?.scopeOfLicense,
        articleOfAssociate: companyDetails?.articleOfAssociate,
        certificateOfIncorporate: companyDetails?.certificateOfIncorporate
      },
      kycDocumentInfo: kycDocuments?.documents || [],
      braDocumentInfo: braApproval ? [
        ...(braApproval.lmroApproval?.document ? [{
          file: braApproval.lmroApproval.document.fileUrl,
          description: `LMRO Approval Document - ${braApproval.lmroApproval.document.fileName}`,
          date: braApproval.lmroApproval.document.uploadedAt,
          stage: 'lmro'
        }] : []),
        ...(braApproval.dlmroApproval?.document ? [{
          file: braApproval.dlmroApproval.document.fileUrl,
          description: `DLMRO Approval Document - ${braApproval.dlmroApproval.document.fileName}`,
          date: braApproval.dlmroApproval.document.uploadedAt,
          stage: 'dlmro'
        }] : []),
        ...(braApproval.ceoApproval?.document ? [{
          file: braApproval.ceoApproval.document.fileUrl,
          description: `CEO Approval Document - ${braApproval.ceoApproval.document.fileName}`,
          date: braApproval.ceoApproval.document.uploadedAt,
          stage: 'ceo'
        }] : [])
      ] : []
    };

    res.status(200).json(autoFillData);
  } catch (error) {
    console.error(`❌ Error looking up job by email: ${error.message}`);
    res.status(500).json({ 
      message: 'Error retrieving job data',
      error: error.message,
      found: false 
    });
  }
});

const fixCorruptedCrExtract = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const companyDetail = await CompanyDetails.findOne({ jobId });
  if (!companyDetail) {
    res.status(404);
    throw new Error("Company details not found");
  }

  let fixed = false;

  if (Array.isArray(companyDetail.crExtract) && companyDetail.crExtract.length > 0) {
    const firstElement = companyDetail.crExtract[0];

    if (firstElement && typeof firstElement === 'object' && !firstElement.fileUrl) {
      const keys = Object.keys(firstElement);
      const hasNumberKeys = keys.some(key => !isNaN(parseInt(key)));

      if (hasNumberKeys) {
        const reconstructedUrl = Object.values(firstElement).join('');

        if (reconstructedUrl.startsWith('http')) {
          companyDetail.crExtract = [{
            fileUrl: reconstructedUrl,
            fileName: "CR Extract Document",
            uploadedAt: firstElement.uploadedAt || new Date(),
            uploadedBy: firstElement.uploadedBy || companyDetail.updatedBy || req.user._id,
            description: `Fixed on ${new Date().toLocaleDateString()}`
          }];

          await companyDetail.save();
          fixed = true;
        }
      }
    }
  }

  res.status(200).json({
    success: true,
    fixed,
    message: fixed ? "CR Extract data fixed successfully" : "No corruption found",
    crExtract: companyDetail.crExtract
  });
});

const getOtherDocumentsDetails = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const otherDocuments = await OtherDocumentsDetails.find({ jobId });
  res.status(200).json(otherDocuments);
});

const addOtherDocumentsDetails = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const {
    documentType,
    documentNumber,
    issueDate,
    expiryDate,
    description,
  } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  const newDocument = new OtherDocumentsDetails({
    jobId,
    documentType: documentType || "",
    documentNumber: documentNumber || "",
    issueDate: issueDate || null,
    expiryDate: expiryDate || null,
    description: description || "",
    updatedBy: req.user._id,
  });

  if (req.file) {
    const uploadResult = await safeCloudinaryUpload(req.file.path);
    newDocument.uploadedFile = uploadResult.url;
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }

  const savedDocument = await newDocument.save();

  job.timeline.push({
    status: job.status,
    description: "Other document details added",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  res.status(201).json(savedDocument);
});

const updateOtherDocumentsDetails = asyncHandler(async (req, res) => {
  const { jobId, documentId } = req.params;
  const {
    documentType,
    documentNumber,
    issueDate,
    expiryDate,
    description,
  } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const document = await OtherDocumentsDetails.findById(documentId);
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  if (documentType !== undefined) document.documentType = documentType;
  if (documentNumber !== undefined) document.documentNumber = documentNumber;
  if (issueDate !== undefined) document.issueDate = issueDate;
  if (expiryDate !== undefined) document.expiryDate = expiryDate;
  if (description !== undefined) document.description = description;

  if (req.file) {
    const uploadResult = await safeCloudinaryUpload(req.file.path);
    document.uploadedFile = uploadResult.url;
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }

  document.updatedBy = req.user._id;
  const updatedDocument = await document.save();

  const docTypeName = document.documentType || "Other document";
  job.timeline.push({
    status: job.status,
    description: `${docTypeName} updated`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  res.status(200).json(updatedDocument);
});

const deleteOtherDocumentsDetails = asyncHandler(async (req, res) => {
  const { jobId, documentId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const document = await OtherDocumentsDetails.findById(documentId);
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  const deletedDocTypeName = document.documentType || "Other document";
  await OtherDocumentsDetails.findByIdAndDelete(documentId);

  job.timeline.push({
    status: job.status,
    description: `${deletedDocTypeName} deleted`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  res.status(200).json({ message: "Document deleted successfully" });
});

const getBraDocuments = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to view this job");
  }

  let braDocuments = await BraDocument.findOne({ jobId });

  if (!braDocuments) {
    braDocuments = new BraDocument({
      jobId,
      activeStatus: "yes",
      documents: [],
      updatedBy: req.user._id,
    });
    await braDocuments.save();
  }

  res.status(200).json(braDocuments);
});

const updateBraDocuments = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { activeStatus, documents } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  let braDocuments = await BraDocument.findOne({ jobId });

  if (!braDocuments) {
    braDocuments = new BraDocument({
      jobId,
      activeStatus: activeStatus || "yes",
      documents: [],
      updatedBy: req.user._id,
    });
  } else {
    braDocuments.activeStatus = activeStatus || braDocuments.activeStatus;
    braDocuments.updatedBy = req.user._id;
  }

  if (req.files && req.files.length > 0) {
    const braDocumentDescriptions = req.body.braDocumentDescriptions
      ? JSON.parse(req.body.braDocumentDescriptions)
      : [];
    const braDocumentTypes = req.body.braDocumentTypes
      ? JSON.parse(req.body.braDocumentTypes)
      : [];

    const uploadPromises = req.files.map(async (file, index) => {
      const uploadResult = await safeCloudinaryUpload(file.path);

      if (uploadResult.success) {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }

      const description = braDocumentDescriptions[index] || "";
      const documentType = braDocumentTypes[index] || "BRA Document";
      const date = new Date();

      return {
        file: uploadResult.url,
        description,
        documentType,
        date,
      };
    });

    const uploadedDocuments = await Promise.all(uploadPromises);

    braDocuments.documents = [
      ...braDocuments.documents,
      ...uploadedDocuments,
    ];
  } else if (documents && Array.isArray(documents)) {
    braDocuments.documents = documents;
  }

  const updatedBraDocuments = await braDocuments.save();

  const uploadCount = req.files ? req.files.length : 0;
  const braTimelineDescription = uploadCount > 0
    ? `BRA document${uploadCount > 1 ? 's' : ''} uploaded (${uploadCount} file${uploadCount > 1 ? 's' : ''})`
    : "BRA documents updated";
  job.timeline.push({
    status: job.status,
    description: braTimelineDescription,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  try {
    await notificationService.createJobNotification(
      {
        title: "BRA Documents Updated",
        description: `BRA documents updated for ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json({
    success: true,
    message: "BRA documents updated successfully",
    documents: updatedBraDocuments,
  });
});

const deleteBraDocument = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { fileUrl } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  let braDocuments = await BraDocument.findOne({ jobId });

  if (!braDocuments) {
    res.status(404);
    throw new Error("BRA documents not found");
  }

  const deletedDoc = braDocuments.documents.find((doc) => doc.file === fileUrl);
  const deletedDocName = deletedDoc?.documentName || deletedDoc?.description || "BRA document";

  braDocuments.documents = braDocuments.documents.filter(
    (doc) => doc.file !== fileUrl
  );

  await braDocuments.save();

  job.timeline.push({
    status: job.status,
    description: `BRA document "${deletedDocName}" deleted`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  try {
    await notificationService.createJobNotification(
      {
        title: "BRA Document Deleted",
        description: `BRA document deleted for ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json({
    success: true,
    message: "BRA document deleted successfully",
  });
});

const replaceBraDocument = asyncHandler(async (req, res) => {
  const { jobId, documentIndex } = req.params;
  const { documentName, notes } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const isAdmin = req.user.role?.name === "admin";
  const hasCompliancePermission =
    req.user.role?.permissions?.complianceManagement;
  const hasOperationPermission =
    req.user.role?.permissions?.operationManagement;
  const isAssignedPerson =
    job.assignedPerson?.toString() === req.user._id.toString();

  if (
    !isAdmin &&
    !hasCompliancePermission &&
    !hasOperationPermission &&
    !isAssignedPerson
  ) {
    res.status(403);
    throw new Error("You are not authorized to update this job");
  }

  let braDocuments = await BraDocument.findOne({ jobId });

  if (!braDocuments) {
    res.status(404);
    throw new Error("BRA documents not found");
  }

  const docIndex = parseInt(documentIndex);
  if (isNaN(docIndex) || docIndex < 0 || docIndex >= braDocuments.documents.length) {
    res.status(400);
    throw new Error("Invalid document index");
  }

  const oldDocument = braDocuments.documents[docIndex];

  if (oldDocument && oldDocument.file) {
    try {
      await Archive.create({
        clientId: job.clientId,
        jobId: job._id,
        documentType: "bra_document",
        sourceType: "bra",
        fileUrl: oldDocument.file,
        fileName: oldDocument.description || "BRA Document",
        title: oldDocument.description || "General BRA Document",
        description: `Archived general BRA document - replaced`,
        archivedBy: req.user._id,
        reason: "replaced",
        originalUploadedAt: oldDocument.date,
        metadata: {
          documentType: oldDocument.documentType,
          originalDescription: oldDocument.description
        }
      });
      console.log(`Archived old BRA document for job ${jobId}`);
    } catch (archiveError) {
      console.error("Error archiving BRA document:", archiveError);
    }
  }

  if (req.file) {
    const uploadResult = await safeCloudinaryUpload(req.file.path);

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    const description = notes ? `${documentName} - ${notes}` : documentName;

    braDocuments.documents[docIndex] = {
      file: uploadResult.url,
      description: description || oldDocument.description,
      documentType: oldDocument.documentType || "BRA Document",
      date: new Date(),
    };
  } else if (documentName) {
    const description = notes ? `${documentName} - ${notes}` : documentName;
    braDocuments.documents[docIndex].description = description;
  }

  braDocuments.updatedBy = req.user._id;
  await braDocuments.save();

  job.timeline.push({
    status: job.status,
    description: "BRA document replaced",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  res.status(200).json({
    success: true,
    message: "BRA document replaced successfully",
    documents: braDocuments.documents,
  });
});

// ============== UBO DETAILS FUNCTIONS ==============

const getUboDetails = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  let uboRecord = await UboDetails.findOne({ jobId });

  if (!uboRecord) {
    uboRecord = { jobId, documents: [] };
  }

  res.status(200).json(uboRecord);
});

const addUboDocument = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { title, description } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const uploadResult = await safeCloudinaryUpload(req.file.path, {
    folder: `ubo/${jobId}`,
    resource_type: "auto",
  });

  if (fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  let uboRecord = await UboDetails.findOne({ jobId });

  if (!uboRecord) {
    uboRecord = new UboDetails({
      jobId,
      documents: [],
      updatedBy: req.user._id,
    });
  }

  const newDoc = {
    fileUrl: uploadResult.url,
    fileName: req.file.originalname,
    title: title || '',
    description: description || '',
    uploadedAt: new Date(),
  };

  uboRecord.documents.push(newDoc);
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  job.timeline.push({
    status: job.status,
    description: `UBO document "${title || req.file.originalname}" uploaded`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  await job.save();

  res.status(201).json({ success: true, document: newDoc, ubo: uboRecord });
});

const updateUboDocument = asyncHandler(async (req, res) => {
  const { jobId, documentId } = req.params;
  const { title, description } = req.body;

  const uboRecord = await UboDetails.findOne({ jobId });
  if (!uboRecord) {
    res.status(404);
    throw new Error("UBO record not found");
  }

  const docIndex = uboRecord.documents.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    res.status(404);
    throw new Error("Document not found");
  }

  const job = await Job.findById(jobId);

  if (title !== undefined) uboRecord.documents[docIndex].title = title;
  if (description !== undefined) uboRecord.documents[docIndex].description = description;

  if (req.file) {
    // Archive old document before replacing
    if (uboRecord.documents[docIndex].fileUrl && job) {
      await archiveDocument({
        clientId: job.clientId,
        jobId: job._id,
        documentType: "ubo_document",
        sourceType: "ubo",
        fileUrl: uboRecord.documents[docIndex].fileUrl,
        fileName: uboRecord.documents[docIndex].fileName,
        title: uboRecord.documents[docIndex].title,
        description: uboRecord.documents[docIndex].description,
        archivedBy: req.user._id,
        reason: "replaced",
        originalUploadedAt: uboRecord.documents[docIndex].uploadedAt,
      });
    }

    const uploadResult = await safeCloudinaryUpload(req.file.path, {
      folder: `ubo/${jobId}`,
      resource_type: "auto",
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    uboRecord.documents[docIndex].fileUrl = uploadResult.url;
    uboRecord.documents[docIndex].fileName = req.file.originalname;
    uboRecord.documents[docIndex].uploadedAt = new Date();
  }

  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  if (job) {
    job.timeline.push({
      status: job.status,
      description: `UBO document "${uboRecord.documents[docIndex].title || uboRecord.documents[docIndex].fileName}" updated`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();
  }

  res.status(200).json({ success: true, document: uboRecord.documents[docIndex], ubo: uboRecord });
});

const deleteUboDocument = asyncHandler(async (req, res) => {
  const { jobId, documentId } = req.params;

  const uboRecord = await UboDetails.findOne({ jobId });
  if (!uboRecord) {
    res.status(404);
    throw new Error("UBO record not found");
  }

  const docIndex = uboRecord.documents.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    res.status(404);
    throw new Error("Document not found");
  }

  const deletedDoc = uboRecord.documents[docIndex];
  uboRecord.documents.splice(docIndex, 1);
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  const job = await Job.findById(jobId);
  if (job) {
    job.timeline.push({
      status: job.status,
      description: `UBO document "${deletedDoc.title || deletedDoc.fileName}" deleted`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();
  }

  res.status(200).json({ success: true, message: "Document deleted successfully", ubo: uboRecord });
});

const addUboPerson = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { name, passportNo, qidNo, nationality } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  let uboRecord = await UboDetails.findOne({ jobId });

  if (!uboRecord) {
    uboRecord = new UboDetails({
      jobId,
      ubos: [],
      updatedBy: req.user._id,
    });
  }

  if (!uboRecord.ubos) {
    uboRecord.ubos = [];
  }

  const documents = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadResult = await safeCloudinaryUpload(file.path, {
        folder: `ubo/${jobId}`,
        resource_type: "auto",
      });
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      documents.push({
        fileUrl: uploadResult.url,
        fileName: file.originalname,
        title: file.originalname,
        description: '',
        uploadedAt: new Date(),
      });
    }
  }

  const newUbo = {
    name: name || '',
    passportNo: passportNo || '',
    qidNo: qidNo || '',
    nationality: nationality || '',
    documents: documents,
  };

  uboRecord.ubos.push(newUbo);
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  job.timeline.push({
    status: job.status,
    description: `UBO "${name}" added`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  await job.save();

  // SYNC: Add this UBO to ALL other jobs for the same client
  let syncResult = null;
  if (name) {
    try {
      console.log(`[UBO SYNC] Adding UBO "${name}" to other jobs for client ${job.gmail}`);
      const Client = require("../models/Client");
      const client = await Client.findOne({ gmail: job.gmail });

      if (client) {
        const otherJobs = await Job.find({
          clientId: client._id,
          _id: { $ne: jobId }
        });

        let syncedCount = 0;
        for (const otherJob of otherJobs) {
          let otherUboRecord = await UboDetails.findOne({ jobId: otherJob._id });

          if (!otherUboRecord) {
            otherUboRecord = new UboDetails({
              jobId: otherJob._id,
              ubos: [],
              updatedBy: req.user._id,
            });
          }

          // Check if this UBO already exists (by name)
          const exists = otherUboRecord.ubos?.some(
            u => (u.name || '').toLowerCase().trim() === (name || '').toLowerCase().trim()
          );

          if (!exists) {
            otherUboRecord.ubos.push({ ...newUbo });
            otherUboRecord.updatedBy = req.user._id;
            await otherUboRecord.save();

            otherJob.timeline.push({
              status: otherJob.status,
              description: `UBO "${name}" auto-synced from job ${job.jobNumber}`,
              timestamp: new Date(),
              updatedBy: req.user._id,
            });
            await otherJob.save();
            syncedCount++;
          }
        }
        syncResult = { success: true, syncedCount };
        console.log(`[UBO SYNC] Synced to ${syncedCount} other jobs`);
      }
    } catch (syncError) {
      console.error("[UBO SYNC] Error:", syncError);
    }
  }

  res.status(201).json({ success: true, ubo: uboRecord, syncResult });
});

const updateUboPerson = asyncHandler(async (req, res) => {
  const { jobId, uboId } = req.params;
  const { name, passportNo, qidNo, nationality, existingDocuments } = req.body;

  const uboRecord = await UboDetails.findOne({ jobId });
  if (!uboRecord) {
    res.status(404);
    throw new Error("UBO record not found");
  }

  if (!uboRecord.ubos) {
    uboRecord.ubos = [];
  }

  const uboIndex = uboRecord.ubos.findIndex(ubo => ubo._id.toString() === uboId);
  if (uboIndex === -1) {
    res.status(404);
    throw new Error("UBO person not found");
  }

  if (name !== undefined) uboRecord.ubos[uboIndex].name = name;
  if (passportNo !== undefined) uboRecord.ubos[uboIndex].passportNo = passportNo;
  if (qidNo !== undefined) uboRecord.ubos[uboIndex].qidNo = qidNo;
  if (nationality !== undefined) uboRecord.ubos[uboIndex].nationality = nationality;

  let existingDocs = [];
  if (existingDocuments) {
    try {
      existingDocs = JSON.parse(existingDocuments);
    } catch (e) {
      existingDocs = [];
    }
  }

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadResult = await safeCloudinaryUpload(file.path, {
        folder: `ubo/${jobId}`,
        resource_type: "auto",
      });
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      existingDocs.push({
        fileUrl: uploadResult.url,
        fileName: file.originalname,
        title: file.originalname,
        description: '',
        uploadedAt: new Date(),
      });
    }
  }

  uboRecord.ubos[uboIndex].documents = existingDocs;
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  const job = await Job.findById(jobId);
  if (job) {
    job.timeline.push({
      status: job.status,
      description: `UBO "${name || uboRecord.ubos[uboIndex].name}" updated`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();
  }

  // SYNC: Update this UBO in ALL other jobs for the same client
  const uboName = name || uboRecord.ubos[uboIndex].name;
  let syncResult = null;
  if (uboName && job) {
    try {
      console.log(`[UBO SYNC] Updating UBO "${uboName}" in other jobs for client ${job.gmail}`);
      const Client = require("../models/Client");
      const client = await Client.findOne({ gmail: job.gmail });

      if (client) {
        const otherJobs = await Job.find({
          clientId: client._id,
          _id: { $ne: jobId }
        });

        let syncedCount = 0;
        for (const otherJob of otherJobs) {
          const otherUboRecord = await UboDetails.findOne({ jobId: otherJob._id });

          if (otherUboRecord && otherUboRecord.ubos) {
            const otherUboIndex = otherUboRecord.ubos.findIndex(
              u => (u.name || '').toLowerCase().trim() === uboName.toLowerCase().trim()
            );

            if (otherUboIndex !== -1) {
              // Update the matching UBO
              otherUboRecord.ubos[otherUboIndex].name = uboRecord.ubos[uboIndex].name;
              otherUboRecord.ubos[otherUboIndex].passportNo = uboRecord.ubos[uboIndex].passportNo;
              otherUboRecord.ubos[otherUboIndex].qidNo = uboRecord.ubos[uboIndex].qidNo;
              otherUboRecord.ubos[otherUboIndex].nationality = uboRecord.ubos[uboIndex].nationality;
              otherUboRecord.ubos[otherUboIndex].documents = uboRecord.ubos[uboIndex].documents;
              otherUboRecord.updatedBy = req.user._id;
              await otherUboRecord.save();

              otherJob.timeline.push({
                status: otherJob.status,
                description: `UBO "${uboName}" auto-synced from job ${job.jobNumber}`,
                timestamp: new Date(),
                updatedBy: req.user._id,
              });
              await otherJob.save();
              syncedCount++;
            }
          }
        }
        syncResult = { success: true, syncedCount };
        console.log(`[UBO SYNC] Synced to ${syncedCount} other jobs`);
      }
    } catch (syncError) {
      console.error("[UBO SYNC] Error:", syncError);
    }
  }

  res.status(200).json({ success: true, ubo: uboRecord, syncResult });
});

const deleteUboPerson = asyncHandler(async (req, res) => {
  const { jobId, uboId } = req.params;

  const uboRecord = await UboDetails.findOne({ jobId });
  if (!uboRecord) {
    res.status(404);
    throw new Error("UBO record not found");
  }

  if (!uboRecord.ubos) {
    res.status(404);
    throw new Error("No UBO persons found");
  }

  const uboIndex = uboRecord.ubos.findIndex(ubo => ubo._id.toString() === uboId);
  if (uboIndex === -1) {
    res.status(404);
    throw new Error("UBO person not found");
  }

  const deletedUbo = uboRecord.ubos[uboIndex];
  uboRecord.ubos.splice(uboIndex, 1);
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  const job = await Job.findById(jobId);
  if (job) {
    job.timeline.push({
      status: job.status,
      description: `UBO "${deletedUbo.name}" deleted`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();
  }

  // SYNC: Delete this UBO from ALL other jobs for the same client
  const uboName = deletedUbo.name;
  let syncResult = null;
  if (uboName && job) {
    try {
      console.log(`[UBO SYNC] Deleting UBO "${uboName}" from other jobs for client ${job.gmail}`);
      const Client = require("../models/Client");
      const client = await Client.findOne({ gmail: job.gmail });

      if (client) {
        const otherJobs = await Job.find({
          clientId: client._id,
          _id: { $ne: jobId }
        });

        let syncedCount = 0;
        for (const otherJob of otherJobs) {
          const otherUboRecord = await UboDetails.findOne({ jobId: otherJob._id });

          if (otherUboRecord && otherUboRecord.ubos) {
            const otherUboIndex = otherUboRecord.ubos.findIndex(
              u => (u.name || '').toLowerCase().trim() === uboName.toLowerCase().trim()
            );

            if (otherUboIndex !== -1) {
              // Delete the matching UBO
              otherUboRecord.ubos.splice(otherUboIndex, 1);
              otherUboRecord.updatedBy = req.user._id;
              await otherUboRecord.save();

              otherJob.timeline.push({
                status: otherJob.status,
                description: `UBO "${uboName}" auto-deleted (synced from job ${job.jobNumber})`,
                timestamp: new Date(),
                updatedBy: req.user._id,
              });
              await otherJob.save();
              syncedCount++;
            }
          }
        }
        syncResult = { success: true, syncedCount };
        console.log(`[UBO SYNC] Deleted from ${syncedCount} other jobs`);
      }
    } catch (syncError) {
      console.error("[UBO SYNC] Error:", syncError);
    }
  }

  res.status(200).json({ success: true, message: "UBO person deleted successfully", ubo: uboRecord, syncResult });
});

const addUboPersonDocument = asyncHandler(async (req, res) => {
  const { jobId, uboId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const uboRecord = await UboDetails.findOne({ jobId });
  if (!uboRecord) {
    res.status(404);
    throw new Error("UBO record not found");
  }

  const uboIndex = uboRecord.ubos.findIndex(ubo => ubo._id.toString() === uboId);
  if (uboIndex === -1) {
    res.status(404);
    throw new Error("UBO person not found");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const uploadResult = await safeCloudinaryUpload(req.file.path, {
    folder: `ubo/${jobId}`,
    resource_type: "auto",
  });

  if (fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  if (!uboRecord.ubos[uboIndex].documents) {
    uboRecord.ubos[uboIndex].documents = [];
  }

  const newDoc = {
    fileUrl: uploadResult.url,
    fileName: req.file.originalname,
    title: req.file.originalname,
    description: '',
    uploadedAt: new Date(),
  };

  uboRecord.ubos[uboIndex].documents.push(newDoc);
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  job.timeline.push({
    status: job.status,
    description: `Document added to UBO "${uboRecord.ubos[uboIndex].name}"`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  await job.save();

  res.status(201).json({ success: true, ubo: uboRecord });
});

const replaceUboPersonDocument = asyncHandler(async (req, res) => {
  const { jobId, uboId, documentId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const uboRecord = await UboDetails.findOne({ jobId });
  if (!uboRecord) {
    res.status(404);
    throw new Error("UBO record not found");
  }

  const uboIndex = uboRecord.ubos.findIndex(ubo => ubo._id.toString() === uboId);
  if (uboIndex === -1) {
    res.status(404);
    throw new Error("UBO person not found");
  }

  if (!uboRecord.ubos[uboIndex].documents) {
    res.status(404);
    throw new Error("No documents found");
  }

  const docIndex = uboRecord.ubos[uboIndex].documents.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    res.status(404);
    throw new Error("Document not found");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const uploadResult = await safeCloudinaryUpload(req.file.path, {
    folder: `ubo/${jobId}`,
  });

  if (uploadResult.success) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }

  uboRecord.ubos[uboIndex].documents[docIndex].fileUrl = uploadResult.url;
  uboRecord.ubos[uboIndex].documents[docIndex].fileName = req.file.originalname;
  uboRecord.ubos[uboIndex].documents[docIndex].uploadedAt = new Date();
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  job.timeline.push({
    status: "ubo_document_replaced",
    description: `UBO document replaced for ${uboRecord.ubos[uboIndex].name}`,
    performedBy: req.user._id,
    performedAt: new Date(),
  });
  await job.save();

  res.json({
    success: true,
    message: "UBO document replaced successfully",
    document: uboRecord.ubos[uboIndex].documents[docIndex],
  });
});

const deleteUboPersonDocument = asyncHandler(async (req, res) => {
  const { jobId, uboId, documentId } = req.params;

  const uboRecord = await UboDetails.findOne({ jobId });
  if (!uboRecord) {
    res.status(404);
    throw new Error("UBO record not found");
  }

  const uboIndex = uboRecord.ubos.findIndex(ubo => ubo._id.toString() === uboId);
  if (uboIndex === -1) {
    res.status(404);
    throw new Error("UBO person not found");
  }

  if (!uboRecord.ubos[uboIndex].documents) {
    res.status(404);
    throw new Error("No documents found");
  }

  const docIndex = uboRecord.ubos[uboIndex].documents.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    res.status(404);
    throw new Error("Document not found");
  }

  uboRecord.ubos[uboIndex].documents.splice(docIndex, 1);
  uboRecord.updatedBy = req.user._id;
  await uboRecord.save();

  const job = await Job.findById(jobId);
  if (job) {
    job.timeline.push({
      status: job.status,
      description: `Document removed from UBO "${uboRecord.ubos[uboIndex].name}"`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();
  }

  res.status(200).json({ success: true, ubo: uboRecord });
});

const getCddDetails = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  let cddRecord = await CddDetails.findOne({ jobId });

  if (!cddRecord) {
    cddRecord = { jobId, documents: [] };
  }

  res.status(200).json(cddRecord);
});

const addCddDocument = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files uploaded");
  }

  let cddRecord = await CddDetails.findOne({ jobId });

  if (!cddRecord) {
    cddRecord = new CddDetails({
      jobId,
      documents: [],
      updatedBy: req.user._id,
    });
  }

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const title = req.body[`title_${i}`] || req.body.title || "";
    const description = req.body[`description_${i}`] || req.body.description || "";

    const uploadResult = await safeCloudinaryUpload(file.path, {
      folder: `cdd/${jobId}`,
      resource_type: "auto",
    });

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    cddRecord.documents.push({
      fileUrl: uploadResult.url,
      fileName: file.originalname,
      title: title,
      description: description,
      uploadedAt: new Date(),
    });
  }

  cddRecord.updatedBy = req.user._id;
  await cddRecord.save();

  const uploadCount = req.files.length;

  job.timeline.push({
    status: job.status,
    description: `${uploadCount} CDD document${uploadCount > 1 ? 's' : ''} uploaded`,
    timestamp: new Date(),
    updatedBy: req.user._id,
  });
  await job.save();

  // SYNC: Add these CDD documents to ALL other jobs for the same client
  let syncResult = null;
  try {
    console.log(`[CDD SYNC] Adding ${uploadCount} CDD document(s) to other jobs for client ${job.gmail}`);
    const Client = require("../models/Client");
    const client = await Client.findOne({ gmail: job.gmail });

    if (client) {
      const otherJobs = await Job.find({
        clientId: client._id,
        _id: { $ne: jobId }
      });

      let syncedCount = 0;
      for (const otherJob of otherJobs) {
        let otherCddRecord = await CddDetails.findOne({ jobId: otherJob._id });

        if (!otherCddRecord) {
          otherCddRecord = new CddDetails({
            jobId: otherJob._id,
            documents: [],
            updatedBy: req.user._id,
          });
        }

        // Get newly added documents (last N documents in the array)
        const newDocs = cddRecord.documents.slice(-uploadCount);
        let addedToThisJob = 0;

        for (const newDoc of newDocs) {
          // Check if this document already exists (by fileName)
          const exists = otherCddRecord.documents?.some(
            d => (d.fileName || '').toLowerCase().trim() === (newDoc.fileName || '').toLowerCase().trim()
          );

          if (!exists) {
            otherCddRecord.documents.push({
              fileUrl: newDoc.fileUrl,
              fileName: newDoc.fileName,
              title: newDoc.title,
              description: newDoc.description,
              uploadedAt: newDoc.uploadedAt,
            });
            addedToThisJob++;
          }
        }

        if (addedToThisJob > 0) {
          otherCddRecord.updatedBy = req.user._id;
          await otherCddRecord.save();

          otherJob.timeline.push({
            status: otherJob.status,
            description: `${addedToThisJob} CDD document(s) auto-synced from job ${job.jobNumber}`,
            timestamp: new Date(),
            updatedBy: req.user._id,
          });
          await otherJob.save();
          syncedCount++;
        }
      }
      syncResult = { success: true, syncedCount };
      console.log(`[CDD SYNC] Synced to ${syncedCount} other jobs`);
    }
  } catch (syncError) {
    console.error("[CDD SYNC] Error:", syncError);
  }

  res.status(201).json({
    success: true,
    message: `${uploadCount} CDD document${uploadCount > 1 ? 's' : ''} uploaded successfully`,
    cdd: cddRecord,
    syncResult
  });
});

const updateCddDocument = asyncHandler(async (req, res) => {
  const { jobId, documentId } = req.params;
  const { title, description } = req.body;

  const cddRecord = await CddDetails.findOne({ jobId });
  if (!cddRecord) {
    res.status(404);
    throw new Error("CDD record not found");
  }

  const docIndex = cddRecord.documents.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    res.status(404);
    throw new Error("Document not found");
  }

  const job = await Job.findById(jobId);

  if (title !== undefined) cddRecord.documents[docIndex].title = title;
  if (description !== undefined) cddRecord.documents[docIndex].description = description;

  if (req.file) {
    // Archive old document before replacing
    if (cddRecord.documents[docIndex].fileUrl && job) {
      await archiveDocument({
        clientId: job.clientId,
        jobId: job._id,
        documentType: "cdd_document",
        sourceType: "cdd",
        fileUrl: cddRecord.documents[docIndex].fileUrl,
        fileName: cddRecord.documents[docIndex].fileName,
        title: cddRecord.documents[docIndex].title,
        description: cddRecord.documents[docIndex].description,
        archivedBy: req.user._id,
        reason: "replaced",
        originalUploadedAt: cddRecord.documents[docIndex].uploadedAt,
      });
    }

    const uploadResult = await safeCloudinaryUpload(req.file.path, {
      folder: `cdd/${jobId}`,
      resource_type: "auto",
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    cddRecord.documents[docIndex].fileUrl = uploadResult.url;
    cddRecord.documents[docIndex].fileName = req.file.originalname;
    cddRecord.documents[docIndex].uploadedAt = new Date();
  }

  cddRecord.updatedBy = req.user._id;
  await cddRecord.save();

  if (job) {
    job.timeline.push({
      status: job.status,
      description: `CDD document "${cddRecord.documents[docIndex].title || cddRecord.documents[docIndex].fileName}" updated`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();
  }

  // SYNC: Update this CDD document in ALL other jobs for the same client
  const docFileName = cddRecord.documents[docIndex].fileName;
  let syncResult = null;
  if (docFileName && job) {
    try {
      console.log(`[CDD SYNC] Updating CDD document "${docFileName}" in other jobs for client ${job.gmail}`);
      const Client = require("../models/Client");
      const client = await Client.findOne({ gmail: job.gmail });

      if (client) {
        const otherJobs = await Job.find({
          clientId: client._id,
          _id: { $ne: jobId }
        });

        let syncedCount = 0;
        for (const otherJob of otherJobs) {
          const otherCddRecord = await CddDetails.findOne({ jobId: otherJob._id });

          if (otherCddRecord && otherCddRecord.documents) {
            const otherDocIndex = otherCddRecord.documents.findIndex(
              d => (d.fileName || '').toLowerCase().trim() === docFileName.toLowerCase().trim()
            );

            if (otherDocIndex !== -1) {
              // Update the matching document
              otherCddRecord.documents[otherDocIndex].title = cddRecord.documents[docIndex].title;
              otherCddRecord.documents[otherDocIndex].description = cddRecord.documents[docIndex].description;
              otherCddRecord.documents[otherDocIndex].fileUrl = cddRecord.documents[docIndex].fileUrl;
              otherCddRecord.documents[otherDocIndex].fileName = cddRecord.documents[docIndex].fileName;
              otherCddRecord.documents[otherDocIndex].uploadedAt = cddRecord.documents[docIndex].uploadedAt;
              otherCddRecord.updatedBy = req.user._id;
              await otherCddRecord.save();

              otherJob.timeline.push({
                status: otherJob.status,
                description: `CDD document "${docFileName}" auto-synced from job ${job.jobNumber}`,
                timestamp: new Date(),
                updatedBy: req.user._id,
              });
              await otherJob.save();
              syncedCount++;
            }
          }
        }
        syncResult = { success: true, syncedCount };
        console.log(`[CDD SYNC] Synced to ${syncedCount} other jobs`);
      }
    } catch (syncError) {
      console.error("[CDD SYNC] Error:", syncError);
    }
  }

  res.status(200).json({ success: true, message: "CDD document updated successfully", cdd: cddRecord, syncResult });
});

const deleteCddDocument = asyncHandler(async (req, res) => {
  const { jobId, documentId } = req.params;

  const cddRecord = await CddDetails.findOne({ jobId });
  if (!cddRecord) {
    res.status(404);
    throw new Error("CDD record not found");
  }

  const docIndex = cddRecord.documents.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    res.status(404);
    throw new Error("Document not found");
  }

  const deletedDoc = cddRecord.documents[docIndex];
  cddRecord.documents.splice(docIndex, 1);
  cddRecord.updatedBy = req.user._id;
  await cddRecord.save();

  const job = await Job.findById(jobId);
  if (job) {
    job.timeline.push({
      status: job.status,
      description: `CDD document "${deletedDoc.title || deletedDoc.fileName}" deleted`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await job.save();
  }

  // SYNC: Delete this CDD document from ALL other jobs for the same client
  const docFileName = deletedDoc.fileName;
  let syncResult = null;
  if (docFileName && job) {
    try {
      console.log(`[CDD SYNC] Deleting CDD document "${docFileName}" from other jobs for client ${job.gmail}`);
      const Client = require("../models/Client");
      const client = await Client.findOne({ gmail: job.gmail });

      if (client) {
        const otherJobs = await Job.find({
          clientId: client._id,
          _id: { $ne: jobId }
        });

        let syncedCount = 0;
        for (const otherJob of otherJobs) {
          const otherCddRecord = await CddDetails.findOne({ jobId: otherJob._id });

          if (otherCddRecord && otherCddRecord.documents) {
            const otherDocIndex = otherCddRecord.documents.findIndex(
              d => (d.fileName || '').toLowerCase().trim() === docFileName.toLowerCase().trim()
            );

            if (otherDocIndex !== -1) {
              // Delete the matching document
              otherCddRecord.documents.splice(otherDocIndex, 1);
              otherCddRecord.updatedBy = req.user._id;
              await otherCddRecord.save();

              otherJob.timeline.push({
                status: otherJob.status,
                description: `CDD document "${docFileName}" auto-deleted (synced from job ${job.jobNumber})`,
                timestamp: new Date(),
                updatedBy: req.user._id,
              });
              await otherJob.save();
              syncedCount++;
            }
          }
        }
        syncResult = { success: true, syncedCount };
        console.log(`[CDD SYNC] Deleted from ${syncedCount} other jobs`);
      }
    } catch (syncError) {
      console.error("[CDD SYNC] Error:", syncError);
    }
  }

  res.status(200).json({ success: true, message: "Document deleted successfully", cdd: cddRecord, syncResult });
});

module.exports = {
  getCompanyDetails,
  updateCompanyDetails,
  getPersonDetails,
  addPersonDetails,
  updatePersonDetails,
  deletePersonDetails,
  getKycDocuments,
  updateKycDocuments,
  replaceKycDocument,
  getBraDocuments,
  updateBraDocuments,
  deleteBraDocument,
  replaceBraDocument,
  uploadEngagementLetter,
  getEngagementLetters,
  completeOperation,
  createPreApprovedJob,
  getPersonFieldHistory,
  getClientEngagementLetters,
  getExpiringJobs,
  exportExpiringJobs,
  sendExpiryNotifications,
  getExpiringJobsForDashboard,
  updateJobExpiryDate,
  getExpiringJobsStats,
  deleteEngagementLetter,
  replaceEngagementLetter,
  getJobDataByEmail,
  deleteCompanyDocument,
  deletePersonDocument,
  replacePersonDocument,
  deleteKycSignedDocument,
  fixCorruptedCrExtract,
  getOtherDocumentsDetails,
  addOtherDocumentsDetails,
  updateOtherDocumentsDetails,
  deleteOtherDocumentsDetails,
  getUboDetails,
  addUboDocument,
  updateUboDocument,
  deleteUboDocument,
  addUboPerson,
  updateUboPerson,
  deleteUboPerson,
  addUboPersonDocument,
  replaceUboPersonDocument,
  deleteUboPersonDocument,
  getCddDetails,
  addCddDocument,
  updateCddDocument,
  deleteCddDocument,
};

