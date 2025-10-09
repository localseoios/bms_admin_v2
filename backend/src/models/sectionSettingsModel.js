const mongoose = require('mongoose');

const sectionSettingsSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  maxDocuments: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'red'],
    default: 'blue'
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
sectionSettingsSchema.index({ sectionId: 1 });
sectionSettingsSchema.index({ isActive: 1 });

module.exports = mongoose.model('SectionSettings', sectionSettingsSchema);