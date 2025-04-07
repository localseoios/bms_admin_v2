// controllers/monthlyPaymentController.js
const MonthlyPayment = require("../models/MonthlyPayment");
const Job = require("../models/Job");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const notificationService = require("../services/notificationService");

// Helper function to safely upload to Cloudinary with improved debugging
const safeCloudinaryUpload = async (filePath, options = {}) => {
  try {
    console.log(
      `[Upload] Attempting to upload file to Cloudinary: ${filePath}`
    );
    console.log(`[Upload] File exists: ${fs.existsSync(filePath)}`);

    // Check if file exists before uploading
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats for debugging
    const stats = fs.statSync(filePath);
    console.log(`[Upload] File size: ${stats.size} bytes`);

    // Set default folder if not provided
    const uploadOptions = {
      folder: options.folder || "monthly-payments",
      resource_type: "auto", // Auto-detect resource type
      timeout: 60000, // 60 seconds timeout
      ...options,
    };

    console.log(
      `[Upload] Cloudinary options: ${JSON.stringify(uploadOptions)}`
    );

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    console.log(`[Upload] Success! URL: ${result.secure_url}`);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error(`[Upload] Cloudinary upload error for ${filePath}:`, error);

    // Create a fallback URL to serve the file locally
    const filename = path.basename(filePath);
    const fallbackUrl = `/files/${filename}`;

    // Try to keep the file in temp directory if Cloudinary upload fails
    try {
      const tempDir = path.join(__dirname, "../temp-uploads");
      const tempFilename = `payment-${Date.now()}-${filename}`;
      const tempPath = path.join(tempDir, tempFilename);

      // Copy the file to ensure it remains accessible
      fs.copyFileSync(filePath, tempPath);
      console.log(`[Upload] Created fallback file: ${tempPath}`);

      return {
        success: false,
        url: `/files/${tempFilename}`,
        error: error.message,
      };
    } catch (copyError) {
      console.error(`[Upload] Failed to create fallback file:`, copyError);
      return {
        success: false,
        url: fallbackUrl,
        error: `${error.message}. Fallback copy also failed: ${copyError.message}`,
      };
    }
  }
};

