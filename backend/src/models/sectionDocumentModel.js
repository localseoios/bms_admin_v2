const mongoose = require('mongoose');

const sectionDocumentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true
  },
  sectionId: {
    type: String,
    required: true,
    ref: 'SectionSettings'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String
  },
  size: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByName: {
    type: String,
    required: true
  },
  fileType: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
sectionDocumentSchema.index({ sectionId: 1, clientId: 1, createdAt: -1 });
sectionDocumentSchema.index({ documentId: 1 });
sectionDocumentSchema.index({ clientId: 1 });

module.exports = mongoose.model('SectionDocument', sectionDocumentSchema);