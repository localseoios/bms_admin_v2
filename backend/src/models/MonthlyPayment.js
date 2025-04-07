// models/MonthlyPayment.js
const mongoose = require("mongoose");

/**
 * Invoice schema - represents individual invoice entries within a monthly payment
 * Includes support for marking invoices as incorrect with reasons
 */
const invoiceSchema = new mongoose.Schema(
  {
    invoiceDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    option: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Bank Transfer", "Cash", "Credit Card", "Document Only"],
      default: "Bank Transfer",
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    // Support for marking invoices as incorrect
    isIncorrectInvoice: {
      type: Boolean,
      default: false,
    },
    incorrectReason: {
      type: String,
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/**
 * Monthly Payment schema - represents payment records grouped by month
 * Contains multiple invoice entries and tracks payment status
 */
const monthlyPaymentSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    jobType: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    month: {
      type: Number,
      required: true,
      min: 0,
      max: 11,
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Paid",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    invoices: [invoiceSchema],
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Track if a payment has incorrect invoices
    hasIncorrectInvoices: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Add collection index to improve query performance
    collation: { locale: "en" },
  }
);

// Create a compound index to ensure uniqueness for jobId + year + month
monthlyPaymentSchema.index({ jobId: 1, year: 1, month: 1 }, { unique: true });

// Create additional indexes for common queries
monthlyPaymentSchema.index({ status: 1 });
monthlyPaymentSchema.index({ createdAt: -1 });
monthlyPaymentSchema.index({ year: 1, month: 1 });

// Virtual field for month name
monthlyPaymentSchema.virtual("monthName").get(function () {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[this.month];
});

// Pre-save middleware to calculate total amount and check for incorrect invoices
monthlyPaymentSchema.pre("save", function (next) {
  // Calculate total amount from all invoices
  if (this.invoices && this.invoices.length > 0) {
    this.totalAmount = this.invoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0
    );

    // Check if any invoices are marked as incorrect
    this.hasIncorrectInvoices = this.invoices.some(
      (invoice) => invoice.isIncorrectInvoice
    );
  } else {
    this.totalAmount = 0;
    this.hasIncorrectInvoices = false;
  }
  next();
});

// Method to safely get an invoice document
monthlyPaymentSchema.methods.getInvoiceDocument = function () {
  if (!this.invoices || this.invoices.length === 0) return null;
  return this.invoices.find((invoice) => invoice.fileUrl) || null;
};

// Set toJSON options to include virtuals and transform _id to id
monthlyPaymentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("MonthlyPayment", monthlyPaymentSchema);
