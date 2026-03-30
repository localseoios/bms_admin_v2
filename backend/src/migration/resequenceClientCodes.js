const mongoose = require("mongoose");
const Client = require("../models/Client");
require("dotenv").config();

const resequenceClientCodes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const clients = await Client.find({
      clientCode: { $ne: '', $exists: true }
    }).sort({ createdAt: 1 });

    console.log(`Found ${clients.length} clients with client codes`);

    const bulkOps = [];
    clients.forEach((client, index) => {
      const newCode = String(index + 1);
      if (client.clientCode !== newCode) {
        bulkOps.push({
          updateOne: {
            filter: { _id: client._id },
            update: { $set: { clientCode: newCode } }
          }
        });
        console.log(`${client.name}: ${client.clientCode} → ${newCode}`);
      }
    });

    if (bulkOps.length > 0) {
      await Client.bulkWrite(bulkOps);
      console.log(`Updated ${bulkOps.length} client codes`);
    } else {
      console.log("All client codes are already sequential");
    }

    console.log("Resequencing completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Resequencing error:", error);
    process.exit(1);
  }
};

resequenceClientCodes();
