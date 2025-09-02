const mongoose = require("mongoose");

const documentSchema = mongoose.Schema({
  id: {
    type: String,
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
  uploadDate: {
    type: Date,
    default: Date.now
  },
  size: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String
  },
  expireDate: {
    type: Date
  },
  cloudinaryId: {
    type: String
  }
});

const sectionSchema = mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true,
    enum: ["blue", "green", "purple", "orange", "red", "pink", "cyan", "yellow"]
  },
  expanded: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  documents: [documentSchema]
});

const complianceStaffSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add staff member name"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Please add staff member email"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    role: {
      type: String,
      required: [true, "Please add staff member role"]
    },
    department: {
      type: String,
      required: [true, "Please add department"],
      default: "Compliance Department"
    },
    level: {
      type: String,
      enum: ["Junior", "Mid-Level", "Senior"],
      default: "Mid-Level"
    },
    sections: [sectionSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    staffId: {
      type: String,
      sparse: true
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    emergencyContact: {
      name: {
        type: String,
      },
      relationship: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
    },
    qualifications: [{
      degree: String,
      institution: String,
      year: Number,
    }],
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
    }],
    specializations: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive", "Terminated"],
      default: "Active",
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

complianceStaffSchema.index({ email: 1 });
complianceStaffSchema.index({ role: 1 });
complianceStaffSchema.index({ department: 1 });
complianceStaffSchema.index({ status: 1 });
complianceStaffSchema.index({ isActive: 1 });

module.exports = mongoose.model("ComplianceStaff", complianceStaffSchema);