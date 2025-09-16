const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bms_db');

const ComplianceCulture = require('../models/complianceCultureModel');

const testSave = async () => {
  try {
    console.log('=== TESTING SECTION ID SAVE ===');

    const testDoc = {
      title: 'Test Document',
      description: 'Testing sectionId save',
      documentType: 'other',
      category: 'Other',
      uploadedBy: new mongoose.Types.ObjectId(),
      lastUpdatedBy: new mongoose.Types.ObjectId(),
      sectionId: 'test-section-123'
    };

    console.log('Creating document with data:', testDoc);

    const document = await ComplianceCulture.create(testDoc);

    console.log('Document created with ID:', document._id);
    console.log('Document sectionId in response:', document.sectionId);

    // Fetch the document back from database
    const fetchedDoc = await ComplianceCulture.findById(document._id);
    console.log('Fetched document sectionId:', fetchedDoc.sectionId);

    // Clean up
    await ComplianceCulture.deleteOne({ _id: document._id });
    console.log('Test document deleted');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testSave();