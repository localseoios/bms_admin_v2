const Job = require("../models/Job");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const notificationService = require("../services/notificationService");
const emailService = require("../services/emailService");
const Client = require("../models/Client");
const User = require("../models/userModel");

const { PersonDetails, CompanyDetails, KycDocument, BraDocument, OtherDocumentsDetails, UboDetails, CddDetails } = require("../models/OperationModels");

// Helper function to safely upload to Cloudinary with fallback
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

// Helper function to check if job number exists
const checkJobNumberExists = async (jobNumber) => {
  const existingJob = await Job.findOne({ jobNumber });
  return !!existingJob;
};

// FIXED: Enhanced search function with proper error handling
const searchJobsWithPersonDetails = asyncHandler(async (req, res) => {
  try {
    const { query, status } = req.query;
    
    console.log('Search request received:', { query, status });
    
    if (!query || query.trim().length < 2) {
      console.log('Query too short, returning regular jobs');
      return getAllJobs(req, res);
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    // Build status filter
    let statusFilter = {};
    if (status && status !== 'all') {
      statusFilter = { status };
    }

    console.log('Search filters:', { query: query.trim(), statusFilter });

    // FIXED: Search in Jobs collection (removed problematic _id regex)
    const jobMatches = await Job.find({
      ...statusFilter,
      $or: [
        { jobNumber: searchRegex },
        { clientName: searchRegex },
        { serviceType: searchRegex },
        { jobDetails: searchRegex },
        { gmail: searchRegex },
        { specialDescription: searchRegex }
      ]
    }).distinct('_id');

    console.log(`Found ${jobMatches.length} job matches`);

    // FIXED: Search in PersonDetails collection with proper error handling
    let personMatches = [];
    try {
      personMatches = await PersonDetails.find({
        $or: [
          { name: searchRegex },
          { nationality: searchRegex },
          { qidNo: searchRegex },
          { nationalAddress: searchRegex },
          { passportNo: searchRegex },
          { mobileNo: searchRegex },
          { email: searchRegex }
        ]
      }).distinct('jobId');
      console.log(`Found ${personMatches.length} person detail matches`);
    } catch (personError) {
      console.error('Error searching PersonDetails:', personError.message);
      personMatches = [];
    }

    // FIXED: Search in CompanyDetails collection with proper error handling
    let companyMatches = [];
    try {
      companyMatches = await CompanyDetails.find({
        $or: [
          { companyName: searchRegex },
          { qfcNo: searchRegex },
          { registeredAddress: searchRegex },
          { serviceType: searchRegex },
          { mainPurpose: searchRegex }
        ]
      }).distinct('jobId');
      console.log(`Found ${companyMatches.length} company detail matches`);
    } catch (companyError) {
      console.error('Error searching CompanyDetails:', companyError.message);
      companyMatches = [];
    }

    // FIXED: Combine all matching job IDs with proper ObjectId handling
    const allJobIds = [...new Set([
      ...jobMatches.map(id => id.toString()),
      ...personMatches.map(id => id.toString()),
      ...companyMatches.map(id => id.toString())
    ])];

    console.log(`Total unique job IDs found: ${allJobIds.length}`);

    if (allJobIds.length === 0) {
      console.log('No matches found, returning empty array');
      return res.status(200).json([]);
    }

    // FIXED: Fetch complete job data with proper ObjectId conversion
    const jobs = await Job.find({ 
      _id: { $in: allJobIds.map(id => id) },
      ...statusFilter
    })
    .populate("clientId", "name gmail startingPoint")
    .populate("assignedPerson", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

    console.log(`Retrieved ${jobs.length} complete job records`);

    // OPTIMIZED: Get all person and company details in bulk
    const jobIds = jobs.map(job => job._id);
    
    const [allPersonDetails, allCompanyDetails] = await Promise.all([
      PersonDetails.find({ jobId: { $in: jobIds } })
        .select('jobId personType name nationality qidNo passportNo mobileNo email')
        .lean(),
      CompanyDetails.find({ jobId: { $in: jobIds } })
        .select('jobId companyName qfcNo registeredAddress serviceType mainPurpose')
        .lean()
    ]);

    // Create lookup maps for efficient access
    const personDetailsMap = {};
    const companyDetailsMap = {};

    allPersonDetails.forEach(person => {
      const jobIdStr = person.jobId.toString();
      if (!personDetailsMap[jobIdStr]) {
        personDetailsMap[jobIdStr] = [];
      }
      personDetailsMap[jobIdStr].push(person);
    });

    allCompanyDetails.forEach(company => {
      const jobIdStr = company.jobId.toString();
      companyDetailsMap[jobIdStr] = company;
    });

    // OPTIMIZED: Process jobs with search match context
    const jobsWithPersonDetails = jobs.map(job => {
      const jobObj = job.toObject();
      const jobIdStr = job._id.toString();
      
      const personDetails = personDetailsMap[jobIdStr] || [];
      const companyDetails = companyDetailsMap[jobIdStr] || null;

      // Add search match context
      const searchMatches = [];
      
      // Check what matched in job itself
      ['jobNumber', 'clientName', 'serviceType', 'jobDetails', 'gmail', 'specialDescription'].forEach(field => {
        if (job[field] && typeof job[field] === 'string' && searchRegex.test(job[field])) {
          searchMatches.push(`Job: ${field} - ${job[field]}`);
        }
      });
      
      // Check what matched in person details
      personDetails.forEach(person => {
        ['name', 'nationality', 'qidNo', 'passportNo', 'mobileNo', 'email'].forEach(field => {
          if (person[field] && typeof person[field] === 'string' && searchRegex.test(person[field])) {
            searchMatches.push(`${person.personType}: ${field} - ${person[field]}`);
          }
        });
      });

      // Check what matched in company details
      if (companyDetails) {
        ['companyName', 'qfcNo', 'registeredAddress', 'serviceType', 'mainPurpose'].forEach(field => {
          if (companyDetails[field] && typeof companyDetails[field] === 'string' && searchRegex.test(companyDetails[field])) {
            searchMatches.push(`Company: ${field} - ${companyDetails[field]}`);
          }
        });
      }

      return {
        ...jobObj,
        personDetails,
        companyDetails,
        searchMatches: searchMatches.slice(0, 3) // Limit to 3 matches for display
      };
    });

    console.log(`Returning ${jobsWithPersonDetails.length} jobs with enhanced search data`);
    res.status(200).json(jobsWithPersonDetails);

  } catch (error) {
    console.error("Error in enhanced search:", error);
    res.status(500).json({
      message: "Error searching jobs",
      error: error.message,
    });
  }
});




const createJob = async (req, res) => {
  try {
    const {
      jobNumber,
      serviceType,
      assignedPerson,
      selectedServiceUser,
      selectedServiceUsers,
      jobDetails,
      specialDescription,
      clientName,
      gmail,
      startingPoint,
      crNo,
      contactNumber,
      address,
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
      const nextClientCode = await Client.getNextClientCode();
      client = new Client({
        name: clientName,
        gmail,
        startingPoint,
        clientCode: nextClientCode,
        crNo: crNo || '',
        contactNumber: contactNumber || '',
        address: address || ''
      });
      await client.save();
    } else {
      // Update existing client with crNo, contactNumber and address if provided
      if (crNo !== undefined || contactNumber !== undefined || address !== undefined) {
        const updateFields = {};
        if (crNo !== undefined) updateFields.crNo = crNo;
        if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
        if (address !== undefined) updateFields.address = address;
        await Client.findByIdAndUpdate(client._id, updateFields);
      }
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

    // Parse selectedServiceUsers if it's a JSON string
    let parsedServiceUsers = [];
    if (selectedServiceUsers) {
      try {
        parsedServiceUsers = typeof selectedServiceUsers === 'string'
          ? JSON.parse(selectedServiceUsers)
          : selectedServiceUsers;
      } catch (e) {
        console.log("Error parsing selectedServiceUsers:", e);
      }
    }

    const job = new Job({
      jobNumber,
      clientId: client._id,
      serviceType,
      documentPassport: documentPassportUrl,
      documentID: documentIDUrl,
      otherDocuments: otherDocumentsUrls,
      assignedPerson: assignedPerson || null,
      selectedServiceUser: selectedServiceUser || null,
      selectedServiceUsers: parsedServiceUsers,
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

    // Notify job creator and assigned person
    await notificationService.createJobNotification(
      {
        title: "New Job Created",
        description: `A new ${serviceType} job (${jobNumber}) has been created for ${clientName}.`,
        type: "job",
        relatedTo: { model: "Job", id: savedJob._id },
      },
      savedJob,
      req.user._id
    );

    // Additional notifications for auto-approved jobs
    if (clientExists && assignedPerson) {
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
      .populate("clientId", "name gmail startingPoint crNo contactNumber address")
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

const getAllJobsAdmin = asyncHandler(async (req, res) => {
  try {
    console.log("=== getAllJobsAdmin START ===");
    console.log("Time:", new Date().toISOString());

    const startTime = Date.now();

    const jobCount = await Job.countDocuments();
    console.log("Total jobs in DB:", jobCount);

    const jobs = await Job.find()
      .select("-timeline -otherDocuments")
      .populate("clientId", "name gmail startingPoint crNo contactNumber address")
      .populate("assignedPerson", "name email")
      .populate("selectedServiceUsers", "name email role")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const endTime = Date.now();
    console.log(`Query took ${endTime - startTime}ms, returned ${jobs.length} jobs`);
    console.log("=== getAllJobsAdmin END ===");

    res.status(200).json(jobs);
  } catch (error) {
    console.error("=== getAllJobsAdmin ERROR ===");
    console.error("Error in getAllJobsAdmin:", error);
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
    await notificationService.createJobNotification(
      {
        title: "Job Approved",
        description: `The ${job.serviceType} job for ${job.clientName} has been approved by ${req.user.name}.`,
        type: "job",
        subType: "approval",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
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
    await notificationService.createJobNotification(
      {
        title: "Job Rejected",
        description: `The ${job.serviceType} job for ${job.clientName} has been rejected by ${req.user.name}: ${rejectionReason}`,
        type: "job",
        subType: "rejection",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
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
    await notificationService.createJobNotification(
      {
        title: "Job Cancelled",
        description: `The ${job.serviceType} job for ${job.clientName} has been cancelled by ${req.user.name}. Reason: ${cancellationReason}`,
        type: "job",
        subType: "cancellation",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
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
        if (result.success) {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        }
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
    const resubmitDescription = resubmitNotes
      ? `The ${job.serviceType} job for ${job.clientName} has been resubmitted by ${req.user.name}. Notes: ${resubmitNotes}`
      : `The ${job.serviceType} job for ${job.clientName} has been resubmitted by ${req.user.name} with corrections.`;

    await notificationService.createJobNotification(
      {
        title: "Job Resubmitted",
        description: resubmitDescription,
        type: "job",
        relatedTo: { model: "Job", id: job._id },
      },
      job,
      req.user._id
    );
  } catch (notificationError) {
    console.error("Error creating notification:", notificationError);
  }

  res.status(200).json(updatedJob);
});

// New function to get job timeline
const getJobTimeline = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("timeline.updatedBy", "name email");
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
    console.log('=== UPDATE JOB CONTROLLER CALLED ===');
    console.log('Job ID:', req.params.id);
    console.log('Request body:', req.body);

    const job = await Job.findById(req.params.id).populate('selectedServiceUsers', 'name email');
    if (!job) {
      res.status(404);
      throw new Error("Job not found");
    }

    const oldServiceUsers = (job.selectedServiceUsers || []).map(u => u._id.toString());

    console.log('Found job:', job._id, 'current gmail:', job.gmail, 'current startingPoint:', job.startingPoint);

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
      address,
      selectedServiceUsers,
    } = req.body;

    console.log('Extracted from body - gmail:', gmail, 'startingPoint:', startingPoint, 'clientName:', clientName);

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
        if (result.success) {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        }
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

    // Parse selectedServiceUsers if it's a JSON string
    let parsedServiceUsers = undefined;
    if (selectedServiceUsers !== undefined) {
      try {
        parsedServiceUsers = typeof selectedServiceUsers === 'string'
          ? JSON.parse(selectedServiceUsers)
          : selectedServiceUsers;
      } catch (e) {
        console.log("Error parsing selectedServiceUsers in update:", e);
        parsedServiceUsers = [];
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
      ...(parsedServiceUsers !== undefined && { selectedServiceUsers: parsedServiceUsers }),
      ...updatedDocuments,
    };

    const oldClientGmail = job.gmail;
    const newClientGmail = gmail || job.gmail;
    const isEmailChanged = gmail && gmail !== job.gmail;

    if (isEmailChanged) {
      console.log('=== EMAIL CHANGE DETECTED ===');
      console.log('Old email:', oldClientGmail);
      console.log('New email:', gmail);

      const existingClient = await Client.findOne({ gmail: gmail });

      if (existingClient) {
        console.log('Email already exists for another client:', existingClient._id);
        return res.status(400).json({
          message: "This email already belongs to another client. Please use a different email address.",
        });
      }

      console.log('Creating new client with email:', gmail);
      const nextClientCode = await Client.getNextClientCode();
      const newClient = new Client({
        name: clientName || job.clientName,
        gmail: gmail,
        startingPoint: startingPoint || job.startingPoint,
        clientCode: nextClientCode,
        crNo: crNo !== undefined ? crNo : '',
        contactNumber: contactNumber !== undefined ? contactNumber : '',
        address: address !== undefined ? address : ''
      });
      await newClient.save();
      console.log('Created new client:', newClient._id);

      updateFields.clientId = newClient._id;
      console.log('Job will be linked to new client:', newClient._id);
    } else if (oldClientGmail && (startingPoint || clientName || crNo !== undefined || contactNumber !== undefined || address !== undefined)) {
      const clientUpdateFields = {};
      if (startingPoint) clientUpdateFields.startingPoint = startingPoint;
      if (clientName) clientUpdateFields.name = clientName;
      if (crNo !== undefined) clientUpdateFields.crNo = crNo;
      if (contactNumber !== undefined) clientUpdateFields.contactNumber = contactNumber;
      if (address !== undefined) clientUpdateFields.address = address;

      await Client.findOneAndUpdate(
        { gmail: oldClientGmail },
        clientUpdateFields,
        { new: true }
      );
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate("clientId", "name gmail startingPoint crNo contactNumber address")
      .populate("assignedPerson", "name email")
      .populate("createdBy", "name email")
      .populate("selectedServiceUsers", "name email role");

    updatedJob.timeline.push({
      status: "updated",
      description: `Job details updated by ${req.user.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    const newServiceUsers = parsedServiceUsers !== undefined
      ? (parsedServiceUsers || []).map(u => typeof u === 'string' ? u : u.toString())
      : oldServiceUsers;

    const addedUsers = newServiceUsers.filter(u => !oldServiceUsers.includes(u));
    const removedUsers = oldServiceUsers.filter(u => !newServiceUsers.includes(u));

    if (addedUsers.length > 0) {
      const addedUserDetails = await User.find({ _id: { $in: addedUsers } }).select('name');
      const addedNames = addedUserDetails.map(u => u.name).join(', ');
      updatedJob.timeline.push({
        status: "user_assigned",
        description: `Users assigned to job: ${addedNames}`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
    }

    if (removedUsers.length > 0) {
      const removedUserDetails = await User.find({ _id: { $in: removedUsers } }).select('name');
      const removedNames = removedUserDetails.map(u => u.name).join(', ');
      updatedJob.timeline.push({
        status: "user_removed",
        description: `Users removed from job: ${removedNames}`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
    }

    await updatedJob.save();

    // Create notifications for job update
    try {
      await notificationService.createJobNotification(
        {
          title: "Job Updated",
          description: `The ${updatedJob.serviceType} job (${updatedJob.jobNumber}) for ${updatedJob.clientName} has been updated by ${req.user.name}.`,
          type: "job",
          relatedTo: { model: "Job", id: updatedJob._id },
        },
        updatedJob,
        req.user._id
      );

      if (assignedPerson && assignedPerson !== job.assignedPerson?.toString()) {
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

      if (addedUsers.length > 0) {
        const addedUserDetails = await User.find({ _id: { $in: addedUsers } }).select('name email');
        for (const user of addedUserDetails) {
          await notificationService.createNotification(
            {
              title: "Job Assignment",
              description: `You have been assigned to job ${updatedJob.jobNumber} for ${updatedJob.clientName}.`,
              type: "job",
              subType: "assignment",
              relatedTo: { model: "Job", id: updatedJob._id },
            },
            user._id.toString()
          );

          if (user.email) {
            emailService.sendJobAssignmentEmail(
              user.email,
              user.name,
              updatedJob.clientName,
              updatedJob.jobNumber,
              updatedJob.serviceType,
              req.user.name
            ).catch(err => console.error('Error sending assignment email:', err));
          }
        }
      }

      if (removedUsers.length > 0) {
        const removedUserDetails = await User.find({ _id: { $in: removedUsers } }).select('name email');
        for (const user of removedUserDetails) {
          await notificationService.createNotification(
            {
              title: "Job Removal",
              description: `You have been removed from job ${updatedJob.jobNumber} for ${updatedJob.clientName}.`,
              type: "job",
              subType: "removal",
              relatedTo: { model: "Job", id: updatedJob._id },
            },
            user._id.toString()
          );

          if (user.email) {
            emailService.sendJobRemovalEmail(
              user.email,
              user.name,
              updatedJob.clientName,
              updatedJob.jobNumber,
              updatedJob.serviceType,
              req.user.name
            ).catch(err => console.error('Error sending removal email:', err));
          }
        }
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

const addOtherDocument = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await safeCloudinaryUpload(req.file.path);

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        message: "Failed to upload document",
        error: uploadResult.error
      });
    }

    job.otherDocuments = job.otherDocuments || [];
    job.otherDocuments.push(uploadResult.url);

    job.timeline.push({
      status: "updated",
      description: `Document added to Other Documents by ${req.user.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await job.save();

    res.status(200).json({
      message: "Document added successfully",
      otherDocuments: job.otherDocuments,
    });
  } catch (error) {
    console.error("Error adding document:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

const deleteOtherDocument = asyncHandler(async (req, res) => {
  try {
    const { id, index } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!job.otherDocuments || job.otherDocuments.length === 0) {
      return res.status(404).json({ message: "No documents found" });
    }

    const docIndex = parseInt(index);
    if (docIndex < 0 || docIndex >= job.otherDocuments.length) {
      return res.status(400).json({ message: "Invalid document index" });
    }

    job.otherDocuments.splice(docIndex, 1);

    job.timeline.push({
      status: "updated",
      description: `Document removed from Other Documents by ${req.user.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await job.save();

    res.status(200).json({
      message: "Document deleted successfully",
      otherDocuments: job.otherDocuments,
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

const replaceOtherDocument = asyncHandler(async (req, res) => {
  try {
    const { id, index } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!job.otherDocuments || job.otherDocuments.length === 0) {
      return res.status(404).json({ message: "No documents found" });
    }

    const docIndex = parseInt(index);
    if (docIndex < 0 || docIndex >= job.otherDocuments.length) {
      return res.status(400).json({ message: "Invalid document index" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await safeCloudinaryUpload(req.file.path);

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        message: "Failed to upload document",
        error: uploadResult.error
      });
    }

    job.otherDocuments[docIndex] = uploadResult.url;

    job.timeline.push({
      status: "updated",
      description: `Document replaced in Other Documents by ${req.user.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await job.save();

    res.status(200).json({
      message: "Document replaced successfully",
      otherDocuments: job.otherDocuments,
    });
  } catch (error) {
    console.error("Error replacing document:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find({})
      .select("jobNumber clientId clientName serviceType status createdAt assignedPerson")
      .populate("clientId", "name gmail")
      .populate("assignedPerson", "name")
      .sort({ createdAt: -1 })
      .lean();

    const totalJobs = jobs.length;
    const approvedJobs = jobs.filter(j => j.status === "approved").length;
    const cancelledJobs = jobs.filter(j => j.status === "cancelled").length;
    const completedJobs = jobs.filter(j => ["completed", "fully_completed_bra"].includes(j.status)).length;

    const statusCounts = {};
    jobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });

    const recentJobs = jobs.slice(0, 10);

    res.status(200).json({
      totalJobs,
      approvedJobs,
      cancelledJobs,
      completedJobs,
      statusCounts,
      recentJobs,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
  }
});

const deleteJob = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log("=== DELETE JOB START ===");
    console.log("Job ID to delete:", id);

    const job = await Job.findById(id);
    if (!job) {
      console.log("Job not found");
      return res.status(404).json({ message: "Job not found" });
    }

    const deletedData = {
      jobId: job._id,
      jobNumber: job.jobNumber,
      clientName: job.clientName,
      serviceType: job.serviceType,
    };
    console.log("Job found:", deletedData);

    const deletionTime = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    console.log("Creating notification for job parties...");
    const notification = await notificationService.createJobNotification(
      {
        title: "Job Deleted",
        description: `Job "${deletedData.jobNumber || id}" for client "${deletedData.clientName}" (${deletedData.serviceType}) has been permanently deleted by ${req.user.name} on ${deletionTime}.`,
        type: "job",
        subType: "deletion",
        relatedTo: { model: "Job", id: null },
      },
      job,
      req.user._id
    );
    console.log("Notification created:", notification?._id, "Recipients:", notification?.recipients?.length);

    console.log("Deleting related data...");
    const deleteResults = await Promise.all([
      CompanyDetails.deleteMany({ jobId: id }),
      PersonDetails.deleteMany({ jobId: id }),
      KycDocument.deleteMany({ jobId: id }),
      BraDocument.deleteMany({ jobId: id }),
      OtherDocumentsDetails.deleteMany({ jobId: id }),
      UboDetails.deleteMany({ jobId: id }),
      CddDetails.deleteMany({ jobId: id }),
    ]);

    console.log("Deleting job...");
    await Job.findByIdAndDelete(id);

    const totalDeleted = {
      companyDetails: deleteResults[0].deletedCount,
      personDetails: deleteResults[1].deletedCount,
      kycDocuments: deleteResults[2].deletedCount,
      braDocuments: deleteResults[3].deletedCount,
      otherDocuments: deleteResults[4].deletedCount,
      uboDetails: deleteResults[5].deletedCount,
      cddDetails: deleteResults[6].deletedCount,
    };

    console.log(`Job ${deletedData.jobNumber || id} deleted with related data:`, totalDeleted);
    console.log("=== DELETE JOB SUCCESS ===");

    res.status(200).json({
      message: "Job and all related data deleted successfully",
      deletedJob: deletedData,
      deletedRelatedData: totalDeleted,
    });
  } catch (error) {
    console.error("=== DELETE JOB ERROR ===");
    console.error("Error deleting job:", error);
    res.status(500).json({
      message: "Failed to delete job",
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
  searchJobsWithPersonDetails,
  addOtherDocument,
  deleteOtherDocument,
  replaceOtherDocument,
  getDashboardStats,
  deleteJob,
};
