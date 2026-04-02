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

    const tempOps = clients.map((client, index) => ({
      updateOne: {
        filter: { _id: client._id },
        update: { $set: { clientCode: `temp_${index + 1}` } }
      }
    }));

    if (tempOps.length > 0) {
      await Client.bulkWrite(tempOps, { ordered: false });
      console.log("Set temporary codes");
    }

    const finalOps = clients.map((client, index) => {
      const newCode = String(index + 1);
      console.log(`${client.name}: ${client.clientCode} → ${newCode}`);
      return {
        updateOne: {
          filter: { _id: client._id },
          update: { $set: { clientCode: newCode } }
        }
      };
    });

    if (finalOps.length > 0) {
      await Client.bulkWrite(finalOps, { ordered: false });
      console.log(`Updated ${finalOps.length} client codes`);
    }

    console.log("Resequencing completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Resequencing error:", error);
    process.exit(1);
  }
};

resequenceClientCodes();
