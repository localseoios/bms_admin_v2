// controllers/accountManagementController.js
const asyncHandler = require("express-async-handler");
const Job = require("../models/Job");
const MonthlyPayment = require("../models/MonthlyPayment");
const cloudinary = require("../config/cloudinary");
const notificationService = require("../services/notificationService");
const fs = require("fs");
const path = require("path");

/**
 * Get dashboard statistics for Account Management
 * Includes total jobs requiring payments, total payments, pending payments, etc.
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get count of jobs with operation completed status
    const completedJobsCount = await Job.countDocuments({
      status: "om_completed",
    });

    // Get payment statistics
    const paymentStats = await MonthlyPayment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmountPaid: {
            $sum: {
              $cond: [{ $eq: ["$status", "Paid"] }, "$totalAmount", 0],
            },
          },
          totalAmountPending: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, "$totalAmount", 0],
            },
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Paid"] }, 1, 0],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
            },
          },
          overdueCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get the count of unique jobs with payment records
    const jobsWithPayments = await MonthlyPayment.aggregate([
      { $group: { _id: "$jobId" } },
      { $count: "count" },
    ]);

    // Get monthly payment trend for the current year
    const currentYear = new Date().getFullYear();
    const monthlyTrend = await MonthlyPayment.aggregate([
      {
        $match: { year: currentYear },
      },
      {
        $group: {
          _id: "$month",
          amount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format the response
    const stats = {
      jobsRequiringPayment: completedJobsCount,
      jobsWithPayments: jobsWithPayments[0]?.count || 0,
      totalPayments: paymentStats[0]?.totalPayments || 0,
      paidPayments: paymentStats[0]?.paidCount || 0,
      pendingPayments: paymentStats[0]?.pendingCount || 0,
      overduePayments: paymentStats[0]?.overdueCount || 0,
      totalAmountPaid: paymentStats[0]?.totalAmountPaid || 0,
      totalAmountPending: paymentStats[0]?.totalAmountPending || 0,
      monthlyTrend: monthlyTrend.map((item) => ({
        month: item._id,
        amount: item.amount,
        count: item.count,
      })),
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      message: "Failed to get dashboard statistics",
      error: error.message,
    });
  }
});

/**
 * Create or update a Monthly Payment Record
 * Account Management can add new payment records or update existing ones
 */
