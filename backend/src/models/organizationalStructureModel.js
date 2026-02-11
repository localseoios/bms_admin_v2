const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String
  },
  fileSize: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const organizationalStructureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  documents: [documentSchema],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

organizationalStructureSchema.index({ title: 'text', description: 'text' });
organizationalStructureSchema.index({ isActive: 1, createdAt: -1 });

const OrganizationalStructure = mongoose.model('OrganizationalStructure', organizationalStructureSchema);

module.exports = OrganizationalStructure;
