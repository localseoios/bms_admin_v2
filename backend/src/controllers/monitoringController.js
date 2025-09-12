const asyncHandler = require("express-async-handler");
const MonitoringDocument = require("../models/monitoringModel");
const Client = require("../models/Client");
const cloudinary = require("../config/cloudinary");
const { v4: uuidv4 } = require('uuid');

// Get all monitoring documents for a client
const getClientMonitoringDocuments = asyncHandler(async (req, res) => {
  const { gmail } = req.params;

  try {
    // Find client
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: "Client not found" 
      });
    }

    // Get monitoring documents
    const documents = await MonitoringDocument.find({ 
      clientId: client._id,
      status: "active" 
    })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    // Transform documents for frontend
    const transformedDocuments = documents.map(doc => ({
      id: doc.documentId,
      name: doc.name,
      description: doc.description,
      uploadDate: doc.createdAt.toISOString().split('T')[0],
      uploadedBy: doc.uploadedByName,
      size: doc.size,
      fileUrl: doc.fileUrl,
      cloudinaryId: doc.cloudinaryId
    }));

    res.status(200).json({
      success: true,
      documents: transformedDocuments
    });
  } catch (error) {
    console.error("Error fetching monitoring documents:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Upload monitoring document
const uploadMonitoringDocument = asyncHandler(async (req, res) => {
  const { clientGmail, description } = req.body;
  const file = req.file;

  console.log("Upload monitoring document - Body:", req.body);
  console.log("Upload monitoring document - File:", file ? "present" : "not present");

  if (!file) {
    return res.status(400).json({ 
      success: false,
      message: "No file provided" 
    });
  }

  if (!clientGmail || !description) {
    return res.status(400).json({ 
      success: false,
      message: "Client email and description are required" 
    });
  }

  try {
    // Find client
    const client = await Client.findOne({ gmail: clientGmail });
    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: "Client not found" 
      });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "monitoring-documents",
      resource_type: "auto",
      public_id: `monitoring_${Date.now()}_${file.originalname.split('.')[0]}`
    });

    // Create document record
    const newDocument = await MonitoringDocument.create({
      clientId: client._id,
      documentId: uuidv4(),
      name: file.originalname,
      description: description,
      fileUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name || req.user.email,
      fileType: file.mimetype,
      status: "active"
    });

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: newDocument.documentId,
        name: newDocument.name,
        description: newDocument.description,
        uploadDate: newDocument.createdAt.toISOString().split('T')[0],
        uploadedBy: newDocument.uploadedByName,
        size: newDocument.size,
        fileUrl: newDocument.fileUrl
      }
    });

  } catch (error) {
    console.error("Error uploading monitoring document:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Update monitoring document
const updateMonitoringDocument = asyncHandler(async (req, res) => {
  const { id: documentId } = req.params;
  const { description } = req.body;
  const file = req.file;

  console.log("Update monitoring document - ID:", documentId);
  console.log("Update monitoring document - Body:", req.body);
  console.log("Update monitoring document - File:", file ? "present" : "not present");

  try {
    // Find document
    const document = await MonitoringDocument.findOne({ documentId: documentId });
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }

    // If a new file is provided, upload it and replace the old one
    if (file) {
      const oldCloudinaryId = document.cloudinaryId;
      
      // Upload new file to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "monitoring-documents",
        resource_type: "auto",
        public_id: `monitoring_${Date.now()}_${file.originalname.split('.')[0]}`
      });

      // Update document with new file info
      document.name = file.originalname;
      document.size = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      document.fileUrl = uploadResult.secure_url;
      document.cloudinaryId = uploadResult.public_id;
      document.fileType = file.mimetype;

      // Delete old file from Cloudinary if it exists
      if (oldCloudinaryId) {
        try {
          await cloudinary.uploader.destroy(oldCloudinaryId);
        } catch (cloudinaryError) {
          console.error("Error deleting old file from Cloudinary:", cloudinaryError);
        }
      }
    }

    // Update description if provided
    if (description) {
      document.description = description;
    }

    await document.save();

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document: {
        id: document.documentId,
        name: document.name,
        description: document.description,
        uploadDate: document.createdAt.toISOString().split('T')[0],
        uploadedBy: document.uploadedByName,
        size: document.size,
        fileUrl: document.fileUrl
      }
    });

  } catch (error) {
    console.error("Error updating monitoring document:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Delete monitoring document
const deleteMonitoringDocument = asyncHandler(async (req, res) => {
  const { id: documentId } = req.params;

  console.log("Delete monitoring document - ID:", documentId);

  try {
    // Find document
    const document = await MonitoringDocument.findOne({ documentId: documentId });
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }

    // Delete from Cloudinary if cloudinaryId exists
    if (document.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(document.cloudinaryId);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
      }
    }

    // Delete document from database
    await MonitoringDocument.findByIdAndDelete(document._id);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting monitoring document:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

module.exports = {
  getClientMonitoringDocuments,
  uploadMonitoringDocument,
  updateMonitoringDocument,
  deleteMonitoringDocument
};