const mongoose = require('mongoose');

const complianceCultureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  documentType: {
    type: String,
    enum: ['policy', 'training', 'handbook', 'guideline', 'procedure', 'awareness', 'other'],
    default: 'training'
  },
  description: {
    type: String,
    required: [true, 'Document description is required']
  },
  category: {
    type: String,
    enum: ['Ethics & Conduct', 'Training Materials', 'Policy Documents', 'Awareness Programs', 'Best Practices', 'Case Studies', 'Other'],
    default: 'Training Materials'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    enum: ['file', 'link'],
    default: 'file'
  },
  externalLink: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: String,
    default: null
  },
  cloudinaryId: {
    type: String,
    default: null
  },
  targetAudience: {
    type: [String],
    enum: ['All Staff', 'Management', 'Compliance Team', 'New Employees', 'Board Members', 'Third Parties'],
    default: ['All Staff']
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'draft', 'under_review'],
    default: 'active'
  },
  version: {
    type: String,
    default: '1.0'
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  reviewDate: {
    type: Date,
    default: null
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
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isImportant: {
    type: Boolean,
    default: false
  },
  relatedDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplianceCulture'
  }],
  sectionId: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better search performance
complianceCultureSchema.index({ title: 'text', description: 'text', tags: 'text' });
complianceCultureSchema.index({ category: 1, status: 1 });
complianceCultureSchema.index({ uploadedBy: 1 });
complianceCultureSchema.index({ documentType: 1 });

// Virtual for document age
complianceCultureSchema.virtual('documentAge').get(function() {
  const ageInDays = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  return ageInDays;
});

// Method to increment access count
complianceCultureSchema.methods.incrementAccessCount = async function(userId) {
  this.accessCount += 1;
  
  // Keep only last 10 access records
  if (this.lastAccessedBy.length >= 10) {
    this.lastAccessedBy.shift();
  }
  
  this.lastAccessedBy.push({
    user: userId,
    accessedAt: new Date()
  });
  
  return this.save();
};

const ComplianceCulture = mongoose.model('ComplianceCulture', complianceCultureSchema);

module.exports = ComplianceCulture;