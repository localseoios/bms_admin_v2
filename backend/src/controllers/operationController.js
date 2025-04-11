// controllers/operationController.js
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const {
  CompanyDetails,
  PersonDetails,
  KycDocument,
} = require("../models/OperationModels");
const Job = require("../models/Job");
const notificationService = require("../services/notificationService");
const mongoose = require("mongoose");
const kycService = require("../services/kycService");
const Client = require("../models/Client");
const { findPersonDetailsByGmail } = require("../utils/clientUtils"); // Import the utility function
const BraApproval = require("../models/braApprovalModel");
const KycApproval = require("../models/kycApprovalModel");

// Helper function to safely upload to Cloudinary with fallback (reused from jobController)
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
  let companyDetails = await CompanyDetails.findOne({ jobId });

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


// Update company details - modified to synchronize across jobs
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
    syncAcrossJobs, // New parameter to control synchronization
  } = req.body;

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

  // Update text fields
  companyDetails.companyName = companyName || companyDetails.companyName;
  companyDetails.qfcNo = qfcNo || companyDetails.qfcNo;
  companyDetails.registeredAddress =
    registeredAddress || companyDetails.registeredAddress;
  companyDetails.incorporationDate =
    incorporationDate || companyDetails.incorporationDate;
  companyDetails.serviceType = serviceType || companyDetails.serviceType;
  companyDetails.mainPurpose = mainPurpose || companyDetails.mainPurpose;
  companyDetails.expiryDate = expiryDate || companyDetails.expiryDate;
  companyDetails.kycActiveStatus =
    kycActiveStatus || companyDetails.kycActiveStatus;
  companyDetails.updatedBy = req.user._id;

  // Handle document uploads
  if (req.files) {
    // Engagement Letters
    if (req.files["engagementLetters"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["engagementLetters"][0].path
      );
      companyDetails.engagementLetters = uploadResult.url;
      // Clean up temporary file after successful upload
      fs.unlink(req.files["engagementLetters"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Company Computer Card
    if (req.files["companyComputerCard"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["companyComputerCard"][0].path
      );
      companyDetails.companyComputerCard = uploadResult.url;
      fs.unlink(req.files["companyComputerCard"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Tax Card
    if (req.files["taxCard"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["taxCard"][0].path
      );
      companyDetails.taxCard = uploadResult.url;
      fs.unlink(req.files["taxCard"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // CR Extract
    if (req.files["crExtract"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["crExtract"][0].path
      );
      companyDetails.crExtract = uploadResult.url;
      fs.unlink(req.files["crExtract"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Scope of License
    if (req.files["scopeOfLicense"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["scopeOfLicense"][0].path
      );
      companyDetails.scopeOfLicense = uploadResult.url;
      fs.unlink(req.files["scopeOfLicense"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Article of Associate
    if (req.files["articleOfAssociate"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["articleOfAssociate"][0].path
      );
      companyDetails.articleOfAssociate = uploadResult.url;
      fs.unlink(req.files["articleOfAssociate"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Certificate of Incorporate
    if (req.files["certificateOfIncorporate"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["certificateOfIncorporate"][0].path
      );
      companyDetails.certificateOfIncorporate = uploadResult.url;
      fs.unlink(req.files["certificateOfIncorporate"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }
  }

  // Update expiry dates
  if (req.body.companyComputerCardExpiry) {
    companyDetails.companyComputerCardExpiry =
      req.body.companyComputerCardExpiry;
  }

  if (req.body.taxCardExpiry) {
    companyDetails.taxCardExpiry = req.body.taxCardExpiry;
  }

  if (req.body.crExtractExpiry) {
    companyDetails.crExtractExpiry = req.body.crExtractExpiry;
  }

  if (req.body.scopeOfLicenseExpiry) {
    companyDetails.scopeOfLicenseExpiry = req.body.scopeOfLicenseExpiry;
  }

  const updatedCompanyDetails = await companyDetails.save();

  // Add a timeline entry for the job
  job.timeline.push({
    status: job.status,
    description: "Company details updated",
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
      
    await notificationService.createNotification(
      {
        title: "Company Details Updated",
        description: notificationText,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
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

  

  // If no entries found for this job, look for entries from other jobs with the same Gmail
  if (personDetails.length === 0) {
    console.log(
      `No ${personType} details found for job ${jobId}, checking other jobs for Gmail ${job.gmail}`
    );

    // Check if there are any existing person details for this Gmail address
    const existingPersonDetails = await findPersonDetailsByGmail(
      job.gmail,
      personType
    );

    if (existingPersonDetails) {
      console.log(
        `Found existing ${personType} details from another job for Gmail ${job.gmail}. Auto-populating...`
      );

      // Create a new person details entry using the existing data
      const newPersonDetails = new PersonDetails({
        jobId,
        personType,
        name: existingPersonDetails.name || job.clientName || "",
        nationality: existingPersonDetails.nationality || "",
        visaCopy: existingPersonDetails.visaCopy,
        qidNo: existingPersonDetails.qidNo || "",
        qidDoc: existingPersonDetails.qidDoc,
        qidExpiry: existingPersonDetails.qidExpiry,
        nationalAddress: existingPersonDetails.nationalAddress || "",
        nationalAddressDoc: existingPersonDetails.nationalAddressDoc,
        nationalAddressExpiry: existingPersonDetails.nationalAddressExpiry,
        passportNo: existingPersonDetails.passportNo || "",
        passportDoc: existingPersonDetails.passportDoc,
        passportExpiry: existingPersonDetails.passportExpiry,
        mobileNo: existingPersonDetails.mobileNo || "",
        email: existingPersonDetails.email || job.gmail || "",
        cv: existingPersonDetails.cv,
        updatedBy: req.user._id,
      });

      await newPersonDetails.save();

      // Add a timeline entry to indicate auto-population
      job.timeline.push({
        status: job.status,
        description: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } details auto-populated from existing client record`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await job.save();

      console.log(
        `Successfully auto-populated ${personType} details for job ${jobId} from existing client data`
      );

      // Return the newly created person details
      res.status(200).json([newPersonDetails]);
      return;
    } else {
      console.log(
        `No existing ${personType} details found for Gmail ${job.gmail}`
      );
    }

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

  // Handle document uploads
  if (req.files) {
    // Visa Copy
    if (req.files["visaCopy"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["visaCopy"][0].path
      );
      newPerson.visaCopy = uploadResult.url;
      fs.unlink(req.files["visaCopy"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // QID Document
    if (req.files["qidDoc"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["qidDoc"][0].path
      );
      newPerson.qidDoc = uploadResult.url;
      fs.unlink(req.files["qidDoc"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // National Address Document
    if (req.files["nationalAddressDoc"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["nationalAddressDoc"][0].path
      );
      newPerson.nationalAddressDoc = uploadResult.url;
      fs.unlink(req.files["nationalAddressDoc"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Passport Document
    if (req.files["passportDoc"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["passportDoc"][0].path
      );
      newPerson.passportDoc = uploadResult.url;
      fs.unlink(req.files["passportDoc"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // CV
    if (req.files["cv"]) {
      const uploadResult = await safeCloudinaryUpload(req.files["cv"][0].path);
      newPerson.cv = uploadResult.url;
      fs.unlink(req.files["cv"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
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

  // Create notification for person details add
  try {
    await notificationService.createNotification(
      {
        title: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } Details Added`,
        description: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } details added for ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(201).json(savedPerson);
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

  // Handle document uploads
  if (req.files) {
    // Visa Copy
    if (req.files["visaCopy"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["visaCopy"][0].path
      );
      personDetails.visaCopy = uploadResult.url;
      fs.unlink(req.files["visaCopy"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // QID Document
    if (req.files["qidDoc"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["qidDoc"][0].path
      );
      personDetails.qidDoc = uploadResult.url;
      fs.unlink(req.files["qidDoc"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // National Address Document
    if (req.files["nationalAddressDoc"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["nationalAddressDoc"][0].path
      );
      personDetails.nationalAddressDoc = uploadResult.url;
      fs.unlink(req.files["nationalAddressDoc"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Passport Document
    if (req.files["passportDoc"]) {
      const uploadResult = await safeCloudinaryUpload(
        req.files["passportDoc"][0].path
      );
      personDetails.passportDoc = uploadResult.url;
      fs.unlink(req.files["passportDoc"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // CV
    if (req.files["cv"]) {
      const uploadResult = await safeCloudinaryUpload(req.files["cv"][0].path);
      personDetails.cv = uploadResult.url;
      fs.unlink(req.files["cv"][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
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
  job.timeline.push({
    status: job.status,
    description: `${
      personType.charAt(0).toUpperCase() + personType.slice(1)
    } details updated`,
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
    await notificationService.createNotification(
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
      { "role.permissions.complianceManagement": true }
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

  // Create notification for person details removal
  try {
    await notificationService.createNotification(
      {
        title: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } Details Removed`,
        description: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } details removed from ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json({ message: "Person details removed successfully" });
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

      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

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
  job.timeline.push({
    status: job.status,
    description: "KYC documents updated",
    timestamp: new Date(),
    updatedBy: req.user._id,
  });

  await job.save();

  // Create notification for KYC documents update
  try {
    await notificationService.createNotification(
      {
        title: "KYC Documents Updated",
        description: `KYC documents updated for ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedKycDocuments);
});

// Update the uploadEngagementLetter function to share across all jobs for the same client
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
      });
    }

    // Upload engagement letter to Cloudinary with better error handling
    const { uploadToCloudinary } = require('../services/fileUploadService');
    
    const uploadResult = await uploadToCloudinary(req.file.path, {
      folder: `clients/${job.gmail}/engagement_letters`,
      resource_type: 'auto',
    });
    
    if (!uploadResult.success) {
      console.warn(`Using fallback URL due to Cloudinary upload failure: ${uploadResult.url}`);
    }
    
    // Update current job's company details
    companyDetails.engagementLetters = uploadResult.url;
    companyDetails.updatedBy = req.user._id;
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
              // Update existing company details
              otherCompanyDetails.engagementLetters = uploadResult.url;
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
                engagementLetters: uploadResult.url,
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
      await notificationService.createNotification(
        {
          title: "Engagement Letter Uploaded",
          description: `Engagement letter uploaded for ${job.clientName}'s ${job.serviceType} job.`,
          type: "job",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.permissions.complianceManagement": true }
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    res.status(200).json({
      message: "Engagement letter uploaded successfully",
      engagementLetter: companyDetails.engagementLetters,
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

  // Standard notifications
  // 1. Notify the user who completed the operation
  await notificationService.createNotification(
    {
      title: "Operation Completed",
      description: `Operation for ${job.clientName}'s ${job.serviceType} job has been marked as complete.`,
      type: "job",
      relatedTo: { model: "Job", id: job._id },
    },
    { _id: req.user._id }
  );
  
  // 2. Notify admins
  await notificationService.createNotification(
    {
      title: "Operation Completed",
      description: `Operation for ${job.clientName}'s ${job.serviceType} job has been completed by ${req.user.name}.`,
      type: "job",
      relatedTo: { model: "Job", id: job._id },
    },
    { "role.name": "admin" }
  );

  // 3. Notify KYC management (LMRO) team
  await notificationService.createNotification(
    {
      title: "Operation Completed - Ready for KYC",
      description: `The operation for job ${job._id} (${job.clientName}'s ${job.serviceType}) has been completed. Please initialize the KYC process.`,
      type: "job",
      relatedTo: { model: "Job", id: job._id },
    },
    { "role.permissions.kycManagement.lmro": true }
  );

  // 4. Special notification for management team for KYC jobs
  const isKycJob = job.serviceType && 
                  (job.serviceType.toLowerCase().includes('kyc') || 
                   job.type === 'kyc');
  
  if (isKycJob) {
    await notificationService.createNotification(
      {
        title: "KYC Job Completed by Operations",
        description: `A KYC job for ${job.clientName} (Job #${job._id}) has been completed by ${req.user.name} from Operations Management. Please review for further processing.`,
        type: "job",
        subType: "kyc", // This will use the purple shield icon
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.name": "management" }
    );

    // Process KYC-specific notifications using the dedicated service
    if (isKycJob) {
      try {
        await kycService.processCompletedKycJob(updatedJob, req.user);
      } catch (kycError) {
        // Log but don't fail the request if KYC processing has an issue
        console.error(
          `Error in KYC notification processing: ${kycError.message}`
        );
      }
    }

    // If KYC documents are missing, send an additional alert
    const kycDocuments = await KycDocument.findOne({ jobId: job._id });
    if (!kycDocuments || kycDocuments.documents.length === 0) {
      await notificationService.createNotification(
        {
          title: "KYC Documents Missing",
          description: `Attention: KYC job #${job._id} for ${job.clientName} has been completed, but no KYC documents have been uploaded. Please follow up.`,
          type: "job",
          subType: "kyc",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.name": "management" }
      );
    }

    console.log(`KYC notification sent to management team for job #${job._id}`);
  }

  res.status(200).json(updatedJob);
});


// Fix for createPreApprovedJob function in operationController.js

const createPreApprovedJob = asyncHandler(async (req, res) => {
  try {
    const {
      serviceType,
      assignedPerson,
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
      // Company details
      companyDetails,
      // Person details
      directors, // Array of director details
      shareholders, // Array of shareholder details
      secretaries, // Array of secretary details
      sefs, // Array of SEF details
      // KYC documents info
      kycDocumentInfo, // Array of descriptions and dates for uploaded files
    } = req.body;

    // Validate required fields
    if (!serviceType || !assignedPerson || !jobDetails || !clientName || !gmail || !startingPoint) {
      return res.status(400).json({ message: "Missing required job fields" });
    }

    if (!gmail.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Please provide a valid Gmail address" });
    }

    // Check for required documents
    if (!req.files["documentPassport"] || !req.files["documentID"]) {
      return res.status(400).json({ message: "Required job documents (passport and ID) are missing" });
    }

    // Start a MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log("Creating pre-approved job for:", clientName);

      // 1. Check if client exists, create if not
      let client = await Client.findOne({ gmail });
      if (!client) {
        client = new Client({
          name: clientName,
          gmail,
          startingPoint,
        });
        await client.save({ session });
        console.log("Created new client:", client._id);
      } else {
        console.log("Using existing client:", client._id);
      }

      // 2. Upload job documents
      const documentPassportUrl = await safeCloudinaryUpload(
        req.files["documentPassport"][0].path,
        { folder: `clients/${gmail}/passport` }
      );

      const documentIDUrl = await safeCloudinaryUpload(
        req.files["documentID"][0].path,
        { folder: `clients/${gmail}/id` }
      );

      const otherDocumentsUrls = req.files["otherDocuments"]
        ? await Promise.all(
            req.files["otherDocuments"].map((file) =>
              safeCloudinaryUpload(file.path, {
                folder: `clients/${gmail}/other_documents`,
              })
            )
          )
        : [];

      // Clean up temporary files
      if (req.files["documentPassport"]) {
        fs.unlink(req.files["documentPassport"][0].path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }

      if (req.files["documentID"]) {
        fs.unlink(req.files["documentID"][0].path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }

      if (req.files["otherDocuments"]) {
        req.files["otherDocuments"].forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        });
      }

      // 3. Create job with fully completed status
      const currentTime = new Date();
      const job = new Job({
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
        status: "fully_completed_bra", // Set as fully completed
        createdBy: req.user._id, // Add this line to track who created the job
        // Create a complete timeline with timestamps at 1-second intervals
        timeline: [
          {
            status: "created",
            description: "Job created by Operation Management",
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
            status: "kyc_lmro_approved",
            description: "KYC auto-approved by LMRO",
            timestamp: new Date(currentTime.getTime() + 5000),
            updatedBy: req.user._id,
          },
          {
            status: "kyc_dlmro_approved",
            description: "KYC auto-approved by DLMRO",
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
            status: "bra_lmro_approved",
            description: "BRA auto-approved by LMRO",
            timestamp: new Date(currentTime.getTime() + 9000),
            updatedBy: req.user._id,
          },
          {
            status: "bra_dlmro_approved",
            description: "BRA auto-approved by DLMRO",
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
      console.log("Created job:", savedJob._id);

      // 4. Create company details if provided
      if (companyDetails) {
        const newCompanyDetails = new CompanyDetails({
          jobId: savedJob._id,
          companyName: companyDetails.companyName || clientName,
          qfcNo: companyDetails.qfcNo || "",
          registeredAddress: companyDetails.registeredAddress || "",
          incorporationDate: companyDetails.incorporationDate || null,
          serviceType: companyDetails.serviceType || serviceType,
          mainPurpose: companyDetails.mainPurpose || "",
          expiryDate: companyDetails.expiryDate || null,
          kycActiveStatus: companyDetails.kycActiveStatus || "yes",
          updatedBy: req.user._id,
        });

        // Handle company document uploads
        if (req.files) {
          // Engagement Letters
          if (req.files["engagementLetters"]) {
            const uploadResult = await safeCloudinaryUpload(
              req.files["engagementLetters"][0].path,
              { folder: `clients/${gmail}/company/engagement_letters` }
            );
            newCompanyDetails.engagementLetters = uploadResult.url;
            fs.unlink(req.files["engagementLetters"][0].path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }

          // Company Computer Card
          if (req.files["companyComputerCard"]) {
            const uploadResult = await safeCloudinaryUpload(
              req.files["companyComputerCard"][0].path,
              { folder: `clients/${gmail}/company/computer_card` }
            );
            newCompanyDetails.companyComputerCard = uploadResult.url;
            fs.unlink(req.files["companyComputerCard"][0].path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }

          // Tax Card
          if (req.files["taxCard"]) {
            const uploadResult = await safeCloudinaryUpload(
              req.files["taxCard"][0].path,
              { folder: `clients/${gmail}/company/tax_card` }
            );
            newCompanyDetails.taxCard = uploadResult.url;
            fs.unlink(req.files["taxCard"][0].path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }

          // CR Extract
          if (req.files["crExtract"]) {
            const uploadResult = await safeCloudinaryUpload(
              req.files["crExtract"][0].path,
              { folder: `clients/${gmail}/company/cr_extract` }
            );
            newCompanyDetails.crExtract = uploadResult.url;
            fs.unlink(req.files["crExtract"][0].path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }

          // Scope of License
          if (req.files["scopeOfLicense"]) {
            const uploadResult = await safeCloudinaryUpload(
              req.files["scopeOfLicense"][0].path,
              { folder: `clients/${gmail}/company/scope_of_license` }
            );
            newCompanyDetails.scopeOfLicense = uploadResult.url;
            fs.unlink(req.files["scopeOfLicense"][0].path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }

          // Article of Associate
          if (req.files["articleOfAssociate"]) {
            const uploadResult = await safeCloudinaryUpload(
              req.files["articleOfAssociate"][0].path,
              { folder: `clients/${gmail}/company/article_of_associate` }
            );
            newCompanyDetails.articleOfAssociate = uploadResult.url;
            fs.unlink(req.files["articleOfAssociate"][0].path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }

          // Certificate of Incorporate
          if (req.files["certificateOfIncorporate"]) {
            const uploadResult = await safeCloudinaryUpload(
              req.files["certificateOfIncorporate"][0].path,
              { folder: `clients/${gmail}/company/certificate_of_incorporate` }
            );
            newCompanyDetails.certificateOfIncorporate = uploadResult.url;
            fs.unlink(req.files["certificateOfIncorporate"][0].path, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
          }
        }

        // Set expiry dates if provided
        if (companyDetails.companyComputerCardExpiry) {
          newCompanyDetails.companyComputerCardExpiry =
            companyDetails.companyComputerCardExpiry;
        }
        if (companyDetails.taxCardExpiry) {
          newCompanyDetails.taxCardExpiry = companyDetails.taxCardExpiry;
        }
        if (companyDetails.crExtractExpiry) {
          newCompanyDetails.crExtractExpiry = companyDetails.crExtractExpiry;
        }
        if (companyDetails.scopeOfLicenseExpiry) {
          newCompanyDetails.scopeOfLicenseExpiry =
            companyDetails.scopeOfLicenseExpiry;
        }

        await newCompanyDetails.save({ session });
        console.log("Created company details for job:", savedJob._id);
      }

      // 5. Create person details (directors, shareholders, etc.)
      // Process directors
      if (directors && Array.isArray(directors) && directors.length > 0) {
        for (const director of directors) {
          await createPersonDetails(
            savedJob._id,
            "director",
            director,
            req.user._id,
            req.files,
            gmail,
            session
          );
        }
        console.log(`Created ${directors.length} director records`);
      }

      // Process shareholders
      if (
        shareholders &&
        Array.isArray(shareholders) &&
        shareholders.length > 0
      ) {
        for (const shareholder of shareholders) {
          await createPersonDetails(
            savedJob._id,
            "shareholder",
            shareholder,
            req.user._id,
            req.files,
            gmail,
            session
          );
        }
        console.log(`Created ${shareholders.length} shareholder records`);
      }

      // Process secretaries
      if (secretaries && Array.isArray(secretaries) && secretaries.length > 0) {
        for (const secretary of secretaries) {
          await createPersonDetails(
            savedJob._id,
            "secretary",
            secretary,
            req.user._id,
            req.files,
            gmail,
            session
          );
        }
        console.log(`Created ${secretaries.length} secretary records`);
      }

      // Process SEFs
      if (sefs && Array.isArray(sefs) && sefs.length > 0) {
        for (const sef of sefs) {
          await createPersonDetails(
            savedJob._id,
            "sef",
            sef,
            req.user._id,
            req.files,
            gmail,
            session
          );
        }
        console.log(`Created ${sefs.length} SEF records`);
      }

      // 6. Create KYC documents collection
      let kycDocuments = [];
      let kycDocUrls = {};

      // Process and upload KYC documents first
      if (req.files["kycDocuments"] && req.files["kycDocuments"].length > 0) {
        console.log(`Processing ${req.files["kycDocuments"].length} KYC documents`);

        // Upload all KYC documents and store results
        for (let i = 0; i < req.files["kycDocuments"].length; i++) {
          const file = req.files["kycDocuments"][i];
          const uploadResult = await safeCloudinaryUpload(
            file.path,
            { folder: `clients/${gmail}/kyc_documents` }
          );

          kycDocuments.push({
            file: uploadResult.url,
            description: kycDocumentInfo && kycDocumentInfo[i] ? kycDocumentInfo[i].description : `KYC Document ${i + 1}`,
            date: kycDocumentInfo && kycDocumentInfo[i] ? kycDocumentInfo[i].date : new Date()
          });

          // Store URLs for later use in approvals
          kycDocUrls[i] = {
            url: uploadResult.url,
            fileName: file.originalname,
            fileType: file.mimetype,
            cloudinaryId: uploadResult.publicId || "manual-upload"
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
        console.log(`Created KYC documents with ${kycDocuments.length} files`);
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
      console.log("Created and completed KYC approval with documents");

      // 9. Process BRA documents similarly
      let braDocUrls = {};
      if (req.files["braDocuments"] && req.files["braDocuments"].length > 0) {
        // Upload all BRA documents and store results
        for (let i = 0; i < req.files["braDocuments"].length; i++) {
          const file = req.files["braDocuments"][i];
          const uploadResult = await safeCloudinaryUpload(
            file.path,
            { folder: `clients/${gmail}/bra_documents` }
          );

          // Store URLs for later use in approvals
          braDocUrls[i] = {
            url: uploadResult.url,
            fileName: file.originalname,
            fileType: file.mimetype,
            cloudinaryId: uploadResult.publicId || "manual-upload"
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
      console.log("Created and completed BRA approval with documents");

      // 11. Send notifications
      await notificationService.createNotification(
        {
          title: "New Pre-Approved Job Created",
          description: `A new pre-approved ${serviceType} job has been created for ${clientName} by Operation Management.`,
          type: "job",
          relatedTo: { model: "Job", id: savedJob._id },
        },
        { "role.permissions.complianceManagement": true }
      );

      // Notify assigned person
      await notificationService.createNotification(
        {
          title: "New Job Assigned",
          description: `You have been assigned to a pre-approved ${serviceType} job for ${clientName}.`,
          type: "job",
          subType: "assignment",
          relatedTo: { model: "Job", id: savedJob._id },
        },
        assignedPerson
      );

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log("Pre-approved job creation completed successfully");
      res.status(201).json({
        message: "Pre-approved job created successfully",
        job: savedJob,
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      
      console.error("Error creating pre-approved job:", error);
      res.status(500).json({ 
        message: "Failed to create pre-approved job", 
        error: error.message 
      });
    }
  } catch (error) {
    console.error("Error creating pre-approved job:", error);
    res.status(500).json({ 
      message: "Failed to create pre-approved job", 
      error: error.message 
    });
  }
});

// Helper to create person details
const createPersonDetails = async (jobId, personType, personData, userId, files, gmail, session) => {
  // Validate personData
  if (!personData || !personData.name) {
    console.log(`Skipping ${personType} record due to missing required data`);
    return null;
  }

  const newPerson = new PersonDetails({
    jobId,
    personType,
    name: personData.name,
    nationality: personData.nationality || "",
    qidNo: personData.qidNo || "",
    qidExpiry: personData.qidExpiry || null,
    nationalAddress: personData.nationalAddress || "",
    nationalAddressExpiry: personData.nationalAddressExpiry || null,
    passportNo: personData.passportNo || "",
    passportExpiry: personData.passportExpiry || null,
    mobileNo: personData.mobileNo || "",
    email: personData.email || "",
    updatedBy: userId,
  });

  // Process document uploads for person
  if (files) {
    // Each person type has its own field names for documents
    const fieldPrefix = personType.toLowerCase();

    // Visa Copy
    if (files[`${fieldPrefix}VisaCopy`]) {
      const uploadResult = await safeCloudinaryUpload(
        files[`${fieldPrefix}VisaCopy`][0].path,
        { folder: `clients/${gmail}/people/${personType}/visa` }
      );
      newPerson.visaCopy = uploadResult.url;
      fs.unlink(files[`${fieldPrefix}VisaCopy`][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // QID Document
    if (files[`${fieldPrefix}QidDoc`]) {
      const uploadResult = await safeCloudinaryUpload(
        files[`${fieldPrefix}QidDoc`][0].path,
        { folder: `clients/${gmail}/people/${personType}/qid` }
      );
      newPerson.qidDoc = uploadResult.url;
      fs.unlink(files[`${fieldPrefix}QidDoc`][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // National Address Document
    if (files[`${fieldPrefix}NationalAddressDoc`]) {
      const uploadResult = await safeCloudinaryUpload(
        files[`${fieldPrefix}NationalAddressDoc`][0].path,
        { folder: `clients/${gmail}/people/${personType}/national_address` }
      );
      newPerson.nationalAddressDoc = uploadResult.url;
      fs.unlink(files[`${fieldPrefix}NationalAddressDoc`][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // Passport Document
    if (files[`${fieldPrefix}PassportDoc`]) {
      const uploadResult = await safeCloudinaryUpload(
        files[`${fieldPrefix}PassportDoc`][0].path,
        { folder: `clients/${gmail}/people/${personType}/passport` }
      );
      newPerson.passportDoc = uploadResult.url;
      fs.unlink(files[`${fieldPrefix}PassportDoc`][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // CV
    if (files[`${fieldPrefix}Cv`]) {
      const uploadResult = await safeCloudinaryUpload(
        files[`${fieldPrefix}Cv`][0].path,
        { folder: `clients/${gmail}/people/${personType}/cv` }
      );
      newPerson.cv = uploadResult.url;
      fs.unlink(files[`${fieldPrefix}Cv`][0].path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }
  }

  await newPerson.save({ session });
  return newPerson;
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

module.exports = {
  getCompanyDetails,
  updateCompanyDetails,
  getPersonDetails,
  addPersonDetails,
  updatePersonDetails,
  deletePersonDetails,
  getKycDocuments,
  updateKycDocuments,
  uploadEngagementLetter,
  completeOperation,
  createPreApprovedJob,
  getPersonFieldHistory,
};
