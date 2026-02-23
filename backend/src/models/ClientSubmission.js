const mongoose = require("mongoose");

const submittedFieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldLabel: { type: String, required: true },
  fieldType: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
}, { _id: true });

const clientSubmissionSchema = new mongoose.Schema({
  documentRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DocumentRequest",
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
  },
  submittedFields: [submittedFieldSchema],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'processed', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  processedAt: { type: Date },
  processingNotes: { type: String },
  clientIp: { type: String },
  clientUserAgent: { type: String },
}, { timestamps: true });

clientSubmissionSchema.index({ documentRequestId: 1 });
clientSubmissionSchema.index({ clientId: 1, createdAt: -1 });
clientSubmissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ClientSubmission", clientSubmissionSchema);
