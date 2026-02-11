const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const archiveSchema = new mongoose.Schema({
  documentType: String,
  sourceType: String,
}, { strict: false });

const Archive = mongoose.model("Archive", archiveSchema);

async function migrateEngagementLetters() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all archives where documentType is engagement_letter but sourceType is company
    const result = await Archive.updateMany(
      { 
        documentType: "engagement_letter",
        sourceType: "company"
      },
      { 
        $set: { sourceType: "engagement_letter" }
      }
    );

    console.log(`Updated ${result.modifiedCount} engagement letter archives`);
    console.log("Migration completed successfully!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateEngagementLetters();
