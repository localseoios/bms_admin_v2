const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gmail: { type: String, required: true, unique: true }, // Now stores any email
    startingPoint: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
