// controllers/clientController.js

const Client = require("../models/Client");
const Job = require("../models/Job");
const { CompanyDetails } = require("../models/OperationModels");
const { findPersonDetailsByGmail } = require("../utils/clientUtils"); // Import the utility function

// Get client by Gmail with enhanced information including engagement letter
const getClientByGmail = async (req, res) => {
  const { gmail } = req.params;
  try {
    // Find the client
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get all jobs for this client
    const jobs = await Job.find({ clientId: client._id });

    // Find the most recent engagement letter for this client
    let engagementLetter = null;
    if (jobs.length > 0) {
      const jobIds = jobs.map((job) => job._id);
      const companyDetailsWithLetter = await CompanyDetails.findOne({
        jobId: { $in: jobIds },
        engagementLetters: { $exists: true, $ne: null },
      }).sort({ updatedAt: -1 }); // Get the most recently updated one

      if (companyDetailsWithLetter) {
        engagementLetter = companyDetailsWithLetter.engagementLetters;
      }
    }

    // Return the enhanced response with engagement letter
    res.status(200).json({
      client,
      jobs,
      engagementLetter,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get engagement letter for a specific client by Gmail
const getEngagementLetterByGmail = async (req, res) => {
  const { gmail } = req.params;
  try {
    // Find the client
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get all jobs for this client
    const jobs = await Job.find({ clientId: client._id });

    // Find the most recent engagement letter for this client
    let engagementLetter = null;
    if (jobs.length > 0) {
      const jobIds = jobs.map((job) => job._id);
      const companyDetailsWithLetter = await CompanyDetails.findOne({
        jobId: { $in: jobIds },
        engagementLetters: { $exists: true, $ne: null },
      }).sort({ updatedAt: -1 }); // Get the most recently updated one

      if (companyDetailsWithLetter) {
        engagementLetter = companyDetailsWithLetter.engagementLetters;
      }
    }

    if (!engagementLetter) {
      return res
        .status(404)
        .json({ message: "No engagement letter found for this client" });
    }

    // Return just the engagement letter URL
    res.status(200).json({ engagementLetter });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get person details by Gmail
const getPersonDetailsByGmail = async (req, res) => {
  const { gmail, personType } = req.params;
  
  // Validate personType
  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    return res.status(400).json({ message: "Invalid person type" });
  }
  
  try {
    console.log(`Looking for ${personType} details for gmail: ${gmail}`);
    const personDetails = await findPersonDetailsByGmail(gmail, personType);
    
    if (!personDetails) {
      return res.status(404).json({ 
        message: `No ${personType} details found for client with Gmail ${gmail}`
      });
    }
    
    console.log(`Returning ${personType} details for gmail: ${gmail}`);
    res.status(200).json(personDetails);
  } catch (error) {
    console.error(`Error in getPersonDetailsByGmail:`, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/**
 * Synchronize person details across all jobs for a client
 */
const synchronizeClientPersonDetails = async (req, res) => {
  const { gmail, personType } = req.params;
  const { sourcePersonId } = req.body;

  // Validate personType
  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    return res.status(400).json({ message: "Invalid person type" });
  }

  try {
    // Import the utility functions
    const { 
      findAllPersonDetailsByGmail, 
      synchronizePersonDetails 
    } = require("../utils/clientUtils");

    // First check if multiple records exist
    const allRecords = await findAllPersonDetailsByGmail(gmail, personType);
    
    if (allRecords.length <= 1) {
      return res.status(200).json({
        success: true,
        message: "No synchronization needed - only one or zero records found",
        records: allRecords
      });
    }

    // Perform the synchronization
    const syncResult = await synchronizePersonDetails(gmail, personType, sourcePersonId);
    
    if (!syncResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Synchronization failed", 
        error: syncResult.message 
      });
    }

    // Get the updated records after synchronization
    const updatedRecords = await findAllPersonDetailsByGmail(gmail, personType);

    // Return success with updated records
    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncResult.updatedRecords} records`,
      sourceRecord: syncResult.source,
      updatedRecords: syncResult.updatedRecords,
      records: updatedRecords
    });
  } catch (error) {
    console.error("Error in synchronizeClientPersonDetails:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error during synchronization", 
      error: error.message 
    });
  }
};

/**
 * Get inconsistencies in person details across all jobs for a client
 */
const checkPersonDetailsInconsistencies = async (req, res) => {
  const { gmail } = req.params;
  
  try {
    // Import utility functions
    const { findAllPersonDetailsByGmail } = require("../utils/clientUtils");
    
    const results = {};
    const inconsistencies = {};
    
    // Check each person type
    for (const personType of ["director", "shareholder", "secretary", "sef"]) {
      const records = await findAllPersonDetailsByGmail(gmail, personType);
      results[personType] = records.length;
      
      // If more than one record exists, check for inconsistencies
      if (records.length > 1) {
        const firstRecord = records[0];
        
        // Fields to compare
        const fieldsToCheck = [
          'name', 'nationality', 'qidNo', 'mobileNo', 'email', 
          'passportNo', 'nationalAddress'
        ];
        
        // Compare each field across all records
        fieldsToCheck.forEach(field => {
          const uniqueValues = new Set(
            records
              .map(r => r[field])
              .filter(val => val !== null && val !== undefined && val !== '')
          );
          
          if (uniqueValues.size > 1) {
            if (!inconsistencies[personType]) {
              inconsistencies[personType] = {};
            }
            inconsistencies[personType][field] = Array.from(uniqueValues);
          }
        });
      }
    }
    
    // Return the results
    return res.status(200).json({
      records: results,
      hasInconsistencies: Object.keys(inconsistencies).length > 0,
      inconsistencies
    });
  } catch (error) {
    console.error("Error checking inconsistencies:", error);
    return res.status(500).json({ 
      message: "Server error checking inconsistencies", 
      error: error.message 
    });
  }
};

/**
 * Get company details status across all jobs for a client
 */
const checkCompanyDetailsStatus = async (req, res) => {
  const { gmail } = req.params;
  
  try {
    // First find the client
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get all jobs for this client
    const jobs = await Job.find({ clientId: client._id });
    
    // Count jobs with company details
    let jobsWithCompanyDetails = 0;
    
    for (const job of jobs) {
      const companyDetails = await CompanyDetails.findOne({ jobId: job._id });
      if (companyDetails) {
        jobsWithCompanyDetails++;
      }
    }
    
    // Return the results
    return res.status(200).json({
      totalJobs: jobs.length,
      jobsWithCompanyDetails,
      hasMultipleJobs: jobs.length > 1
    });
  } catch (error) {
    console.error("Error checking company details status:", error);
    return res.status(500).json({ 
      message: "Server error checking company details", 
      error: error.message 
    });
  }
};


module.exports = {
  getClientByGmail,
  getEngagementLetterByGmail,
  getPersonDetailsByGmail,
  synchronizeClientPersonDetails,
  checkPersonDetailsInconsistencies,
  checkCompanyDetailsStatus,
};
