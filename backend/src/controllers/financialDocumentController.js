// controllers/financialDocumentController.js
const asyncHandler = require("express-async-handler");
const FinancialDocument = require("../models/FinancialDocument");
const Client = require("../models/Client");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

// Helper function to safely upload to Cloudinary with fallback
const safeCloudinaryUpload = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      timeout: 60000,
      ...options,
    });
    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error(`Cloudinary upload error for ${filePath}:`, error.message);
    const placeholder = `${
      process.env.VITE_BACKEND_URL
    }/temp-uploads/${path.basename(filePath)}`;
    return { success: false, url: placeholder, error: error.message };
  }
};

// Get all companies that have financial documents
const getCompaniesWithDocuments = asyncHandler(async (req, res) => {
  const { documentType } = req.params;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  try {
    const companies = await FinancialDocument.find({ documentType })
      .populate('clientId', 'name gmail')
      .select('clientId companyName gmail')
      .sort({ companyName: 1 })
      .lean();
    
    // Remove duplicates and format response
    const uniqueCompanies = companies.reduce((acc, current) => {
      if (current.clientId) {
        const existing = acc.find(item => item.clientId.toString() === current.clientId._id.toString());
        if (!existing) {
          acc.push({
            clientId: current.clientId._id,
            companyName: current.companyName,
            gmail: current.gmail
          });
        }
      }
      return acc;
    }, []);

    res.status(200).json({
      success: true,
      data: uniqueCompanies,
      count: uniqueCompanies.length
    });
  } catch (error) {
    console.error("Error fetching companies with documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch companies with documents"
    });
  }
});

// Get all financial documents by type and company
const getFinancialDocuments = asyncHandler(async (req, res) => {
  const { documentType } = req.params;
  const { clientId, search } = req.query;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  // Build query - now all documents must have a clientId
  const query = { documentType };
  
  if (clientId) {
    query.clientId = clientId;
  }

  // Add search functionality
  if (search && search.trim()) {
    query.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { gmail: { $regex: search, $options: 'i' } }
    ];
  }

  const documents = await FinancialDocument.find(query)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("documents.uploadedBy", "name email")
    .populate("clientId", "name gmail")
    .sort({ companyName: 1, year: -1 });

  res.status(200).json({
    success: true,
    data: documents,
    count: documents.length
  });
});

// Get financial document by year, type and company
const getFinancialDocumentByYear = asyncHandler(async (req, res) => {
  const { documentType, year } = req.params;
  const { clientId } = req.query;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  // Validate year
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 10) {
    res.status(400);
    throw new Error("Invalid year");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client ID is required");
  }

  const document = await FinancialDocument.findOne({ 
    documentType, 
    year: yearNum, 
    clientId 
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("documents.uploadedBy", "name email")
    .populate("clientId", "name gmail");

  if (!document) {
    res.status(404);
    throw new Error("Financial document not found for this company and year");
  }

  res.status(200).json({
    success: true,
    data: document
  });
});

// Create or update financial document for a company
const createOrUpdateFinancialDocument = asyncHandler(async (req, res) => {
  const { documentType } = req.params;
  const { year, description, clientId } = req.body;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  // Validate year
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 10) {
    res.status(400);
    throw new Error("Invalid year");
  }

  // Validate required fields
  if (!description) {
    res.status(400);
    throw new Error("Description is required");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client selection is required");
  }

  // Validate files
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("At least one document file is required");
  }

  if (req.files.length > 3) {
    res.status(400);
    throw new Error("Maximum 3 documents allowed per year per company");
  }

  try {
    // Get client information
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error("Company/Client not found");
    }

    // Check if document already exists for this company and year
    let existingDocument = await FinancialDocument.findOne({ 
      documentType, 
      year: yearNum, 
      clientId 
    });

    // Check if adding new files would exceed the limit
    const existingDocCount = existingDocument ? existingDocument.documents.length : 0;
    if (existingDocCount + req.files.length > 3) {
      res.status(400);
      throw new Error(`Cannot add ${req.files.length} files. Maximum 3 documents allowed per year per company. Currently has ${existingDocCount} documents.`);
    }

    // Upload files to Cloudinary
    const uploadedDocuments = [];
    
    for (const file of req.files) {
      const uploadResult = await safeCloudinaryUpload(file.path, {
        folder: `financial_documents/${client.gmail}/${documentType}/${yearNum}`,
        resource_type: "auto"
      });

      const documentData = {
        fileName: file.originalname,
        fileUrl: uploadResult.url,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      };

      if (uploadResult.publicId) {
        documentData.cloudinaryId = uploadResult.publicId;
      }

      uploadedDocuments.push(documentData);

      // Clean up temporary file
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    let savedDocument;

    if (existingDocument) {
      // Update existing document
      existingDocument.description = description;
      existingDocument.documents.push(...uploadedDocuments);
      existingDocument.updatedBy = req.user._id;
      savedDocument = await existingDocument.save();
    } else {
      // Create new document
      savedDocument = new FinancialDocument({
        year: yearNum,
        description,
        documentType,
        documents: uploadedDocuments,
        clientId: client._id,
        companyName: client.name || client.companyName || 'Unknown Company',
        gmail: client.gmail,
        createdBy: req.user._id,
        updatedBy: req.user._id
      });
      await savedDocument.save();
    }

    // Populate the response
    await savedDocument.populate([
      { path: "createdBy", select: "name email" },
      { path: "updatedBy", select: "name email" },
      { path: "documents.uploadedBy", select: "name email" },
      { path: "clientId", select: "name gmail" }
    ]);

    res.status(existingDocument ? 200 : 201).json({
      success: true,
      message: existingDocument ? 
        `${req.files.length} document(s) added to ${documentType.replace('_', ' ')} for ${client.name} - ${yearNum}` : 
        `Financial document created for ${client.name} - ${yearNum}`,
      data: savedDocument
    });

  } catch (error) {
    // Clean up uploaded files in case of error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      });
    }

    if (error.code === 11000) {
      res.status(400);
      throw new Error(`Financial document for this company and year ${yearNum} already exists`);
    }

    throw error;
  }
});

// Update financial document description
const updateFinancialDocument = asyncHandler(async (req, res) => {
  const { documentType, year } = req.params;
  const { description, clientId } = req.body;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  // Validate year
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) {
    res.status(400);
    throw new Error("Invalid year");
  }

  if (!description) {
    res.status(400);
    throw new Error("Description is required");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client ID is required");
  }

  const document = await FinancialDocument.findOne({ 
    documentType, 
    year: yearNum, 
    clientId 
  });

  if (!document) {
    res.status(404);
    throw new Error("Financial document not found");
  }

  // Update description
  document.description = description;
  document.updatedBy = req.user._id;

  const updatedDocument = await document.save();

  // Populate the response
  await updatedDocument.populate([
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
    { path: "documents.uploadedBy", select: "name email" },
    { path: "clientId", select: "name gmail" }
  ]);

  res.status(200).json({
    success: true,
    message: "Financial document updated successfully",
    data: updatedDocument
  });
});

// Update individual document file
const updateDocumentFile = asyncHandler(async (req, res) => {
  const { documentType, year, fileId } = req.params;
  const { fileName, clientId } = req.body;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  // Validate year
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) {
    res.status(400);
    throw new Error("Invalid year");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client ID is required");
  }

  const document = await FinancialDocument.findOne({ 
    documentType, 
    year: yearNum, 
    clientId 
  });

  if (!document) {
    res.status(404);
    throw new Error("Financial document not found");
  }

  // Find the file to update
  const fileIndex = document.documents.findIndex(doc => doc._id.toString() === fileId);
  
  if (fileIndex === -1) {
    res.status(404);
    throw new Error("Document file not found");
  }

  try {
    // If new file is uploaded, replace the existing file
    if (req.file) {
      const client = await Client.findById(clientId);
      const uploadResult = await safeCloudinaryUpload(req.file.path, {
        folder: `financial_documents/${client.gmail}/${documentType}/${yearNum}`,
        resource_type: "auto"
      });

      // Update file data
      document.documents[fileIndex].fileName = req.file.originalname;
      document.documents[fileIndex].fileUrl = uploadResult.url;
      document.documents[fileIndex].fileType = req.file.mimetype;
      document.documents[fileIndex].fileSize = req.file.size;
      document.documents[fileIndex].uploadedBy = req.user._id;
      document.documents[fileIndex].uploadedAt = new Date();

      if (uploadResult.publicId) {
        document.documents[fileIndex].cloudinaryId = uploadResult.publicId;
      }

      // Clean up temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    // If only filename is being updated
    if (fileName && fileName.trim()) {
      document.documents[fileIndex].fileName = fileName.trim();
    }

    document.updatedBy = req.user._id;
    const updatedDocument = await document.save();

    // Populate the response
    await updatedDocument.populate([
      { path: "createdBy", select: "name email" },
      { path: "updatedBy", select: "name email" },
      { path: "documents.uploadedBy", select: "name email" },
      { path: "clientId", select: "name gmail" }
    ]);

    res.status(200).json({
      success: true,
      message: req.file ? "Document file replaced successfully" : "Document filename updated successfully",
      data: updatedDocument,
      updatedFile: updatedDocument.documents[fileIndex]
    });

  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }
    throw error;
  }
});