// Add new monthly payment record
const addMonthlyPayment = asyncHandler(async (req, res) => {
  console.log("[AddPayment] Starting payment record creation");
  console.log("[AddPayment] Request body:", req.body);
  console.log(
    "[AddPayment] Files:",
    req.files ? `${req.files.length} files` : "No files"
  );

  const { jobId, jobType, year, month, invoices } = req.body;

  // Validate input
  if (
    !jobId ||
    !jobType ||
    year === undefined ||
    month === undefined ||
    !invoices
  ) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  // Convert month and year to numbers
  const numYear = Number(year);
  const numMonth = Number(month);

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Check if a record for this month and year already exists
  const existingRecord = await MonthlyPayment.findOne({
    jobId,
    year: numYear,
    month: numMonth,
  });

  if (existingRecord) {
    res.status(400);
    throw new Error("A payment record for this month and year already exists");
  }

  try {
    // Parse invoices data
    let parsedInvoices;
    try {
      parsedInvoices =
        typeof invoices === "string" ? JSON.parse(invoices) : invoices;
      console.log("[AddPayment] Parsed invoices:", parsedInvoices);
    } catch (parseError) {
      console.error("[AddPayment] Invoice parsing error:", parseError);
      res.status(400);
      throw new Error(`Failed to parse invoice data: ${parseError.message}`);
    }

    const invoiceData = Array.isArray(parsedInvoices)
      ? parsedInvoices
      : Object.values(parsedInvoices).map((invoice, index) => ({
          ...invoice,
          fileIndex: invoice.fileIndex || index,
        }));

    console.log("[AddPayment] Processed invoice data:", invoiceData);

    // Handle file uploads if present
    if (req.files && req.files.length > 0) {
      console.log(
        `[AddPayment] Processing ${req.files.length} files for upload`
      );

      const uploadPromises = req.files.map(async (file, index) => {
        console.log(
          `[AddPayment] File ${index}: ${file.originalname}, size: ${file.size}`
        );
        console.log(`[AddPayment] File path: ${file.path}`);

        // Make sure Cloudinary is properly configured
        if (
          !process.env.CLOUDINARY_CLOUD_NAME ||
          !process.env.CLOUDINARY_API_KEY ||
          !process.env.CLOUDINARY_API_SECRET
        ) {
          console.error("[AddPayment] Missing Cloudinary credentials");
          return {
            fileIndex: index,
            url: `/files/${path.basename(file.path)}`,
            fileName: file.originalname,
            error: "Cloudinary credentials missing",
          };
        }

        try {
          const uploadResult = await safeCloudinaryUpload(file.path, {
            folder: `monthly-payments/${jobId}/${numYear}/${numMonth}`,
          });

          // Don't delete the file in case of upload failure
          if (uploadResult.success) {
            // Clean up temp file only if successfully uploaded to Cloudinary
            fs.unlink(file.path, (err) => {
              if (err)
                console.error(
                  `[AddPayment] Error deleting temp file ${file.path}:`,
                  err
                );
            });
          }

          return {
            fileIndex: index,
            url: uploadResult.url,
            fileName: file.originalname,
            public_id: uploadResult.public_id,
            success: uploadResult.success,
          };
        } catch (uploadError) {
          console.error(
            `[AddPayment] Error uploading file ${file.originalname}:`,
            uploadError
          );
          return {
            fileIndex: index,
            url: `/files/${path.basename(file.path)}`,
            fileName: file.originalname,
            error: uploadError.message,
          };
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log(
        "[AddPayment] File upload results:",
        uploadedFiles.map((f) => ({
          fileIndex: f.fileIndex,
          success: f.success,
          fileName: f.fileName,
        }))
      );

      // Assign file URLs to corresponding invoices
      uploadedFiles.forEach((file) => {
        const invoiceIndex = invoiceData.findIndex(
          (inv) => inv.fileIndex == file.fileIndex
        );

        if (invoiceIndex !== -1) {
          console.log(
            `[AddPayment] Assigned file to invoice at index ${invoiceIndex}`
          );
          invoiceData[invoiceIndex].fileUrl = file.url;
          invoiceData[invoiceIndex].fileName = file.fileName;
        } else {
          console.log(
            `[AddPayment] Could not find invoice with fileIndex ${file.fileIndex}`
          );
        }
      });
    }

    // Create the monthly payment record
    const monthlyPayment = new MonthlyPayment({
      jobId,
      jobType,
      year: numYear,
      month: numMonth,
      invoices: invoiceData.map((invoice) => ({
        invoiceDate: invoice.invoiceDate,
        description: invoice.description,
        amount: parseFloat(invoice.amount),
        option: invoice.option,
        paymentMethod: invoice.paymentMethod,
        fileUrl: invoice.fileUrl,
        fileName: invoice.fileName,
      })),
      createdBy: req.user._id,
    });

    const savedRecord = await monthlyPayment.save();
    console.log(
      `[AddPayment] Monthly payment record saved with ID: ${savedRecord._id}`
    );

    // Create notification
    try {
      await notificationService.createNotification(
        {
          title: "Monthly Payment Added",
          description: `A new payment record for ${job.clientName}'s ${jobType} service has been added for ${monthlyPayment.monthName} ${numYear}.`,
          type: "payment",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.permissions.operationManagement": true }
      );
      console.log("[AddPayment] Notification created");
    } catch (notifyError) {
      console.error("[AddPayment] Failed to create notification:", notifyError);
    }

    res.status(201).json(savedRecord);
  } catch (error) {
    console.error("[AddPayment] Failed to add monthly payment:", error);
    res.status(500);
    throw new Error(`Failed to add monthly payment: ${error.message}`);
  }
});

// Get payment history for a job
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  console.log(`[GetHistory] Fetching payment history for job: ${jobId}`);

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Get all payment records for this job
  const paymentRecords = await MonthlyPayment.find({ jobId })
    .sort({ year: -1, month: -1 }) // Sort by year and month in descending order
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  console.log(`[GetHistory] Found ${paymentRecords.length} payment records`);

  res.status(200).json(paymentRecords);
});

// Update an existing payment record
const updateMonthlyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, invoices } = req.body;
  console.log(`[UpdatePayment] Updating payment record: ${id}`);

  // Find the payment record
  const payment = await MonthlyPayment.findById(id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  // Update status and notes if provided
  if (status) payment.status = status;
  if (notes) payment.notes = notes;

  // Update invoices if provided
  if (invoices && Array.isArray(invoices)) {
    console.log(`[UpdatePayment] Updating ${invoices.length} invoices`);

    // Handle file uploads for new or updated invoices
    if (req.files && req.files.length > 0) {
      console.log(`[UpdatePayment] Processing ${req.files.length} files`);

      const uploadPromises = req.files.map(async (file, index) => {
        console.log(
          `[UpdatePayment] File ${index}: ${file.originalname}, size: ${file.size}`
        );
        const fileIndex = req.body[`fileIndex_${index}`] || index;

        try {
          const uploadResult = await safeCloudinaryUpload(file.path, {
            folder: `monthly-payments/${payment.jobId}/${payment.year}/${payment.month}`,
          });

          // Don't delete the file in case of upload failure
          if (uploadResult.success) {
            fs.unlink(file.path, (err) => {
              if (err)
                console.error(
                  `[UpdatePayment] Error deleting temp file ${file.path}:`,
                  err
                );
            });
          }

          return {
            index: fileIndex,
            url: uploadResult.url,
            fileName: file.originalname,
            success: uploadResult.success,
          };
        } catch (uploadError) {
          console.error(
            `[UpdatePayment] Error uploading file ${file.originalname}:`,
            uploadError
          );
          return {
            index: fileIndex,
            url: `/files/${path.basename(file.path)}`,
            fileName: file.originalname,
            error: uploadError.message,
          };
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log("[UpdatePayment] File upload results:", uploadedFiles);

      // Assign file URLs to corresponding invoices
      uploadedFiles.forEach((file) => {
        const invoiceIndex = parseInt(file.index, 10);
        if (invoiceIndex < invoices.length) {
          console.log(
            `[UpdatePayment] Assigned file to invoice at index ${invoiceIndex}`
          );
          invoices[invoiceIndex].fileUrl = file.url;
          invoices[invoiceIndex].fileName = file.fileName;
        }
      });
    }

    // Replace invoices with new ones
    payment.invoices = invoices.map((invoice) => ({
      invoiceDate: invoice.invoiceDate,
      description: invoice.description,
      amount: parseFloat(invoice.amount),
      option: invoice.option || "",
      paymentMethod: invoice.paymentMethod,
      fileUrl: invoice.fileUrl,
      fileName: invoice.fileName,
    }));
  }

  // Update updatedBy field
  payment.updatedBy = req.user._id;

  const updatedPayment = await payment.save();
  console.log(`[UpdatePayment] Payment record updated: ${updatedPayment._id}`);

  res.status(200).json(updatedPayment);
});

// Delete a payment record
const deleteMonthlyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[DeletePayment] Deleting payment record: ${id}`);

  // Find the payment record
  const payment = await MonthlyPayment.findById(id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  // Check if user has permission to delete
  const isAdmin = req.user.role?.name === "admin";
  const isCreator = payment.createdBy.toString() === req.user._id.toString();

  if (!isAdmin && !isCreator) {
    res.status(403);
    throw new Error("You do not have permission to delete this payment record");
  }

  await payment.remove();
  console.log(`[DeletePayment] Payment record deleted: ${id}`);

  res.status(200).json({ message: "Payment record deleted successfully" });
});

// Get a single payment record by ID
const getMonthlyPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[GetPayment] Fetching payment record: ${id}`);

  const payment = await MonthlyPayment.findById(id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!payment) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  res.status(200).json(payment);
});

