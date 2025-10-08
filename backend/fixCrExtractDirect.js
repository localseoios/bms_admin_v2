require("dotenv").config();
const mongoose = require("mongoose");
const { CompanyDetails } = require("./src/models/OperationModels");

async function fixCrExtractDirect() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");

    const companyId = "684aa14e9806a7e283b5b52f";

    console.log(`Finding company details: ${companyId}`);
    const companyDetail = await CompanyDetails.findById(companyId);

    if (!companyDetail) {
      console.log("❌ Company details not found");
      process.exit(1);
    }

    console.log("Current crExtract:", companyDetail.crExtract[0]);

    if (Array.isArray(companyDetail.crExtract) && companyDetail.crExtract.length > 0) {
      const firstElement = companyDetail.crExtract[0].toObject ? companyDetail.crExtract[0].toObject() : companyDetail.crExtract[0];

      console.log("Converted to plain object");

      if (firstElement && typeof firstElement === 'object' && !firstElement.fileUrl) {
        console.log("All keys:", Object.keys(firstElement).slice(0, 20));

        // Get all entries
        const allEntries = Object.entries(firstElement);
        console.log("Total entries:", allEntries.length);

        // Filter out special keys
        const filtered = allEntries.filter(([k]) => !['_id', 'uploadedAt', 'uploadedBy'].includes(k));
        console.log("After filtering special keys:", filtered.length);

        // Only numeric string keys
        const numericEntries = filtered.filter(([k]) => /^\d+$/.test(k));
        console.log("Numeric keys:", numericEntries.length);

        // Sort by key (numerically)
        numericEntries.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

        // Reconstruct URL from values
        const reconstructedUrl = numericEntries.map(([, v]) => v).join('');

        console.log(`First 50 chars: ${reconstructedUrl.substring(0, 50)}`);

        if (reconstructedUrl.startsWith('http')) {
          companyDetail.crExtract = [{
            fileUrl: reconstructedUrl,
            fileName: "CR Extract Document",
            uploadedAt: firstElement.uploadedAt || new Date(),
            uploadedBy: firstElement.uploadedBy || companyDetail.updatedBy,
            description: `Fixed on ${new Date().toLocaleDateString()}`
          }];

          console.log("Saving fixed document...");
          await companyDetail.save();
          console.log("✅ Successfully fixed the document!");
          console.log("New crExtract:", companyDetail.crExtract[0]);
        } else {
          console.log("❌ Reconstructed URL doesn't start with 'http'");
        }
      } else {
        console.log("✅ Document appears to be correct (already has fileUrl)");
        console.log("crExtract structure:", companyDetail.crExtract[0]);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

fixCrExtractDirect();