const createUpdatePaymentRecord = asyncHandler(async (req, res) => {
  const { paymentId, jobId, jobType, year, month, status, notes, invoices } =
    req.body;

  try {
    // Check if this is an update or create operation
    const isUpdate = !!paymentId;

    if (isUpdate) {
      // UPDATE EXISTING PAYMENT RECORD
      const payment = await MonthlyPayment.findById(paymentId);

      if (!payment) {
        res.status(404);
        throw new Error("Payment record not found");
      }

      // Update basic fields
      if (status) payment.status = status;
      if (notes) payment.notes = notes;

      // Update invoices if provided
      if (invoices && Array.isArray(invoices)) {
        console.log(`Updating ${invoices.length} invoices`);

        // Handle file uploads for new or updated invoices
        if (req.files && req.files.length > 0) {
          console.log(`Processing ${req.files.length} files`);

          const uploadPromises = req.files.map(async (file, index) => {
            const fileIndex = req.body[`fileIndex_${index}`] || index;

            try {
              const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: `monthly-payments/${payment.jobId}/${payment.year}/${payment.month}`,
                resource_type: "auto",
                timeout: 60000,
              });

              // Clean up temp file after successful upload
              fs.unlink(file.path, (err) => {
                if (err)
                  console.error(`Error deleting temp file ${file.path}:`, err);
              });

              return {
                index: fileIndex,
                url: uploadResult.secure_url,
                fileName: file.originalname,
                success: true,
              };
            } catch (uploadError) {
              console.error(
                `Error uploading file ${file.originalname}:`,
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

          // Assign file URLs to corresponding invoices
          uploadedFiles.forEach((file) => {
            const invoiceIndex = parseInt(file.index, 10);
            if (invoiceIndex < invoices.length) {
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

      // Create notification for payment update
      await notificationService.createNotification(
        {
          title: "Payment Record Updated",
          description: `Payment record for ${updatedPayment.monthName} ${updatedPayment.year} has been updated.`,
          type: "payment",
          relatedTo: { model: "MonthlyPayment", id: updatedPayment._id },
        },
        { "role.permissions.operationManagement": true }
      );

      res.status(200).json(updatedPayment);
    } else {
      // CREATE NEW PAYMENT RECORD
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
        throw new Error(
          "A payment record for this month and year already exists"
        );
      }

      // Parse invoices data
      let parsedInvoices;
      try {
        parsedInvoices =
          typeof invoices === "string" ? JSON.parse(invoices) : invoices;
      } catch (parseError) {
        res.status(400);
        throw new Error(`Failed to parse invoice data: ${parseError.message}`);
      }

      const invoiceData = Array.isArray(parsedInvoices)
        ? parsedInvoices
        : Object.values(parsedInvoices).map((invoice, index) => ({
            ...invoice,
            fileIndex: invoice.fileIndex || index,
          }));

      // Handle file uploads if present
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(async (file, index) => {
          const fileIndex = req.body[`fileIndex_${index}`] || index;

          try {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
              folder: `monthly-payments/${jobId}/${numYear}/${numMonth}`,
              resource_type: "auto",
              timeout: 60000,
            });

            // Clean up temp file after successful upload
            fs.unlink(file.path, (err) => {
              if (err)
                console.error(`Error deleting temp file ${file.path}:`, err);
            });

            return {
              fileIndex: index,
              url: uploadResult.secure_url,
              fileName: file.originalname,
              success: true,
            };
          } catch (uploadError) {
            console.error(
              `Error uploading file ${file.originalname}:`,
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

        // Assign file URLs to corresponding invoices
        uploadedFiles.forEach((file) => {
          const invoiceIndex = invoiceData.findIndex(
            (inv) => inv.fileIndex == file.fileIndex
          );

          if (invoiceIndex !== -1) {
            invoiceData[invoiceIndex].fileUrl = file.url;
            invoiceData[invoiceIndex].fileName = file.fileName;
          }
        });
      }

      // Create the monthly payment record
      const monthlyPayment = new MonthlyPayment({
        jobId,
        jobType,
        year: numYear,
        month: numMonth,
        status: status || "Paid",
        notes,
        invoices: invoiceData.map((invoice) => ({
          invoiceDate: invoice.invoiceDate,
          description: invoice.description,
          amount: parseFloat(invoice.amount),
          option: invoice.option || "",
          paymentMethod: invoice.paymentMethod,
          fileUrl: invoice.fileUrl,
          fileName: invoice.fileName,
        })),
        createdBy: req.user._id,
      });

      const savedRecord = await monthlyPayment.save();

      // Create notification for new payment record
      await notificationService.createNotification(
        {
          title: "New Payment Record Added",
          description: `A new payment record for ${job.clientName}'s ${jobType} service has been added for ${monthlyPayment.monthName} ${numYear}.`,
          type: "payment",
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.permissions.operationManagement": true }
      );

      res.status(201).json(savedRecord);
    }
  } catch (error) {
    console.error("Error in createUpdatePaymentRecord:", error);
    res.status(500).json({
      message: "Failed to process payment record",
      error: error.message,
    });
  }
});

/**
 * Mark a payment record as Paid, Pending, or Overdue
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    // Find the payment record
    const payment = await MonthlyPayment.findById(id);
    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    // Validate status
    if (!["Paid", "Pending", "Overdue"].includes(status)) {
      res.status(400);
      throw new Error(
        "Invalid status. Must be 'Paid', 'Pending', or 'Overdue'"
      );
    }

    // Update the payment record
    payment.status = status;
    if (notes) payment.notes = notes;
    payment.updatedBy = req.user._id;

    const updatedPayment = await payment.save();

    // Create notification about status change
    const job = await Job.findById(payment.jobId);
    const clientName = job ? job.clientName : "Unknown Client";

    await notificationService.createNotification(
      {
        title: `Payment Status Updated to ${status}`,
        description: `The payment record for ${clientName} (${payment.monthName} ${payment.year}) has been marked as ${status}.`,
        type: "payment",
        relatedTo: { model: "MonthlyPayment", id: payment._id },
      },
      { "role.permissions.operationManagement": true }
    );

    res.status(200).json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      message: "Failed to update payment status",
      error: error.message,
    });
  }
});

/**
 * Get payment records by specific filters for Account Management reports
 */
const getPaymentReports = asyncHandler(async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      minAmount,
      maxAmount,
      jobType,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query filters
    let query = {};

    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Status filter
    if (status) query.status = status;

    // Amount filter
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = Number(minAmount);
      if (maxAmount) query.totalAmount.$lte = Number(maxAmount);
    }

    // Job type filter
    if (jobType) query.jobType = { $regex: jobType, $options: "i" };

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Count total records matching the filter
    const total = await MonthlyPayment.countDocuments(query);

    // Execute the query with pagination and populate relations
    const payments = await MonthlyPayment.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("jobId", "clientName gmail serviceType")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    // Process payment records to ensure consistent data format
    const processedPayments = payments.map((payment) => {
      const paymentObj = payment.toJSON();

      // Include client information when available
      if (payment.jobId) {
        paymentObj.clientName = payment.jobId.clientName;
        paymentObj.clientEmail = payment.jobId.gmail;
        paymentObj.serviceType = payment.jobId.serviceType;
      }

      return paymentObj;
    });

    // Prepare pagination info
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit) || 1,
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    // Calculate summary statistics
    const summary = {
      totalRecords: total,
      totalAmount: processedPayments.reduce((sum, p) => sum + p.totalAmount, 0),
      averageAmount: processedPayments.length
        ? processedPayments.reduce((sum, p) => sum + p.totalAmount, 0) /
          processedPayments.length
        : 0,
    };

    res.status(200).json({
      payments: processedPayments,
      pagination,
      summary,
    });
  } catch (error) {
    console.error("Error generating payment reports:", error);
    res.status(500).json({
      message: "Failed to generate payment reports",
      error: error.message,
    });
  }
});


const uploadInvoiceDocument = asyncHandler(async (req, res) => {
  try {
    console.log("Received form data fields:", Object.keys(req.body));
    console.log("File present:", !!req.file);

    const paymentId = req.body.paymentId;
    const isIncorrectInvoice = req.body.isIncorrectInvoice === "true";
    const incorrectReason = req.body.incorrectReason || "";
    const replaceExisting = req.body.replaceExisting === "true";
    const existingInvoiceId = req.body.existingInvoiceId;

    if (!paymentId) {
      res.status(400);
      throw new Error("Payment ID is required");
    }

    // Check if payment record exists
    const payment = await MonthlyPayment.findById(paymentId);
    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    // Ensure a file was uploaded
    if (!req.file) {
      res.status(400);
      throw new Error("No invoice document uploaded");
    }

    // Check if there's already a document-only invoice and we're not replacing
    if (!replaceExisting) {
      const hasDocumentOnlyInvoice = payment.invoices.some(
        (inv) =>
          inv.option === "DOCUMENT_ONLY" ||
          inv.paymentMethod === "Document Only"
      );

      if (hasDocumentOnlyInvoice) {
        res.status(400);
        throw new Error(
          "This payment already has an invoice document. Please use the replace option instead."
        );
      }
    }

    // Upload the file to Cloudinary
    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: `monthly-payments/${payment.jobId}/${payment.year}/${payment.month}`,
        resource_type: "auto",
        timeout: 60000,
        tags: isIncorrectInvoice ? ["invoice", "incorrect"] : ["invoice"],
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);

      const filename = path.basename(req.file.path);
      return res.status(500).json({
        success: false,
        message: "Failed to upload to cloud storage. Using local fallback.",
        invoice: {
          fileUrl: `/files/${filename}`,
          fileName: req.file.originalname,
          isIncorrectInvoice: isIncorrectInvoice,
          incorrectReason: incorrectReason || "",
        },
      });
    }

    // Create a file URL and clean up temporary file
    const fileUrl = uploadResult.secure_url;
    fs.unlink(req.file.path, (err) => {
      if (err) console.error(`Error deleting temp file ${req.file.path}:`, err);
    });

    // Get default values from request if provided, or use sensible defaults
    const invoiceDate = req.body.invoiceDate || new Date();
    const description =
      req.body.description ||
      `Invoice Document - ${payment.monthName} ${payment.year}`;

    // Use a valid payment method from the enum list
    const paymentMethod = "Bank Transfer"; // Using a valid default option

    // Create a document invoice that's clearly marked as a supplemental document
    const documentInvoice = {
      invoiceDate: invoiceDate,
      description: description,
      amount: 0, // Zero amount for document-only invoices
      paymentMethod: paymentMethod,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      isIncorrectInvoice: isIncorrectInvoice,
      incorrectReason: incorrectReason,
      uploadDate: new Date(),
      option: "DOCUMENT_ONLY", // Special flag to identify document-only entries
    };

    // If replacing, remove existing document-only invoices
    if (replaceExisting) {
      // Find the index of the document to replace
      let indexToRemove = -1;

      if (existingInvoiceId) {
        // If we have an ID, find that specific invoice
        indexToRemove = payment.invoices.findIndex(
          (inv) =>
            inv._id.toString() === existingInvoiceId ||
            inv.id === existingInvoiceId
        );
      }

      if (indexToRemove === -1) {
        // If no specific ID or invoice not found, remove any document-only invoice
        indexToRemove = payment.invoices.findIndex(
          (inv) =>
            inv.option === "DOCUMENT_ONLY" ||
            inv.paymentMethod === "Document Only"
        );
      }

      // Remove the invoice if found
      if (indexToRemove !== -1) {
        payment.invoices.splice(indexToRemove, 1);
      }
    }

    // Add the document invoice to the payment record
    payment.invoices.push(documentInvoice);

    // Update the updatedBy field
    if (req.user && req.user._id) {
      payment.updatedBy = req.user._id;
    }

    // Update the hasIncorrectInvoices flag if needed
    if (isIncorrectInvoice) {
      payment.hasIncorrectInvoices = true;
    }

    // Save the updated payment record
    const updatedPayment = await payment.save();

    // Create notification about the upload
    const notificationTitle = replaceExisting
      ? isIncorrectInvoice
        ? "Incorrect Invoice Document Replaced"
        : "Invoice Document Replaced"
      : isIncorrectInvoice
      ? "Incorrect Invoice Document Uploaded"
      : "Invoice Document Uploaded";

    const notificationDesc = replaceExisting
      ? `The invoice document for ${payment.monthName} ${
          payment.year
        } has been replaced${
          isIncorrectInvoice && incorrectReason ? ": " + incorrectReason : ""
        }.`
      : `A new invoice document has been uploaded to payment record for ${
          payment.monthName
        } ${payment.year}${
          isIncorrectInvoice && incorrectReason ? ": " + incorrectReason : ""
        }.`;

    await notificationService.createNotification(
      {
        title: notificationTitle,
        description: notificationDesc,
        type: "payment",
        relatedTo: { model: "MonthlyPayment", id: payment._id },
        createdBy: req.user._id,
      },
      { "role.permissions.operationManagement": true }
    );

    res.status(200).json({
      success: true,
      message: replaceExisting
        ? "Invoice document replaced successfully"
        : "Invoice document uploaded successfully",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error uploading invoice document:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to upload invoice document",
      error: error.message,
    });
  }
});

/**
 * Update a specific invoice within a payment record
 */
const updatePaymentInvoice = asyncHandler(async (req, res) => {
  const { paymentId, invoiceId } = req.params;
  const { invoiceDate, description, amount, currency, option, paymentMethod, notes } = req.body;

  try {
    console.log(`Updating invoice ${invoiceId} in payment ${paymentId}`, {
      invoiceDate, description, amount, currency, option, paymentMethod, notes
    });
    console.log('Raw req.body:', req.body);
    console.log('Currency debugging - type:', typeof currency, 'value:', JSON.stringify(currency));
    console.log('Currency is undefined?', currency === undefined);
    console.log('Currency is empty string?', currency === "");

    // Find the payment record
    const payment = await MonthlyPayment.findById(paymentId);
    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    // Find the specific invoice
    const invoiceIndex = payment.invoices.findIndex(
      (invoice) => invoice._id.toString() === invoiceId
    );

    if (invoiceIndex === -1) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    const invoice = payment.invoices[invoiceIndex];

    // Handle file upload if present
    let fileUrl = invoice.fileUrl;
    let fileName = invoice.fileName;

    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: `monthly-payments/${payment.jobId}/${payment.year}/${payment.month}`,
          resource_type: "auto",
          timeout: 60000,
        });

        fileUrl = uploadResult.secure_url;
        fileName = req.file.originalname;

        // Clean up temp file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error(`Error deleting temp file ${req.file.path}:`, err);
        });
      } catch (uploadError) {
        console.error(`Error uploading file:`, uploadError);
        // Keep existing file if upload fails
      }
    }

    // Update the invoice
    const currencyToUse = currency !== undefined ? currency : (invoice.currency || "QAR");
    console.log('CURRENCY UPDATE DEBUG:');
    console.log('- Received currency:', JSON.stringify(currency));
    console.log('- Existing invoice currency:', JSON.stringify(invoice.currency));
    console.log('- Currency to use:', JSON.stringify(currencyToUse));
    
    const updatedInvoice = {
      ...invoice.toObject(),
      invoiceDate: invoiceDate || invoice.invoiceDate,
      description: description || invoice.description,
      amount: amount ? parseFloat(amount) : invoice.amount,
      currency: currencyToUse,
      option: option !== undefined ? option : invoice.option,
      paymentMethod: paymentMethod || invoice.paymentMethod,
      fileUrl,
      fileName,
    };
    
    console.log('Updated invoice object BEFORE save:', updatedInvoice);
    payment.invoices[invoiceIndex] = updatedInvoice;

    // Update the payment record's updatedBy field
    payment.updatedBy = req.user._id;

    const updatedPayment = await payment.save();
    console.log('AFTER SAVE - Updated invoice from DB:', updatedPayment.invoices[invoiceIndex]);

    // Create notification for invoice update
    await notificationService.createNotification(
      {
        title: "Payment Invoice Updated",
        description: `Invoice for ${payment.monthName} ${payment.year} has been updated.`,
        type: "payment",
        relatedTo: { model: "MonthlyPayment", id: payment._id },
      },
      { "role.permissions.operationManagement": true }
    );

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      payment: updatedPayment,
      updatedInvoice: payment.invoices[invoiceIndex],
    });
  } catch (error) {
    console.error("Error updating payment invoice:", error);
    res.status(500).json({
      message: "Failed to update payment invoice",
      error: error.message,
    });
  }
});

