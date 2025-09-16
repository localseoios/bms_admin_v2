const mongoose = require('mongoose');
const ComplianceCulture = require('../models/complianceCultureModel');
const SectionSettings = require('../models/sectionSettingsModel');

const cleanupOrphanedDocuments = async () => {
  try {
    console.log('=== CLEANUP ORPHANED DOCUMENTS ===');

    // Get all active sections
    const activeSections = await SectionSettings.find({ isActive: true });
    const activeSectionIds = activeSections.map(section => section.sectionId);

    console.log('Active sections:', activeSectionIds);

    // Find all documents
    const allDocs = await ComplianceCulture.find({}).select('_id title sectionId category');
    console.log(`Total documents: ${allDocs.length}`);

    // Find documents with orphaned sectionIds
    const orphanedDocs = allDocs.filter(doc =>
      doc.sectionId && !activeSectionIds.includes(doc.sectionId)
    );

    console.log(`Orphaned documents: ${orphanedDocs.length}`);
    orphanedDocs.forEach(doc => {
      console.log(`  - ${doc.title} (sectionId: ${doc.sectionId})`);
    });

    // Clean up orphaned documents
    if (orphanedDocs.length > 0) {
      const result = await ComplianceCulture.updateMany(
        {
          _id: { $in: orphanedDocs.map(d => d._id) }
        },
        { $unset: { sectionId: 1 } }
      );

      console.log(`Cleaned up ${result.modifiedCount} orphaned documents`);
    }

    // Find legacy documents without sectionId
    const legacyDocs = allDocs.filter(doc => !doc.sectionId);
    console.log(`Legacy documents (without sectionId): ${legacyDocs.length}`);

    console.log('=== CLEANUP COMPLETE ===');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

module.exports = { cleanupOrphanedDocuments };