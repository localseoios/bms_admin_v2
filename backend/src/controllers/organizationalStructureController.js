const OrganizationalStructure = require('../models/organizationalStructureModel');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description } = req.body;

    const structureData = {
      title,
      description,
      documents: [],
      uploadedBy: req.user._id,
      lastUpdatedBy: req.user._id
    };

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = await uploadToCloudinary(file.path, 'organizational-structure');
        structureData.documents.push({
          fileUrl,
          fileName: file.originalname,
          fileType: file.originalname.split('.').pop().toLowerCase(),
          fileSize: file.size
        });

        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }
      }
    }

    const structure = new OrganizationalStructure(structureData);
    const savedStructure = await structure.save();

    const populatedStructure = await OrganizationalStructure.findById(savedStructure._id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Organizational structure created successfully',
      data: populatedStructure
    });
  } catch (error) {
    console.error('Error creating organizational structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating organizational structure',
      error: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const structures = await OrganizationalStructure.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OrganizationalStructure.countDocuments(query);

    res.status(200).json({
      success: true,
      data: structures,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching organizational structures:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organizational structures',
      error: error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const structure = await OrganizationalStructure.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    if (!structure || !structure.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organizational structure not found'
      });
    }

    res.status(200).json({
      success: true,
      data: structure
    });
  } catch (error) {
    console.error('Error fetching organizational structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organizational structure',
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description } = req.body;

    const structure = await OrganizationalStructure.findById(req.params.id);
    if (!structure || !structure.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organizational structure not found'
      });
    }

    structure.title = title || structure.title;
    structure.description = description !== undefined ? description : structure.description;
    structure.lastUpdatedBy = req.user._id;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = await uploadToCloudinary(file.path, 'organizational-structure');
        structure.documents.push({
          fileUrl,
          fileName: file.originalname,
          fileType: file.originalname.split('.').pop().toLowerCase(),
          fileSize: file.size
        });

        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }
      }
    }

    await structure.save();

    const populatedStructure = await OrganizationalStructure.findById(structure._id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Organizational structure updated successfully',
      data: populatedStructure
    });
  } catch (error) {
    console.error('Error updating organizational structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating organizational structure',
      error: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const structure = await OrganizationalStructure.findByIdAndUpdate(
      req.params.id,
      { isActive: false, lastUpdatedBy: req.user._id },
      { new: true }
    );

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Organizational structure not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Organizational structure deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting organizational structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting organizational structure',
      error: error.message
    });
  }
};

exports.addDocument = async (req, res) => {
  try {
    const structure = await OrganizationalStructure.findById(req.params.id);
    if (!structure || !structure.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organizational structure not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const fileUrl = await uploadToCloudinary(req.file.path, 'organizational-structure');
    structure.documents.push({
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.originalname.split('.').pop().toLowerCase(),
      fileSize: req.file.size
    });
    structure.lastUpdatedBy = req.user._id;

    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temp file:', unlinkError);
    }

    await structure.save();

    const populatedStructure = await OrganizationalStructure.findById(structure._id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Document added successfully',
      data: populatedStructure
    });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding document',
      error: error.message
    });
  }
};

exports.replaceDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const structure = await OrganizationalStructure.findById(req.params.id);

    if (!structure || !structure.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organizational structure not found'
      });
    }

    const docIndex = structure.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const fileUrl = await uploadToCloudinary(req.file.path, 'organizational-structure');
    structure.documents[docIndex] = {
      _id: structure.documents[docIndex]._id,
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.originalname.split('.').pop().toLowerCase(),
      fileSize: req.file.size,
      uploadedAt: new Date()
    };
    structure.lastUpdatedBy = req.user._id;

    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temp file:', unlinkError);
    }

    await structure.save();

    const populatedStructure = await OrganizationalStructure.findById(structure._id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Document replaced successfully',
      data: populatedStructure
    });
  } catch (error) {
    console.error('Error replacing document:', error);
    res.status(500).json({
      success: false,
      message: 'Error replacing document',
      error: error.message
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const structure = await OrganizationalStructure.findById(req.params.id);

    if (!structure || !structure.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organizational structure not found'
      });
    }

    const docIndex = structure.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    structure.documents.splice(docIndex, 1);
    structure.lastUpdatedBy = req.user._id;
    await structure.save();

    const populatedStructure = await OrganizationalStructure.findById(structure._id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: populatedStructure
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await OrganizationalStructure.countDocuments({ isActive: true });
    const totalDocuments = await OrganizationalStructure.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$documents' },
      { $count: 'total' }
    ]);

    const recent = await OrganizationalStructure.find({ isActive: true })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalStructures: total,
        totalDocuments: totalDocuments[0]?.total || 0,
        recentStructures: recent
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};
