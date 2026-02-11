const mongoose = require("mongoose");
const Client = require("../models/Client");
require("dotenv").config();

const assignClientCodes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const clientsWithoutCode = await Client.find({
      $or: [{ clientCode: "" }, { clientCode: null }, { clientCode: { $exists: false } }]
    }).sort({ createdAt: 1 });

    console.log(`Found ${clientsWithoutCode.length} clients without client code`);

    let currentCode = 1;
    const existingCodes = await Client.find({ clientCode: { $ne: "" } }).select("clientCode");
    const usedCodes = new Set(existingCodes.map(c => parseInt(c.clientCode, 10)).filter(n => !isNaN(n)));

    if (usedCodes.size > 0) {
      currentCode = Math.max(...usedCodes) + 1;
    }

    for (const client of clientsWithoutCode) {
      while (usedCodes.has(currentCode)) {
        currentCode++;
      }

      await Client.updateOne(
        { _id: client._id },
        { $set: { clientCode: String(currentCode) } }
      );

      console.log(`Assigned code ${currentCode} to client: ${client.name} (${client.gmail})`);
      usedCodes.add(currentCode);
      currentCode++;
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

assignClientCodes();