/**
 * Add a new invoice to an existing payment record
 */
const addPaymentInvoice = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { invoiceDate, description, amount, currency, option, paymentMethod } = req.body;

  try {
    console.log(`Adding new invoice to payment ${paymentId}`, {
      invoiceDate, description, amount, currency, option, paymentMethod
    });
    console.log('Raw req.body:', req.body);
    console.log('Currency type:', typeof currency, 'Currency value:', currency);

    // Find the payment record
    const payment = await MonthlyPayment.findById(paymentId);
    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    // Handle file upload if present
    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: `monthly-payments/${payment.jobId}/${payment.year}/${payment.month}`,
          resource_type: "auto",
          timeout: 60000,
        });

        fileUrl = uploadResult.secure_url;
        fileName = req.file.originalname;

        // Clean up temp file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error(`Error deleting temp file ${req.file.path}:`, err);
        });
      } catch (uploadError) {
        console.error(`Error uploading file:`, uploadError);
        // Continue without file if upload fails
        const filename = path.basename(req.file.path);
        fileUrl = `/files/${filename}`;
        fileName = req.file.originalname;
      }
    }

    // Create new invoice object
    const currencyToUse = currency || "QAR";
    console.log('Currency value before save:', currency, '-> Using:', currencyToUse);
    
    const newInvoice = {
      invoiceDate: invoiceDate || new Date(),
      description: description || "New Invoice",
      amount: amount ? parseFloat(amount) : 0,
      currency: currencyToUse,
      option: option || "",
      paymentMethod: paymentMethod || "Bank Transfer",
      fileUrl,
      fileName,
    };
    
    console.log('New invoice object:', newInvoice);

    // Add the new invoice
    payment.invoices.push(newInvoice);

    // Update the payment record's updatedBy field
    payment.updatedBy = req.user._id;

    const updatedPayment = await payment.save();

    // Create notification for new invoice
    await notificationService.createNotification(
      {
        title: "New Payment Invoice Added",
        description: `A new invoice has been added to ${payment.monthName} ${payment.year} payment record.`,
        type: "payment",
        relatedTo: { model: "MonthlyPayment", id: payment._id },
      },
      { "role.permissions.operationManagement": true }
    );

    res.status(201).json({
      success: true,
      message: "Invoice added successfully",
      payment: updatedPayment,
      newInvoice: payment.invoices[payment.invoices.length - 1],
    });
  } catch (error) {
    console.error("Error adding payment invoice:", error);
    res.status(500).json({
      message: "Failed to add payment invoice",
      error: error.message,
    });
  }
});

