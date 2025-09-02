const mongoose = require('mongoose');

const complianceResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Regulations', 'Guidelines', 'Templates', 'Training', 'Policies', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'link']
  },
  externalLink: {
    type: String,
    required: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: String,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

complianceResourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
complianceResourceSchema.index({ category: 1, isActive: 1 });

const ComplianceResource = mongoose.model('ComplianceResource', complianceResourceSchema);

module.exports = ComplianceResource;