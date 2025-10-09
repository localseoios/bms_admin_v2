// migration/removeTimeField.js
// Run this script once to remove the static time field from existing notifications

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const migrateNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB for migration...");

    // Remove the time field from all existing notifications
    const result = await mongoose.connection.db
      .collection("notifications")
      .updateMany(
        {}, // Match all documents
        { $unset: { time: "" } } // Remove the time field
      );

    console.log(
      `Migration completed: ${result.modifiedCount} notifications updated`
    );

    // Also remove any notifications that might be missing required fields
    const cleanupResult = await mongoose.connection.db
      .collection("notifications")
      .deleteMany({
        $or: [
          { title: { $exists: false } },
          { description: { $exists: false } },
          { type: { $exists: false } },
        ],
      });

    console.log(
      `Cleanup completed: ${cleanupResult.deletedCount} invalid notifications removed`
    );
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the migration
migrateNotifications();