/**
 * Delete a specific invoice from a payment record
 */
const deletePaymentInvoice = asyncHandler(async (req, res) => {
  const { paymentId, invoiceId } = req.params;

  try {
    console.log(`Deleting invoice ${invoiceId} from payment ${paymentId}`);

    // Find the payment record
    const payment = await MonthlyPayment.findById(paymentId);
    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    // Find the specific invoice
    const invoiceIndex = payment.invoices.findIndex(
      (invoice) => invoice._id.toString() === invoiceId
    );

    if (invoiceIndex === -1) {
      res.status(404);
      throw new Error("Invoice not found");
    }

    // Remove the invoice
    const deletedInvoice = payment.invoices[invoiceIndex];
    payment.invoices.splice(invoiceIndex, 1);

    // Update the payment record's updatedBy field
    payment.updatedBy = req.user._id;

    const updatedPayment = await payment.save();

    // Create notification for invoice deletion
    await notificationService.createNotification(
      {
        title: "Payment Invoice Deleted",
        description: `An invoice has been deleted from ${payment.monthName} ${payment.year} payment record.`,
        type: "payment",
        relatedTo: { model: "MonthlyPayment", id: payment._id },
      },
      { "role.permissions.operationManagement": true }
    );

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      payment: updatedPayment,
      deletedInvoice,
    });
  } catch (error) {
    console.error("Error deleting payment invoice:", error);
    res.status(500).json({
      message: "Failed to delete payment invoice",
      error: error.message,
    });
  }
});

module.exports = {
  getDashboardStats,
  createUpdatePaymentRecord,
  updatePaymentStatus,
  getPaymentReports,
  uploadInvoiceDocument,
  updatePaymentInvoice,
  addPaymentInvoice,
  deletePaymentInvoice,
};