// Add test route for Cloudinary
const testCloudinaryUpload = asyncHandler(async (req, res) => {
  console.log("[TestUpload] Testing Cloudinary upload");

  if (!req.file) {
    res.status(400);
    throw new Error("No file provided");
  }

  console.log(
    `[TestUpload] File: ${req.file.originalname}, size: ${req.file.size}`
  );
  console.log(
    `[TestUpload] Cloudinary credentials found: ${!!process.env
      .CLOUDINARY_CLOUD_NAME}`
  );

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "test-uploads",
    });

    console.log("[TestUpload] Success:", result.secure_url);

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("[TestUpload] Error deleting temp file:", err);
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      message: "Test upload successful",
    });
  } catch (error) {
    console.error("[TestUpload] Error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: "Test upload failed",
    });
  }
});

/**
 * Get payment statistics without using MongoDB ID lookup
 * @route GET /api/monthlypayment/statistics
 * @access Private (Operation Management)
 */
const getPaymentStatistics = asyncHandler(async (req, res) => {
  console.log("[GetStatistics] Fetching payment statistics");
  
  try {
    // Get total jobs with om_completed status
    const totalJobsResult = await Job.countDocuments({ status: "om_completed" });
    
    // Get count of jobs with payment records
    // Using aggregate to get unique job IDs from monthly payments
    const jobsWithPaymentsQuery = await MonthlyPayment.aggregate([
      { $group: { _id: "$jobId" } }
    ]);
    const jobsWithPayments = jobsWithPaymentsQuery.length;
    
    // Get total amount and pending payments
    const paymentStats = await MonthlyPayment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          pendingCount: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Pending"] },
                1,
                0
              ]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Pending"] },
                "$totalAmount",
                0
              ]
            }
          }
        }
      }
    ]);
    
    // Format the results
    const stats = {
      totalJobs: totalJobsResult,
      jobsWithPayments: jobsWithPayments,
      pendingPayments: paymentStats[0]?.pendingCount || 0,
      totalAmount: paymentStats[0]?.totalAmount || 0,
      pendingAmount: paymentStats[0]?.pendingAmount || 0
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error("[GetStatistics] Error:", error);
    res.status(500).json({
      message: "Failed to get payment statistics",
      error: error.message
    });
  }
});

/**
 * Get jobs that are either marked as "Operation Complete" or have payment records
 * This combined endpoint is specifically for Account Management to see all jobs
 * that need payment processing or already have payments
 * @route GET /api/jobs/payment-eligible
 * @access Private (Account Management)
 */
