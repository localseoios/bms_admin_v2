const ComplianceCulture = require('../models/complianceCultureModel');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// @desc    Get all compliance culture documents
// @route   GET /api/compliance-culture
// @access  Private - Compliance Management
exports.getAllDocuments = asyncHandler(async (req, res) => {
  console.log('=== GET ALL COMPLIANCE CULTURE DOCUMENTS ===');
  
  const {
    page = 1,
    limit = 20,
    category,
    documentType,
    status = 'active',
    search,
    sortBy = '-createdAt'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (category) query.category = category;
  if (documentType) query.documentType = documentType;
  
  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const skip = (page - 1) * limit;

  const documents = await ComplianceCulture.find(query)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('lastUpdatedBy', 'firstName lastName email')
    .sort(sortBy)
    .limit(limit * 1)
    .skip(skip)
    .lean();

  const total = await ComplianceCulture.countDocuments(query);

  console.log(`Found ${documents.length} documents out of ${total} total`);

  res.status(200).json({
    success: true,
    data: documents,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalDocuments: total,
      hasMore: skip + documents.length < total
    }
  });
});

// @desc    Get single compliance culture document
// @route   GET /api/compliance-culture/:id
// @access  Private - Compliance Management
exports.getDocument = asyncHandler(async (req, res) => {
  console.log('=== GET COMPLIANCE CULTURE DOCUMENT ===');
  console.log('Document ID:', req.params.id);

  const document = await ComplianceCulture.findById(req.params.id)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('lastUpdatedBy', 'firstName lastName email')
    .populate('lastAccessedBy.user', 'firstName lastName')
    .populate('relatedDocuments', 'title category');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Increment access count
  await document.incrementAccessCount(req.user._id);

  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Create compliance culture document
// @route   POST /api/compliance-culture
// @access  Private - Compliance Management
exports.createDocument = asyncHandler(async (req, res) => {
  console.log('=== CREATE COMPLIANCE CULTURE DOCUMENT ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  console.log('DEBUG: sectionId in req.body:', req.body.sectionId);
  console.log('DEBUG: All req.body keys:', Object.keys(req.body));

  const {
    title,
    documentType,
    description,
    category,
    externalLink,
    targetAudience,
    tags,
    effectiveDate,
    reviewDate,
    isImportant,
    version,
    sectionId
  } = req.body;

  console.log('DEBUG: Extracted sectionId from req.body:', sectionId);
  console.log('DEBUG: typeof sectionId:', typeof sectionId);

  const documentData = {
    title,
    documentType: documentType || 'training',
    description,
    category: category || 'Training Materials',
    uploadedBy: req.user._id,
    lastUpdatedBy: req.user._id,
    isImportant: isImportant === 'true' || isImportant === true,
    version: version || '1.0',
    sectionId: sectionId || null
  };

  console.log('DEBUG: Final documentData before save:', { sectionId: documentData.sectionId, title: documentData.title });

  // Handle target audience
  if (targetAudience) {
    documentData.targetAudience = Array.isArray(targetAudience) 
      ? targetAudience 
      : targetAudience.split(',').map(t => t.trim());
  }

  // Handle tags
  if (tags) {
    documentData.tags = Array.isArray(tags) 
      ? tags 
      : tags.split(',').map(tag => tag.trim());
  }

  // Handle dates
  if (effectiveDate) documentData.effectiveDate = new Date(effectiveDate);
  if (reviewDate) documentData.reviewDate = new Date(reviewDate);

  // Handle file upload or external link
  if (externalLink) {
    documentData.fileType = 'link';
    documentData.externalLink = externalLink;
  } else if (req.file) {
    console.log('Uploading file to Cloudinary...');

    try {
      // Check file size before upload
      const fileSizeMB = req.file.size / (1024 * 1024);
      console.log(`File size: ${fileSizeMB.toFixed(2)}MB`);

      if (fileSizeMB > 10) {
        // For large files, save metadata only without uploading to Cloudinary
        console.log('File too large for Cloudinary, saving metadata only...');
        documentData.fileUrl = `local://temp/${req.file.filename}`;
        documentData.fileName = req.file.originalname;
        documentData.fileSize = `${fileSizeMB.toFixed(2)} MB`;
        documentData.fileType = 'file';

        // Keep temp file for now
        console.log('Large file saved as temp file for testing');
      } else {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'compliance-culture',
          resource_type: 'auto',
          allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'],
          max_bytes: 50 * 1024 * 1024 // 50MB limit
        });

        documentData.fileUrl = result.secure_url;
        documentData.cloudinaryId = result.public_id;
        documentData.fileName = req.file.originalname;
        documentData.fileSize = `${fileSizeMB.toFixed(2)} MB`;
        documentData.fileType = 'file';

        // Delete temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      // Clean up temp file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500);
      throw new Error('File upload failed: ' + uploadError.message);
    }
  }

  console.log('DEBUG: About to create document with data:', JSON.stringify(documentData, null, 2));

  const document = await ComplianceCulture.create(documentData);

  console.log('Document created successfully:', document._id);
  console.log('DEBUG: Created document sectionId:', document.sectionId);

  res.status(201).json({
    success: true,
    message: 'Compliance culture document created successfully',
    data: document
  });
});

// @desc    Update compliance culture document
// @route   PUT /api/compliance-culture/:id
// @access  Private - Compliance Management
exports.updateDocument = asyncHandler(async (req, res) => {
  console.log('=== UPDATE COMPLIANCE CULTURE DOCUMENT ===');
  console.log('Document ID:', req.params.id);
  console.log('Update data:', req.body);

  const document = await ComplianceCulture.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  const {
    title,
    documentType,
    description,
    category,
    externalLink,
    targetAudience,
    tags,
    status,
    effectiveDate,
    reviewDate,
    isImportant,
    version
  } = req.body;


  // Update fields
  if (title) document.title = title;
  if (documentType) document.documentType = documentType;
  if (description) document.description = description;
  if (category) document.category = category;
  if (status) document.status = status;
  if (version) document.version = version;
  if (typeof isImportant !== 'undefined') {
    document.isImportant = isImportant === 'true' || isImportant === true;
  }

  // Handle arrays
  if (targetAudience) {
    document.targetAudience = Array.isArray(targetAudience) 
      ? targetAudience 
      : targetAudience.split(',').map(t => t.trim());
  }

  if (tags) {
    document.tags = Array.isArray(tags) 
      ? tags 
      : tags.split(',').map(tag => tag.trim());
  }

  // Handle dates
  if (effectiveDate) document.effectiveDate = new Date(effectiveDate);
  if (reviewDate) document.reviewDate = new Date(reviewDate);

  // Handle file replacement
  if (req.file) {
    console.log('Replacing file...');
    
    // Delete old file from Cloudinary if exists
    if (document.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(document.cloudinaryId);
      } catch (error) {
        console.error('Error deleting old file from Cloudinary:', error);
      }
    }

    try {
      // Upload new file
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'compliance-culture',
        resource_type: 'auto',
        allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'],
        max_bytes: 50 * 1024 * 1024
      });

      document.fileUrl = result.secure_url;
      document.cloudinaryId = result.public_id;
      document.fileName = req.file.originalname;
      document.fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
      document.fileType = 'file';
      document.externalLink = null;
      
      // Update document title to new file name if no title provided in request
      if (!title) {
        document.title = req.file.originalname;
      }

      // Delete temp file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500);
      throw new Error('File upload failed: ' + uploadError.message);
    }
  } else if (externalLink && document.fileType === 'link') {
    // Update external link
    document.externalLink = externalLink;
  }

  document.lastUpdatedBy = req.user._id;
  
  const updatedDocument = await document.save();
  
  // Populate the updated document
  const populatedDocument = await ComplianceCulture.findById(updatedDocument._id)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('lastUpdatedBy', 'firstName lastName email');
  
  console.log('Document updated successfully');

  res.status(200).json({
    success: true,
    message: 'Document updated successfully',
    data: populatedDocument
  });
});

