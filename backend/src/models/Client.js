const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gmail: { type: String, required: true, unique: true }, // Now stores any email
    startingPoint: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ['Pending', 'Low', 'Medium', 'High'],
      default: 'Pending'
    },
    clientCode: { type: String, default: '', unique: true, sparse: true },
    crNo: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    cddType: {
      type: String,
      enum: ['', 'SDD', 'RDD', 'EDD'],
      default: ''
    },
    lastReviewDate: { type: Date, default: null },
  },
  { timestamps: true }
);

clientSchema.statics.getNextClientCode = async function() {
  // Get all clients with numeric client codes
  const clients = await this.find({
    clientCode: { $ne: '', $exists: true }
  }).select('clientCode');

  if (!clients || clients.length === 0) {
    return '1';
  }

  // Find the maximum numeric code
  let maxCode = 0;
  clients.forEach(client => {
    const code = parseInt(client.clientCode, 10);
    if (!isNaN(code) && code > maxCode) {
      maxCode = code;
    }
  });

  // Return the next code
  let nextCode = maxCode + 1;

  // Check if this code already exists (collision check)
  let exists = await this.findOne({ clientCode: String(nextCode) });
  while (exists) {
    nextCode++;
    exists = await this.findOne({ clientCode: String(nextCode) });
  }

  return String(nextCode);
};

module.exports = mongoose.model("Client", clientSchema);