const getPaymentEligibleJobs = asyncHandler(async (req, res) => {
  console.log("[GetPaymentEligible] Fetching payment-eligible jobs");
  
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query to find:
    // 1. Jobs with status "om_completed"
    // 2. OR jobs that have payment records
    
    // Step 1: Find all job IDs that have payment records
    const jobsWithPayments = await MonthlyPayment.distinct('jobId');
    
    // Step 2: Build the main query for jobs
    let query = {
      $or: [
        { status: "om_completed" },  // Current completed jobs
        { _id: { $in: jobsWithPayments } }  // Jobs with payment records
      ]
    };
    
    // Add search filter if provided
    if (search) {
      query.$and = [
        {
          $or: [
            { clientName: { $regex: search, $options: 'i' } },
            { gmail: { $regex: search, $options: 'i' } },
            { serviceType: { $regex: search, $options: 'i' } },
            { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null }
          ]
        }
      ];
    }
    
    // Count total matching documents for pagination
    const total = await Job.countDocuments(query);
    
    // Execute query with pagination
    let jobs = await Job.find(query)
      .sort({ updatedAt: -1 })  // Newest first 
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');  // Exclude version field
    
    // For each job, check if it has payment records
    const jobsWithPaymentInfo = await Promise.all(jobs.map(async (job) => {
      const jobData = job.toObject();
      
      // Check if job has payment records
      const paymentCount = await MonthlyPayment.countDocuments({ jobId: job._id });
      jobData.hasPayments = paymentCount > 0;
      
      return jobData;
    }));
    
    // Prepare pagination info
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit) || 1,
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };
    
    res.status(200).json({
      jobs: jobsWithPaymentInfo,
      pagination
    });
    
  } catch (error) {
    console.error("[GetPaymentEligible] Error:", error);
    res.status(500).json({
      message: "Failed to fetch payment-eligible jobs",
      error: error.message
    });
  }
});

/**
 * Get all payment records with search and filtering
 * @route GET /api/monthlypayment/all
 * @access Private (Account Management)
 */
const getAllPaymentRecords = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", year = "" } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by year if provided
    if (year) {
      query.year = parseInt(year);
    }
    
    // Add search filter if provided
    if (search) {
      // We need to join with the Job collection to search by client name
      // This requires an aggregation pipeline
      const jobMatches = await Job.find({
        $or: [
          { clientName: { $regex: search, $options: 'i' } },
          { gmail: { $regex: search, $options: 'i' } },
          { serviceType: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const jobIds = jobMatches.map(job => job._id);
      
      query.$or = [
        { jobId: { $in: jobIds } },
        { 'invoices.description': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Count total matching documents for pagination
    const total = await MonthlyPayment.countDocuments(query);
    
    // Execute query with pagination
    const payments = await MonthlyPayment.find(query)
      .sort({ year: -1, month: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit))
      .populate('jobId', 'clientName gmail serviceType') // Get job details
      .select('-__v');
    
    // Process payment records to include client information
    const processedPayments = await Promise.all(payments.map(async (payment) => {
      const paymentObj = payment.toJSON();
      
      // If the job reference is available
      if (payment.jobId) {
        paymentObj.clientName = payment.jobId.clientName;
        paymentObj.clientEmail = payment.jobId.gmail;
        paymentObj.jobType = payment.jobId.serviceType;
      } else {
        // If job reference is not available (job may have been deleted)
        // Try to find the job directly
        try {
          const job = await Job.findById(payment.jobId).select('clientName gmail serviceType');
          if (job) {
            paymentObj.clientName = job.clientName;
            paymentObj.clientEmail = job.gmail;
            paymentObj.jobType = job.serviceType;
          } else {
            paymentObj.clientName = "Unknown Client";
            paymentObj.clientEmail = "unknown@example.com";
            paymentObj.jobType = payment.jobType || "Unknown Service";
          }
        } catch (err) {
          paymentObj.clientName = "Unknown Client";
          paymentObj.clientEmail = "unknown@example.com";
          paymentObj.jobType = payment.jobType || "Unknown Service";
        }
      }
      
      return paymentObj;
    }));
    
    // Prepare pagination info
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit) || 1,
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };
    
    res.status(200).json({
      payments: processedPayments,
      pagination
    });
    
  } catch (error) {
    console.error("[GetAllPaymentRecords] Error:", error);
    res.status(500).json({
      message: "Failed to fetch payment records",
      error: error.message
    });
  }
});


module.exports = {
  addMonthlyPayment,
  getPaymentHistory,
  updateMonthlyPayment,
  deleteMonthlyPayment,
  getMonthlyPaymentById,
  testCloudinaryUpload,
  getPaymentStatistics, // Add this line
  getPaymentEligibleJobs,
  getAllPaymentRecords,
};
