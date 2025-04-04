// models/OperationModels.js
const mongoose = require("mongoose");

// Schema for company details
const companyDetailsSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    companyName: { type: String, required: true },
    qfcNo: { type: String },
    registeredAddress: { type: String },
    incorporationDate: { type: Date },
    serviceType: { type: String },
    engagementLetters: { type: String }, // URL to document
    mainPurpose: { type: String },
    expiryDate: { type: Date },
    companyComputerCard: { type: String }, // URL to document
    companyComputerCardExpiry: { type: Date },
    taxCard: { type: String }, // URL to document
    taxCardExpiry: { type: Date },
    crExtract: { type: String }, // URL to document
    crExtractExpiry: { type: Date },
    scopeOfLicense: { type: String }, // URL to document
    scopeOfLicenseExpiry: { type: Date },
    articleOfAssociate: { type: String }, // URL to document
    certificateOfIncorporate: { type: String }, // URL to document
    kycActiveStatus: { type: String, enum: ["yes", "no"], default: "yes" },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Schema for person details (used for directors, shareholders, secretaries, and SEF)
const personDetailsSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    personType: {
      type: String,
      enum: ["director", "shareholder", "secretary", "sef"],
      required: true,
    },
    name: { type: String, required: true },
    nationality: { type: String },
    visaCopy: { type: String }, // URL to document
    qidNo: { type: String },
    qidDoc: { type: String }, // URL to document
    qidExpiry: { type: Date },
    nationalAddress: { type: String },
    nationalAddressDoc: { type: String }, // URL to document
    nationalAddressExpiry: { type: Date },
    passportNo: { type: String },
    passportDoc: { type: String }, // URL to document
    passportExpiry: { type: Date },
    mobileNo: { type: String },
    email: { type: String },
    cv: { type: String }, // URL to document
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Schema for KYC documents
const kycDocumentSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    activeStatus: {
      type: String,
      enum: ["yes", "no"],
      default: "yes",
    },
    documents: [
      {
        file: { type: String }, // URL to document
        description: { type: String },
        date: { type: Date },
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const CompanyDetails = mongoose.model("CompanyDetails", companyDetailsSchema);
const PersonDetails = mongoose.model("PersonDetails", personDetailsSchema);
const KycDocument = mongoose.model("KycDocument", kycDocumentSchema);

module.exports = {
  CompanyDetails,
  PersonDetails,
  KycDocument,
};
