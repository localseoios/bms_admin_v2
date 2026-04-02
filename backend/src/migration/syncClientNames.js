const mongoose = require("mongoose");
const Client = require("../models/Client");
const Job = require("../models/Job");
const { CompanyDetails } = require("../models/OperationModels");
require("dotenv").config();

const syncClientNames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const clients = await Client.find({}).lean();
    console.log(`Found ${clients.length} clients`);

    let updatedCount = 0;

    for (const client of clients) {
      const latestJob = await Job.findOne({ clientId: client._id })
        .sort({ updatedAt: -1 })
        .lean();

      if (!latestJob) continue;

      const companyDetails = await CompanyDetails.findOne({ jobId: latestJob._id }).lean();

      if (companyDetails && companyDetails.companyName && companyDetails.companyName !== client.name) {
        console.log(`${client.name} → ${companyDetails.companyName}`);

        await Client.updateOne(
          { _id: client._id },
          { $set: { name: companyDetails.companyName } }
        );

        await Job.updateMany(
          { clientId: client._id },
          { $set: { clientName: companyDetails.companyName } }
        );

        updatedCount++;
      }
    }

    console.log(`\nSynced ${updatedCount} client names`);
    console.log("Done");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

syncClientNames();
