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
    const placeholder = `http://localhost:5000/temp-uploads/${path.basename(
      filePath
    )}`;
    return { success: false, url: placeholder, error: error.message };
  }
};

// Get company details for a job
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

  if (!companyDetails) {
    // Create empty company details if it doesn't exist
    companyDetails = new CompanyDetails({
      jobId,
      companyName: job.clientName || "",
      updatedBy: req.user._id,
    });
    await companyDetails.save();
  }

  res.status(200).json(companyDetails);
});

// Update company details - fixed version
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

  // Find company details - FIXED APPROACH
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

  // Create notification for company details update
  try {
    await notificationService.createNotification(
      {
        title: "Company Details Updated",
        description: `Company details updated for ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedCompanyDetails);
});

// Get person details (directors, shareholders, secretaries, SEF)
const getPersonDetails = asyncHandler(async (req, res) => {
  const { jobId, personType } = req.params;

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
    throw new Error("You are not authorized to view this job");
  }

  // Get person details
  const personDetails = await PersonDetails.find({
    jobId,
    personType,
  });

  // If no entries found, create a default one
  if (personDetails.length === 0 && personType === "director") {
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

// Update person details
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

  // Update text fields
  if (name) personDetails.name = name;
  if (nationality) personDetails.nationality = nationality;
  if (qidNo) personDetails.qidNo = qidNo;
  if (qidExpiry) personDetails.qidExpiry = qidExpiry;
  if (nationalAddress) personDetails.nationalAddress = nationalAddress;
  if (nationalAddressExpiry)
    personDetails.nationalAddressExpiry = nationalAddressExpiry;
  if (passportNo) personDetails.passportNo = passportNo;
  if (passportExpiry) personDetails.passportExpiry = passportExpiry;
  if (mobileNo) personDetails.mobileNo = mobileNo;
  if (email) personDetails.email = email;
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

  // Create notification for person details update
  try {
    await notificationService.createNotification(
      {
        title: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } Details Updated`,
        description: `${
          personType.charAt(0).toUpperCase() + personType.slice(1)
        } details updated for ${job.clientName}'s ${job.serviceType} job.`,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      { "role.permissions.complianceManagement": true }
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedPerson);
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

// Update the uploadEngagementLetter function in operationController.js

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

    // Find or create company details
    let companyDetails = await CompanyDetails.findOne({ jobId });

    if (!companyDetails) {
      console.log(`Creating new company details for job ${jobId}`);
      companyDetails = new CompanyDetails({
        jobId,
        companyName: job.clientName || "",
        updatedBy: req.user._id,
      });
    }

    // Import the improved file upload service
    const { uploadToCloudinary } = require('../services/fileUploadService');
    
    // Upload engagement letter to Cloudinary with better error handling
    const uploadResult = await uploadToCloudinary(req.file.path, {
      folder: `jobs/${jobId}/documents`,
      resource_type: 'auto',
    });
    
    if (!uploadResult.success) {
      console.warn(`Using fallback URL due to Cloudinary upload failure: ${uploadResult.url}`);
    }
    
    companyDetails.engagementLetters = uploadResult.url;
    companyDetails.updatedBy = req.user._id;

    // Clean up temporary file after successful upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error(`Error deleting temp file ${req.file.path}:`, err);
    });

    const updatedCompanyDetails = await companyDetails.save();
    console.log(`Company details updated with engagement letter: ${uploadResult.url}`);

    // Add a timeline entry for the job
    job.timeline.push({
      status: job.status,
      description: "Engagement letter uploaded",
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await job.save();

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
};
