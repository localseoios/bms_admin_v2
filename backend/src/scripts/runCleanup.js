const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bms_db');

const { cleanupOrphanedDocuments } = require('../utils/cleanupOrphanedDocuments');

const run = async () => {
  try {
    await cleanupOrphanedDocuments();
    console.log('Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

run();