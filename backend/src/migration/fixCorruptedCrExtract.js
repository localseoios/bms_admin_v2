require("dotenv").config();
const mongoose = require("mongoose");
const { CompanyDetails } = require("../models/OperationModels");

async function fixCorruptedCrExtract() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bms_db");

    console.log("Starting CR Extract corruption fix...");

    const allCompanyDetails = await CompanyDetails.find({});

    let fixedCount = 0;
    let errorCount = 0;

    for (const companyDetail of allCompanyDetails) {
      try {
        let needsUpdate = false;

        if (Array.isArray(companyDetail.crExtract) && companyDetail.crExtract.length > 0) {
          const firstElement = companyDetail.crExtract[0];

          if (firstElement && typeof firstElement === 'object' && !firstElement.fileUrl) {
            const keys = Object.keys(firstElement);
            const hasNumberKeys = keys.some(key => !isNaN(parseInt(key)));

            if (hasNumberKeys) {
              console.log(`Found corrupted crExtract in company ${companyDetail._id}`);
              console.log(`Corrupted data:`, JSON.stringify(firstElement).substring(0, 100));

              const reconstructedUrl = Object.values(firstElement).join('');
              console.log(`Reconstructed URL: ${reconstructedUrl}`);

              if (reconstructedUrl.startsWith('http')) {
                companyDetail.crExtract = [{
                  fileUrl: reconstructedUrl,
                  fileName: "CR Extract Document",
                  uploadedAt: firstElement.uploadedAt || new Date(),
                  uploadedBy: firstElement.uploadedBy || companyDetail.updatedBy,
                  description: `Fixed on ${new Date().toLocaleDateString()}`
                }];

                needsUpdate = true;
              }
            }
          }
        }

        if (needsUpdate) {
          await companyDetail.save();
          fixedCount++;
          console.log(`✅ Fixed company ${companyDetail._id}`);
        }

      } catch (itemError) {
        console.error(`Error processing company ${companyDetail._id}:`, itemError.message);
        errorCount++;
      }
    }

    console.log(`\n=== Fix Complete ===`);
    console.log(`Total companies checked: ${allCompanyDetails.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

if (require.main === module) {
  fixCorruptedCrExtract();
}

module.exports = fixCorruptedCrExtract;
