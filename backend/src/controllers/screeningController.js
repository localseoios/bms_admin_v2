const asyncHandler = require("express-async-handler");
const Screening = require("../models/screeningModel");
const Client = require("../models/Client");
const Job = require("../models/Job");
const cloudinary = require("../config/cloudinary");
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Get all screening records for a client
const getClientScreeningRecords = asyncHandler(async (req, res) => {
  const { gmail } = req.params;
  const { page = 1, limit = 10, type, result } = req.query;

  try {
    // Find client
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Build query
    let query = { clientId: client._id };
    if (type) query.screeningType = type;
    if (result) query.result = result;

    // Get screening records with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const screenings = await Screening.find(query)
      .populate("screenedBy", "name email")
      .populate("reviewedBy", "name email")
      .populate("jobId", "jobNumber serviceType")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Screening.countDocuments(query);

    // Get summary statistics
    const summary = await Screening.aggregate([
      { $match: { clientId: client._id } },
      {
        $group: {
          _id: "$result",
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryStats = {
      total: total,
      clear: summary.find(s => s._id === "clear")?.count || 0,
      review: summary.find(s => s._id === "review")?.count || 0,
      alert: summary.find(s => s._id === "alert")?.count || 0,
      pending: summary.find(s => s._id === "pending")?.count || 0,
    };

    res.status(200).json({
      screenings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
      summary: summaryStats,
    });
  } catch (error) {
    console.error("Error fetching screening records:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new screening record
const createScreeningRecord = asyncHandler(async (req, res) => {
  const {
    clientGmail,
    jobId,
    screeningType,
    result,
    details,
    dataSources,
    riskScore,
    findings,
    reviewNotes,
  } = req.body;

  try {
    // Find client
    const client = await Client.findOne({ gmail: clientGmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Verify job exists and belongs to client
    const job = await Job.findOne({ _id: jobId, clientId: client._id });
    if (!job) {
      return res.status(404).json({ message: "Job not found or doesn't belong to client" });
    }

    const screening = await Screening.create({
      clientId: client._id,
      jobId,
      screeningType,
      result,
      details,
      screenedBy: req.user._id,
      dataSources: dataSources || [],
      riskScore: riskScore || 0,
      findings: findings || [],
      reviewNotes,
    });

    const populatedScreening = await Screening.findById(screening._id)
      .populate("screenedBy", "name email")
      .populate("jobId", "jobNumber serviceType");

    res.status(201).json({
      message: "Screening record created successfully",
      screening: populatedScreening,
    });
  } catch (error) {
    console.error("Error creating screening record:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update screening record
const updateScreeningRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const screening = await Screening.findById(id);
    if (!screening) {
      return res.status(404).json({ message: "Screening record not found" });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        screening[key] = updates[key];
      }
    });

    // Set review information if result is being updated
    if (updates.result && updates.result !== screening.result) {
      screening.reviewedBy = req.user._id;
      screening.reviewedAt = new Date();
    }

    await screening.save();

    const populatedScreening = await Screening.findById(screening._id)
      .populate("screenedBy", "name email")
      .populate("reviewedBy", "name email")
      .populate("jobId", "jobNumber serviceType");

    res.status(200).json({
      message: "Screening record updated successfully",
      screening: populatedScreening,
    });
  } catch (error) {
    console.error("Error updating screening record:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get screening statistics
const getScreeningStatistics = asyncHandler(async (req, res) => {
  try {
    const stats = await Screening.aggregate([
      {
        $group: {
          _id: {
            type: "$screeningType",
            result: "$result",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.type",
          results: {
            $push: {
              result: "$_id.result",
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
    ]);

    const overallStats = await Screening.aggregate([
      {
        $group: {
          _id: "$result",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      byType: stats,
      overall: overallStats,
    });
  } catch (error) {
    console.error("Error fetching screening statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Upload document to screening record
const uploadScreeningDocument = asyncHandler(async (req, res) => {
  const { clientGmail, screeningType, description, expireDate } = req.body;
  const file = req.file;

  console.log("Upload document request body:", req.body);
  console.log("Upload document file:", file ? "present" : "not present");

  if (!file) {
    return res.status(400).json({ 
      success: false,
      message: "No file provided" 
    });
  }

  if (!clientGmail || !screeningType || !description) {
    return res.status(400).json({ 
      success: false,
      message: "Client Gmail, screening type, and description are required" 
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

    // Find or create screening record for this client and type
    let screening = await Screening.findOne({ 
      clientId: client._id, 
      screeningType: screeningType 
    }).sort({ createdAt: -1 });

    if (!screening) {
      // Create a new screening record if none exists
      const defaultJob = await Job.findOne({ clientId: client._id }).sort({ createdAt: -1 });
      
      screening = await Screening.create({
        clientId: client._id,
        jobId: defaultJob ? defaultJob._id : null,
        screeningType: screeningType,
        result: "pending",
        details: "Document uploaded - pending review",
        screenedBy: req.user._id,
        documents: []
      });
    }

    // Determine resource type based on file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const rawExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf'];
    const resourceType = rawExtensions.includes(ext) ? 'raw' : 'auto';

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "screening-documents",
      resource_type: resourceType,
      public_id: `screening_${Date.now()}_${file.originalname.split('.')[0]}`
    });

    // Create document object
    const newDocument = {
      id: uuidv4(),
      name: file.originalname,
      description: description,
      uploadDate: new Date(),
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedBy: req.user.name || req.user.email,
      fileUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      expireDate: expireDate ? new Date(expireDate) : null
    };

    // Add document to screening record
    if (!screening.documents) {
      screening.documents = [];
    }
    screening.documents.push(newDocument);
    await screening.save();

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      screeningId: screening._id,
      document: newDocument
    });

  } catch (error) {
    console.error("Error uploading screening document:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Update screening document
const updateScreeningDocument = asyncHandler(async (req, res) => {
  const { id: documentId } = req.params;
  const { clientGmail, screeningType, description, expireDate } = req.body;
  const file = req.file;

  console.log("Update document request - Document ID:", documentId);
  console.log("Update document request - Body:", req.body);
  console.log("Update document request - File:", file ? "present" : "not present");
  console.log("Update document request - clientGmail:", clientGmail);
  console.log("Update document request - screeningType:", screeningType);

  if (!clientGmail || clientGmail.trim() === '' || !screeningType || screeningType.trim() === '') {
    console.log("Validation failed - clientGmail:", `'${clientGmail}'`, "screeningType:", `'${screeningType}'`);
    return res.status(400).json({ 
      success: false,
      message: "Client Gmail and screening type are required" 
    });
  }

  try {
    // Find client
    console.log("Finding client with gmail:", clientGmail);
    const client = await Client.findOne({ gmail: clientGmail });
    if (!client) {
      console.log("Client not found for gmail:", clientGmail);
      return res.status(404).json({ 
        success: false,
        message: "Client not found" 
      });
    }
    console.log("Found client:", client._id, client.name);

    // Find the screening record that contains this document (may not match the new screeningType)
    console.log("Finding screening record containing document:", documentId);
    const allScreenings = await Screening.find({ clientId: client._id });
    
    let sourceScreening = null;
    let documentIndex = -1;
    
    for (const screening of allScreenings) {
      const index = screening.documents.findIndex(doc => doc.id === documentId);
      if (index !== -1) {
        sourceScreening = screening;
        documentIndex = index;
        break;
      }
    }

    if (!sourceScreening || documentIndex === -1) {
      console.log("Document not found in any screening record for client:", client._id);
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }
    console.log("Found document in screening:", sourceScreening._id, "type:", sourceScreening.screeningType);

    // Check if we need to move the document to a different screening type
    let targetScreening = sourceScreening;
    if (sourceScreening.screeningType !== screeningType) {
      console.log("Moving document from", sourceScreening.screeningType, "to", screeningType);
      
      // Find or create target screening record
      targetScreening = await Screening.findOne({ 
        clientId: client._id, 
        screeningType: screeningType 
      });

      if (!targetScreening) {
        // Create new screening record for the target type
        const defaultJob = await Job.findOne({ clientId: client._id }).sort({ createdAt: -1 });
        
        targetScreening = await Screening.create({
          clientId: client._id,
          jobId: defaultJob ? defaultJob._id : sourceScreening.jobId,
          screeningType: screeningType,
          result: "pending",
          details: "Document moved from " + sourceScreening.screeningType,
          screenedBy: req.user._id,
          documents: []
        });
        console.log("Created new screening record:", targetScreening._id);
      }
    }

    // Get the document to update
    const documentToUpdate = { ...sourceScreening.documents[documentIndex] };

    // If a new file is provided, upload it to Cloudinary and replace the old one
    if (file) {
      const oldCloudinaryId = documentToUpdate.cloudinaryId;
      
      // Determine resource type based on file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const rawExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf'];
      const resourceType = rawExtensions.includes(ext) ? 'raw' : 'auto';

      // Upload new file to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "screening-documents",
        resource_type: resourceType,
        public_id: `screening_${Date.now()}_${file.originalname.split('.')[0]}`
      });

      // Update document with new file info
      documentToUpdate.name = file.originalname;
      documentToUpdate.size = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      documentToUpdate.fileUrl = uploadResult.secure_url;
      documentToUpdate.cloudinaryId = uploadResult.public_id;
      documentToUpdate.uploadDate = new Date();
      documentToUpdate.uploadedBy = req.user.name || req.user.email;

      // Delete old file from Cloudinary if it exists
      if (oldCloudinaryId) {
        try {
          await cloudinary.uploader.destroy(oldCloudinaryId);
        } catch (cloudinaryError) {
          console.error("Error deleting old file from Cloudinary:", cloudinaryError);
        }
      }
    }

    // Update other document fields
    if (description) documentToUpdate.description = description;
    if (expireDate) documentToUpdate.expireDate = new Date(expireDate);

    // If screening type changed, move document between screening records
    if (sourceScreening._id.toString() !== targetScreening._id.toString()) {
      // Remove document from source screening
      sourceScreening.documents.splice(documentIndex, 1);
      await sourceScreening.save();

      // Add document to target screening
      if (!targetScreening.documents) targetScreening.documents = [];
      targetScreening.documents.push(documentToUpdate);
      await targetScreening.save();
      
      console.log("Document moved successfully");
    } else {
      // Update document in the same screening record
      sourceScreening.documents[documentIndex] = documentToUpdate;
      await sourceScreening.save();
      
      console.log("Document updated in same screening");
    }

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document: documentToUpdate
    });

  } catch (error) {
    console.error("Error updating screening document:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Delete screening document
const deleteScreeningDocument = asyncHandler(async (req, res) => {
  const { id: documentId } = req.params;
  const { clientGmail, screeningType } = req.body;

  console.log("=== DELETE SCREENING DOCUMENT ===");
  console.log("Document ID:", documentId);
  console.log("Request body:", req.body);
  console.log("Client Gmail:", clientGmail);
  console.log("Screening Type:", screeningType);

  if (!clientGmail || !screeningType) {
    console.log("Missing required fields - clientGmail or screeningType");
    return res.status(400).json({
      success: false,
      message: "Client Gmail and screening type are required"
    });
  }

  try {
    // Find client
    const client = await Client.findOne({ gmail: clientGmail });
    console.log("Client found:", client ? client._id : "NOT FOUND");
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    // Find screening record
    const screening = await Screening.findOne({
      clientId: client._id,
      screeningType: screeningType
    });
    console.log("Screening found:", screening ? screening._id : "NOT FOUND");

    if (!screening) {
      return res.status(404).json({
        success: false,
        message: "Screening record not found"
      });
    }

    // Find document
    console.log("Looking for document ID:", documentId);
    console.log("Available documents:", screening.documents?.map(d => ({ id: d.id, _id: d._id })));
    const documentIndex = screening.documents.findIndex(doc => doc.id === documentId || doc._id?.toString() === documentId);
    console.log("Document index:", documentIndex);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const document = screening.documents[documentIndex];

    // Delete from Cloudinary if cloudinaryId exists
    if (document.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(document.cloudinaryId);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
      }
    }

    // Remove document from array
    screening.documents.splice(documentIndex, 1);
    await screening.save();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting screening document:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Delete entire screening record
const deleteScreeningRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const screening = await Screening.findById(id);
    
    if (!screening) {
      return res.status(404).json({ 
        success: false,
        message: "Screening record not found" 
      });
    }

    // Delete all associated documents from Cloudinary
    if (screening.documents && screening.documents.length > 0) {
      for (const document of screening.documents) {
        if (document.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(document.cloudinaryId);
          } catch (cloudinaryError) {
            console.error("Error deleting from Cloudinary:", cloudinaryError);
          }
        }
      }
    }

    // Delete the screening record
    await Screening.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Screening record deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting screening record:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

module.exports = {
  getClientScreeningRecords,
  createScreeningRecord,
  updateScreeningRecord,
  getScreeningStatistics,
  uploadScreeningDocument,
  updateScreeningDocument,
  deleteScreeningDocument,
  deleteScreeningRecord,
};