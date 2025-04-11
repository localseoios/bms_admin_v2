const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a service name"],
      unique: true,
      trim: true,
      maxlength: [100, "Service name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a service description"],
      trim: true,
      maxlength: [
        500,
        "Service description cannot be more than 500 characters",
      ],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
