const ComplianceResource = require('../models/complianceResourceModel');
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

exports.createResource = async (req, res) => {
  try {
    console.log('=== CREATE RESOURCE STARTED ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User ID:', req.user?._id);
    
    const { title, category, description, externalLink, tags, version } = req.body;
    
    const resourceData = {
      title,
      category,
      description,
      externalLink,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      version,
      uploadedBy: req.user._id,
      lastUpdatedBy: req.user._id
    };

    if (req.file) {
      const fileUrl = await uploadToCloudinary(req.file.path, 'compliance-resources');
      resourceData.fileUrl = fileUrl;
      resourceData.fileType = req.file.originalname.split('.').pop().toLowerCase();
      
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    } else if (externalLink) {
      resourceData.fileType = 'link';
    }

    console.log('Resource data to save:', resourceData);
    
    const resource = new ComplianceResource(resourceData);
    const savedResource = await resource.save();
    
    console.log('Resource saved successfully:', savedResource._id);
    
    const populatedResource = await ComplianceResource.findById(resource._id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: populatedResource
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating resource',
      error: error.message
    });
  }
};

exports.getAllResources = async (req, res) => {
  try {
    const { category, search, tags, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const resources = await ComplianceResource.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ComplianceResource.countDocuments(query);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

exports.getResourceById = async (req, res) => {
  try {
    const resource = await ComplianceResource.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    await ComplianceResource.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: false }
    );

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resource',
      error: error.message
    });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const { title, category, description, externalLink, tags, version, isActive } = req.body;
    
    const updateData = {
      title,
      category,
      description,
      externalLink,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : undefined,
      version,
      isActive,
      lastUpdatedBy: req.user._id
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (req.file) {
      const fileUrl = await uploadToCloudinary(req.file.path, 'compliance-resources');
      updateData.fileUrl = fileUrl;
      updateData.fileType = req.file.originalname.split('.').pop().toLowerCase();
      
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }

    const resource = await ComplianceResource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('uploadedBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: resource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resource',
      error: error.message
    });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await ComplianceResource.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resource',
      error: error.message
    });
  }
};

exports.downloadResource = async (req, res) => {
  try {
    const resource = await ComplianceResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    await ComplianceResource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: false }
    );

    res.status(200).json({
      success: true,
      data: {
        fileUrl: resource.fileUrl,
        externalLink: resource.externalLink,
        fileType: resource.fileType
      }
    });
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading resource',
      error: error.message
    });
  }
};

exports.getResourceStats = async (req, res) => {
  try {
    const stats = await ComplianceResource.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    const totalResources = await ComplianceResource.countDocuments({ isActive: true });
    const recentResources = await ComplianceResource.find({ isActive: true })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        categoryStats: stats,
        totalResources,
        recentResources
      }
    });
  } catch (error) {
    console.error('Error fetching resource stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resource stats',
      error: error.message
    });
  }
};