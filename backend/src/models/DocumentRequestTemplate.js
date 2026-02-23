const mongoose = require("mongoose");

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

const documentRequestTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  fields: [fieldSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

documentRequestTemplateSchema.index({ name: 1 });
documentRequestTemplateSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentRequestTemplate", documentRequestTemplateSchema);