// @desc    Delete compliance culture document
// @route   DELETE /api/compliance-culture/:id
// @access  Private - Compliance Management
exports.deleteDocument = asyncHandler(async (req, res) => {
  console.log('=== DELETE COMPLIANCE CULTURE DOCUMENT ===');
  console.log('Document ID:', req.params.id);

  const document = await ComplianceCulture.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Delete file from Cloudinary if exists
  if (document.cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(document.cloudinaryId);
      console.log('File deleted from Cloudinary');
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
    }
  }

  await document.deleteOne();
  
  console.log('Document deleted successfully');

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully'
  });
});

// @desc    Get document statistics
// @route   GET /api/compliance-culture/statistics
// @access  Private - Compliance Management
exports.getStatistics = asyncHandler(async (req, res) => {
  console.log('=== GET COMPLIANCE CULTURE STATISTICS ===');

  const totalDocuments = await ComplianceCulture.countDocuments({ status: 'active' });
  
  const byCategory = await ComplianceCulture.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const byType = await ComplianceCulture.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$documentType', count: { $sum: 1 } } }
  ]);

  const mostAccessed = await ComplianceCulture.find({ status: 'active' })
    .sort('-accessCount')
    .limit(5)
    .select('title category accessCount');

  const recentlyAdded = await ComplianceCulture.find({ status: 'active' })
    .sort('-createdAt')
    .limit(5)
    .select('title category createdAt')
    .populate('uploadedBy', 'firstName lastName');

  const importantDocuments = await ComplianceCulture.countDocuments({ 
    status: 'active', 
    isImportant: true 
  });

  res.status(200).json({
    success: true,
    data: {
      totalDocuments,
      importantDocuments,
      byCategory,
      byType,
      mostAccessed,
      recentlyAdded
    }
  });
});

// @desc    Archive document
// @route   PUT /api/compliance-culture/:id/archive
// @access  Private - Compliance Management
exports.archiveDocument = asyncHandler(async (req, res) => {
  console.log('=== ARCHIVE COMPLIANCE CULTURE DOCUMENT ===');
  console.log('Document ID:', req.params.id);

  const document = await ComplianceCulture.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  document.status = 'archived';
  document.lastUpdatedBy = req.user._id;
  
  await document.save();
  
  console.log('Document archived successfully');

  res.status(200).json({
    success: true,
    message: 'Document archived successfully'
  });
});

// @desc    Download/Access document
// @route   GET /api/compliance-culture/:id/download
// @access  Private - Compliance Management
exports.downloadDocument = asyncHandler(async (req, res) => {
  console.log('=== DOWNLOAD COMPLIANCE CULTURE DOCUMENT ===');
  console.log('Document ID:', req.params.id);

  const document = await ComplianceCulture.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Increment access count
  await document.incrementAccessCount(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      fileUrl: document.fileUrl,
      externalLink: document.externalLink,
      fileName: document.fileName,
      fileType: document.fileType
    }
  });
});