const mongoose = require("mongoose");
const crypto = require("crypto");

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'textarea', 'file', 'select', 'checkbox', 'date', 'email', 'phone'],
    required: true
  },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  options: [{ type: String }],
  maxFileSize: { type: Number, default: 10 },
  allowedFileTypes: [{ type: String }],
  order: { type: Number, default: 0 }
}, { _id: true });

const documentRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DocumentRequestTemplate"
  },
  customFields: [fieldSchema],
  message: { type: String, required: true },
  subject: { type: String, default: 'Document Request' },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'expired', 'cancelled'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sentAt: { type: Date },
  submittedAt: { type: Date },
  remindersSent: { type: Number, default: 0 },
  lastReminderAt: { type: Date },
  relatedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  },
}, { timestamps: true });

documentRequestSchema.index({ token: 1 });
documentRequestSchema.index({ clientId: 1, status: 1 });
documentRequestSchema.index({ expiresAt: 1 });
documentRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentRequest", documentRequestSchema);
