require("dotenv").config();
const mongoose = require("mongoose");
const { CompanyDetails } = require("../models/OperationModels");

async function fixSpecificCrExtract() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");

    const companyId = "683d863146f1e2a6ebe4b785";

    console.log(`Finding company details: ${companyId}`);
    const companyDetail = await CompanyDetails.findById(companyId);

    if (!companyDetail) {
      console.log("Company details not found");
      await mongoose.connection.close();
      return;
    }

    console.log("Current crExtract:", JSON.stringify(companyDetail.crExtract[0]).substring(0, 200));

    if (Array.isArray(companyDetail.crExtract) && companyDetail.crExtract.length > 0) {
      const firstElement = companyDetail.crExtract[0];

      if (firstElement && typeof firstElement === 'object' && !firstElement.fileUrl) {
        const reconstructedUrl = Object.values(firstElement).join('');
        console.log(`Reconstructed URL: ${reconstructedUrl}`);

        companyDetail.crExtract = [{
          fileUrl: reconstructedUrl,
          fileName: "CR Extract Document",
          uploadedAt: new Date(),
          uploadedBy: companyDetail.updatedBy,
          description: `Fixed on ${new Date().toLocaleDateString()}`
        }];

        console.log("Saving fixed document...");
        await companyDetail.save();
        console.log("✅ Successfully fixed the document!");
      } else {
        console.log("Document doesn't appear to be corrupted or already has fileUrl");
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

fixSpecificCrExtract();
