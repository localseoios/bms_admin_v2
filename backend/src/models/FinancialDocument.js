// models/FinancialDocument.js
const mongoose = require("mongoose");

const financialDocumentSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: [true, "Year is required"],
    min: [1900, "Year must be valid"],
    max: [new Date().getFullYear() + 10, "Year cannot be too far in the future"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  documents: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    cloudinaryId: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  }],
  documentType: {
    type: String,
    enum: ["financial_statement", "tax_return"],
    required: [true, "Document type is required"]
  },
  // Company information - REQUIRED for all documents
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: [true, "Company/Client is required"]
  },
  companyName: {
    type: String,
    required: [true, "Company name is required"],
    trim: true
  },
  gmail: {
    type: String,
    required: [true, "Company email is required"],
    trim: true,
    lowercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique year per document type per company
financialDocumentSchema.index({ 
  year: 1, 
  documentType: 1, 
  clientId: 1 
}, { 
  unique: true 
});

// Index for efficient company-based queries
financialDocumentSchema.index({ 
  clientId: 1,
  documentType: 1,
  year: -1 
});

// Index for searching by company name
financialDocumentSchema.index({ 
  companyName: 'text',
  gmail: 'text'
});

// Virtual to get document count
financialDocumentSchema.virtual('documentCount').get(function() {
  return this.documents.length;
});

// Pre-save middleware to validate document count
financialDocumentSchema.pre('save', function(next) {
  if (this.documents.length > 3) {
    const error = new Error('Maximum 3 documents allowed per year per company');
    error.code = 'DOCUMENT_LIMIT_EXCEEDED';
    return next(error);
  }
  next();
});

// Method to add document
financialDocumentSchema.methods.addDocument = function(documentData) {
  if (this.documents.length >= 3) {
    throw new Error('Maximum 3 documents allowed per year per company');
  }
  this.documents.push(documentData);
  return this.save();
};

// Method to remove document
financialDocumentSchema.methods.removeDocument = function(documentId) {
  this.documents = this.documents.filter(doc => doc._id.toString() !== documentId);
  return this.save();
};

// Static method to get all companies with documents
financialDocumentSchema.statics.getCompaniesWithDocuments = function(documentType) {
  return this.find({ documentType })
    .select('clientId companyName gmail')
    .populate('clientId', 'name gmail')
    .sort({ companyName: 1 })
    .lean();
};

// Static method to get years for a specific company
financialDocumentSchema.statics.getYearsByCompany = function(documentType, clientId) {
  return this.find({ documentType, clientId })
    .select('year')
    .sort({ year: -1 })
    .lean();
};

// Legacy method for backward compatibility
financialDocumentSchema.statics.getYearsWithDocuments = function(documentType, clientId) {
  if (clientId) {
    return this.getYearsByCompany(documentType, clientId);
  }
  
  return this.find({ documentType })
    .select('year')
    .sort({ year: -1 })
    .lean();
};

const FinancialDocument = mongoose.model("FinancialDocument", financialDocumentSchema);

module.exports = FinancialDocument;