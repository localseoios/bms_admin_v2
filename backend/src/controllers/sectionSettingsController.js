const asyncHandler = require('express-async-handler');
const SectionSettings = require('../models/sectionSettingsModel');

// @desc Get all section settings
// @route GET /api/section-settings
// @access Private
const getAllSections = asyncHandler(async (req, res) => {
  console.log('=== GET ALL SECTION SETTINGS ===');
  
  try {
    const sections = await SectionSettings.find({ isActive: true }).sort({ createdAt: 1 });
    
    // If no sections exist, create default ones
    if (sections.length === 0) {
      const defaultSections = [
        {
          sectionId: 'policy-procedure',
          title: 'Policy & Procedure Manual',
          description: 'Company policies and standard operating procedures',
          maxDocuments: 10,
          color: 'blue',
          isCustom: false
        },
        {
          sectionId: 'training-materials',
          title: 'Training Materials',
          description: 'Employee training documents and resources',
          maxDocuments: 10,
          color: 'green',
          isCustom: false
        },
        {
          sectionId: 'review-reports',
          title: 'Review Reports',
          description: 'Compliance review and audit reports',
          maxDocuments: 10,
          color: 'purple',
          isCustom: false
        },
        {
          sectionId: 'meeting-minutes',
          title: 'Meeting Minutes',
          description: 'Records of compliance meetings and decisions',
          maxDocuments: 10,
          color: 'orange',
          isCustom: false
        }
      ];
      
      const createdSections = await SectionSettings.insertMany(defaultSections);
      console.log(`Created ${createdSections.length} default sections`);
      
      res.status(200).json({
        success: true,
        data: createdSections,
        pagination: {
          total: createdSections.length,
          pages: 1,
          page: 1,
          limit: createdSections.length
        }
      });
      return;
    }
    
    console.log(`Found ${sections.length} sections`);
    
    res.status(200).json({
      success: true,
      data: sections,
      pagination: {
        total: sections.length,
        pages: 1,
        page: 1,
        limit: sections.length
      }
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch section settings',
      error: error.message
    });
  }
});

// @desc Update section settings
// @route PUT /api/section-settings/:sectionId
// @access Private
const updateSection = asyncHandler(async (req, res) => {
  console.log('=== UPDATE SECTION SETTINGS ===');
  console.log('Section ID:', req.params.sectionId);
  console.log('Update data:', req.body);
  
  try {
    const { sectionId } = req.params;
    const { maxDocuments, title, description } = req.body;
    
    const updateData = {};
    if (maxDocuments !== undefined) updateData.maxDocuments = parseInt(maxDocuments);
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    
    const section = await SectionSettings.findOneAndUpdate(
      { sectionId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }
    
    console.log('Section updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Section settings updated successfully',
      data: section
    });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update section settings',
      error: error.message
    });
  }
});

// @desc Create new custom section
// @route POST /api/section-settings
// @access Private
const createSection = asyncHandler(async (req, res) => {
  console.log('=== CREATE CUSTOM SECTION ===');
  console.log('Section data:', req.body);
  
  try {
    const { title, description, maxDocuments = 10 } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }
    
    // Generate unique section ID
    const sectionId = `custom-${Date.now()}`;
    
    const colors = ['pink', 'cyan'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newSection = await SectionSettings.create({
      sectionId,
      title,
      description,
      maxDocuments: parseInt(maxDocuments),
      color: randomColor,
      isCustom: true
    });
    
    console.log('Custom section created successfully:', newSection.sectionId);
    
    res.status(201).json({
      success: true,
      message: 'Custom section created successfully',
      data: newSection
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create section',
      error: error.message
    });
  }
});

// @desc Delete custom section
// @route DELETE /api/section-settings/:sectionId
// @access Private
const deleteSection = asyncHandler(async (req, res) => {
  console.log('=== DELETE SECTION ===');
  console.log('Section ID:', req.params.sectionId);
  
  try {
    const { sectionId } = req.params;
    
    // Don't allow deletion of default sections
    if (['policy-procedure', 'training-materials', 'review-reports', 'meeting-minutes'].includes(sectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default sections'
      });
    }
    
    const section = await SectionSettings.findOneAndUpdate(
      { sectionId },
      { isActive: false },
      { new: true }
    );
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }
    
    console.log('Section deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete section',
      error: error.message
    });
  }
});

module.exports = {
  getAllSections,
  updateSection,
  createSection,
  deleteSection
};