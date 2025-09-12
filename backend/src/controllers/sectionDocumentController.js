const asyncHandler = require('express-async-handler');
const SectionDocument = require('../models/sectionDocumentModel');
const SectionSettings = require('../models/sectionSettingsModel');
const Client = require('../models/Client');
const cloudinary = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Get all documents for a section and client
const getSectionDocuments = asyncHandler(async (req, res) => {
  const { sectionId, clientEmail } = req.params;

  console.log(`Getting documents for section: ${sectionId}, client: ${clientEmail}`);

  try {
    // Find client
    const client = await Client.findOne({ gmail: clientEmail });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Verify section exists
    const section = await SectionSettings.findOne({ sectionId, isActive: true });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Get documents
    const documents = await SectionDocument.find({
      sectionId,
      clientId: client._id,
      status: 'active'
    })
      .populate('uploadedBy', 'name email')
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
      data: {
        section: section,
        documents: transformedDocuments
      }
    });
  } catch (error) {
    console.error('Error fetching section documents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Upload document to a section
const uploadSectionDocument = asyncHandler(async (req, res) => {
  const { sectionId, clientEmail, description } = req.body;
  const file = req.file;

  console.log('🚀 SECTION DOCUMENT UPLOAD STARTED');
  console.log('Upload section document - Body:', req.body);
  console.log('Upload section document - File:', file ? 'present' : 'not present');
  console.log('Parsed values:', { sectionId, clientEmail, description });

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided'
    });
  }

  if (!sectionId || !clientEmail || !description) {
    return res.status(400).json({
      success: false,
      message: 'Section ID, client email, and description are required'
    });
  }

  try {
    // Find client
    const client = await Client.findOne({ gmail: clientEmail });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Verify section exists
    const section = await SectionSettings.findOne({ sectionId, isActive: true });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check document limit
    const existingDocuments = await SectionDocument.countDocuments({
      sectionId,
      clientId: client._id,
      status: 'active'
    });

    if (existingDocuments >= section.maxDocuments) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${section.maxDocuments} documents allowed for this section`
      });
    }

    // Upload to Cloudinary
    // Clean filename to avoid URL issues
    const cleanFilename = file.originalname
      .replace(/[^\w\-_.]/g, '_') // Replace special characters with underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .split('.')[0]; // Remove extension
    
    console.log('📤 Uploading to Cloudinary with options:', {
      folder: `section-documents/${sectionId}`,
      public_id: `section_${Date.now()}_${cleanFilename}`,
      original_filename: file.originalname,
      clean_filename: cleanFilename
    });
    
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: `section-documents/${sectionId}`,
      resource_type: 'auto',
      public_id: `section_${Date.now()}_${cleanFilename}`,
      access_mode: 'public', // Ensure public access
      unique_filename: false,
      use_filename: false
    });
    
    console.log('✅ Cloudinary upload successful:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format
    });

    // Create document record
    const newDocument = await SectionDocument.create({
      documentId: uuidv4(),
      sectionId: sectionId,
      clientId: client._id,
      name: file.originalname,
      description: description,
      fileUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name || req.user.email,
      fileType: file.mimetype,
      status: 'active'
    });

    console.log('✅ SECTION DOCUMENT UPLOAD SUCCESSFUL');
    console.log('Document created with ID:', newDocument.documentId);
    console.log('File URL:', newDocument.fileUrl);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
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
    console.error('Error uploading section document:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update section document
const updateSectionDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { description } = req.body;
  const file = req.file;

  console.log('🔄 UPDATE SECTION DOCUMENT STARTED');
  console.log('Update section document - ID:', documentId);
  console.log('Update section document - Body:', req.body);
  console.log('Update section document - File:', file ? 'present' : 'not present');
  console.log('Update section document - User:', req.user ? req.user._id : 'no user');
  console.log('Update section document - Headers:', req.headers['content-type']);

  try {
    // Find document
    console.log('🔍 Looking for document with ID:', documentId);
    const document = await SectionDocument.findOne({ documentId: documentId });
    console.log('📄 Document found:', document ? 'yes' : 'no');
    
    if (!document) {
      console.log('❌ Document not found');
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    console.log('✅ Document exists:', {
      id: document.documentId,
      name: document.name,
      sectionId: document.sectionId
    });

    // If a new file is provided, upload it and replace the old one
    if (file) {
      console.log('🔄 New file provided, starting upload process');
      const oldCloudinaryId = document.cloudinaryId;
      console.log('📂 Old Cloudinary ID:', oldCloudinaryId);

      // Upload new file to Cloudinary
      // Clean filename to avoid URL issues
      const cleanFilename = file.originalname
        .replace(/[^\w\-_.]/g, '_') // Replace special characters with underscores
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .split('.')[0]; // Remove extension
      
      console.log('📤 Starting Cloudinary upload with options:', {
        folder: `section-documents/${document.sectionId}`,
        public_id: `section_${Date.now()}_${cleanFilename}`,
        original_filename: file.originalname,
        clean_filename: cleanFilename,
        file_path: file.path
      });
      
      let uploadResult;
      try {
        console.log('📤 Starting Cloudinary upload...');
        uploadResult = await Promise.race([
          cloudinary.uploader.upload(file.path, {
            folder: `section-documents/${document.sectionId}`,
            resource_type: 'auto',
            public_id: `section_${Date.now()}_${cleanFilename}`,
            access_mode: 'public', // Ensure public access
            unique_filename: false,
            use_filename: false
          }),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Cloudinary upload timeout')), 30000); // 30 second timeout
          })
        ]);
        console.log('✅ Cloudinary upload completed in time');
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      
      console.log('✅ Cloudinary upload successful for update:', {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        resource_type: uploadResult.resource_type,
        format: uploadResult.format
      });

      // Update document with new file info
      console.log('🔄 Updating document with new file info...');
      document.name = file.originalname;
      document.size = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      document.fileUrl = uploadResult.secure_url;
      document.cloudinaryId = uploadResult.public_id;
      document.fileType = file.mimetype;
      console.log('✅ Document file info updated');

      // Delete old file from Cloudinary if it exists
      if (oldCloudinaryId) {
        console.log('🗑️ Deleting old file from Cloudinary:', oldCloudinaryId);
        try {
          await cloudinary.uploader.destroy(oldCloudinaryId);
          console.log('✅ Old file deleted from Cloudinary');
        } catch (cloudinaryError) {
          console.error('❌ Error deleting old file from Cloudinary:', cloudinaryError);
        }
      }
    }

    // Update description if provided
    if (description) {
      console.log('📝 Updating document description...');
      document.description = description;
      console.log('✅ Document description updated');
    }

    console.log('💾 Saving document to database...');
    await document.save();
    console.log('✅ Document saved successfully');

    console.log('📤 Sending success response...');
    const responseData = {
      success: true,
      message: 'Document updated successfully',
      data: {
        id: document.documentId,
        name: document.name,
        description: document.description,
        uploadDate: document.createdAt.toISOString().split('T')[0],
        uploadedBy: document.uploadedByName,
        size: document.size,
        fileUrl: document.fileUrl
      }
    };
    
    console.log('✅ SECTION DOCUMENT UPDATE SUCCESSFUL', responseData.data);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ ERROR UPDATING SECTION DOCUMENT');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete section document
const deleteSectionDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  console.log('Delete section document - ID:', documentId);

  try {
    // Find document
    const document = await SectionDocument.findOne({ documentId: documentId });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete from Cloudinary if cloudinaryId exists
    if (document.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(document.cloudinaryId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    // Delete document from database
    await SectionDocument.findByIdAndDelete(document._id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting section document:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all documents for a client across all sections
const getClientAllSectionDocuments = asyncHandler(async (req, res) => {
  const { clientEmail } = req.params;

  console.log(`Getting all section documents for client: ${clientEmail}`);

  try {
    // Find client
    const client = await Client.findOne({ gmail: clientEmail });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get all active sections
    const sections = await SectionSettings.find({ isActive: true }).sort({ createdAt: 1 });

    // Get documents for each section
    const sectionsWithDocuments = await Promise.all(
      sections.map(async (section) => {
        const documents = await SectionDocument.find({
          sectionId: section.sectionId,
          clientId: client._id,
          status: 'active'
        })
          .populate('uploadedBy', 'name email')
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

        return {
          ...section.toObject(),
          documents: transformedDocuments,
          documentCount: transformedDocuments.length
        };
      })
    );

    res.status(200).json({
      success: true,
      data: sectionsWithDocuments
    });
  } catch (error) {
    console.error('Error fetching all client section documents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = {
  getSectionDocuments,
  uploadSectionDocument,
  updateSectionDocument,
  deleteSectionDocument,
  getClientAllSectionDocuments
};