// Delete individual document file
const deleteDocumentFile = asyncHandler(async (req, res) => {
  const { documentType, year, fileId } = req.params;
  const { clientId } = req.query;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  // Validate year
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) {
    res.status(400);
    throw new Error("Invalid year");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client ID is required");
  }

  const document = await FinancialDocument.findOne({ 
    documentType, 
    year: yearNum, 
    clientId 
  });

  if (!document) {
    res.status(404);
    throw new Error("Financial document not found");
  }

  // Find the file to delete
  const fileIndex = document.documents.findIndex(doc => doc._id.toString() === fileId);
  
  if (fileIndex === -1) {
    res.status(404);
    throw new Error("Document file not found");
  }

  const fileToDelete = document.documents[fileIndex];

  // Remove file from array
  document.documents.splice(fileIndex, 1);
  document.updatedBy = req.user._id;

  // If no more documents, delete the entire record
  if (document.documents.length === 0) {
    await FinancialDocument.findByIdAndDelete(document._id);
    
    res.status(200).json({
      success: true,
      message: "Document file deleted and year record removed (no more files)",
      deletedFile: {
        fileName: fileToDelete.fileName,
        deletedAt: new Date()
      }
    });
  } else {
    // Save the updated document
    await document.save();
    
    res.status(200).json({
      success: true,
      message: "Document file deleted successfully",
      deletedFile: {
        fileName: fileToDelete.fileName,
        deletedAt: new Date()
      },
      remainingFiles: document.documents.length
    });
  }
});

// Delete entire financial document (all files for a company's year)
const deleteFinancialDocument = asyncHandler(async (req, res) => {
  const { documentType, year } = req.params;
  const { clientId } = req.query;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  // Validate year
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) {
    res.status(400);
    throw new Error("Invalid year");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client ID is required");
  }

  const document = await FinancialDocument.findOne({ 
    documentType, 
    year: yearNum, 
    clientId 
  });

  if (!document) {
    res.status(404);
    throw new Error("Financial document not found");
  }

  const deletedDocument = await FinancialDocument.findByIdAndDelete(document._id);

  res.status(200).json({
    success: true,
    message: `All ${documentType.replace('_', ' ')} documents for ${deletedDocument.companyName} - ${yearNum} deleted successfully`,
    deletedDocument: {
      companyName: deletedDocument.companyName,
      year: deletedDocument.year,
      documentCount: deletedDocument.documents.length,
      deletedAt: new Date()
    }
  });
});

// Get years with documents for a specific company
const getYearsByCompany = asyncHandler(async (req, res) => {
  const { documentType } = req.params;
  const { clientId } = req.query;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client ID is required");
  }

  try {
    const years = await FinancialDocument.find({ documentType, clientId })
      .select('year')
      .sort({ year: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: years.map(doc => doc.year),
      count: years.length
    });
  } catch (error) {
    console.error("Error fetching years by company:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch years for company"
    });
  }
});

// Get all clients for dropdown selection
const getAllClients = asyncHandler(async (req, res) => {
  try {
    const clients = await Client.find({})
      .select('name gmail companyName')
      .sort({ name: 1 });

    const formattedClients = clients.map(client => ({
      _id: client._id,
      name: client.name || client.companyName || 'Unknown Company',
      gmail: client.gmail,
      companyName: client.companyName || client.name
    }));

    res.status(200).json({
      success: true,
      data: formattedClients,
      count: formattedClients.length
    });
  } catch (error) {
    console.error("Error fetching all clients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients"
    });
  }
});

// Legacy function for backward compatibility
const getAvailableYears = asyncHandler(async (req, res) => {
  const { documentType } = req.params;
  const { clientId } = req.query;

  // Validate document type
  if (!["financial_statement", "tax_return"].includes(documentType)) {
    res.status(400);
    throw new Error("Invalid document type");
  }

  if (!clientId) {
    res.status(400);
    throw new Error("Company/Client ID is required");
  }

  try {
    const years = await FinancialDocument.find({ documentType, clientId })
      .select('year')
      .sort({ year: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: years.map(doc => doc.year),
      count: years.length
    });
  } catch (error) {
    console.error("Error fetching available years:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available years"
    });
  }
});

module.exports = {
  getCompaniesWithDocuments,
  getFinancialDocuments,
  getFinancialDocumentByYear,
  createOrUpdateFinancialDocument,
  updateFinancialDocument,
  updateDocumentFile,
  deleteDocumentFile,
  deleteFinancialDocument,
  getYearsByCompany,
  getAllClients,
  getAvailableYears
};