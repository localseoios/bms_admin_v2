const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bms_db');

const ComplianceCulture = require('../models/complianceCultureModel');

const checkDocs = async () => {
  try {
    console.log('=== CHECKING DOCUMENT SECTION IDS ===');

    // Get all documents
    const docs = await ComplianceCulture.find({}).select('_id title sectionId category createdAt').sort('-createdAt');

    console.log(`Total documents: ${docs.length}`);
    console.log('');

    docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title}`);
      console.log(`   sectionId: ${doc.sectionId || 'NULL'}`);
      console.log(`   category: ${doc.category}`);
      console.log(`   created: ${doc.createdAt}`);
      console.log('');
    });

    const docsWithSectionId = docs.filter(d => d.sectionId);
    const docsWithoutSectionId = docs.filter(d => !d.sectionId);

    console.log(`Documents with sectionId: ${docsWithSectionId.length}`);
    console.log(`Documents without sectionId: ${docsWithoutSectionId.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDocs();