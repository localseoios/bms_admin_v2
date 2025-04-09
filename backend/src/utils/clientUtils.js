// src/utils/clientUtils.js - Enhanced synchronization functions

const Client = require("../models/Client");
const Job = require("../models/Job");
const { PersonDetails, CompanyDetails } = require("../models/OperationModels");

/**
 * Find person details for a specific Gmail address and person type
 * Returns the most recently updated record
 */
const findPersonDetailsByGmail = async (gmail, personType) => {
  try {
    // First find the client by Gmail
    const client = await Client.findOne({ gmail });
    if (!client) {
      console.log(`No client found with Gmail: ${gmail}`);
      return null;
    }

    // Find all jobs for this client
    const clientJobs = await Job.find({ clientId: client._id });
    if (!clientJobs || clientJobs.length === 0) {
      console.log(`No jobs found for client with Gmail: ${gmail}`);
      return null;
    }

    // Get all job IDs for this client
    const jobIds = clientJobs.map((job) => job._id);
    console.log(
      `Found ${jobIds.length} jobs for Gmail ${gmail}, searching for ${personType} details`
    );

    // Find person details of the specified type for any of these jobs
    // Sort by updatedAt in descending order to get the most recently updated one first
    const personDetails = await PersonDetails.findOne({
      jobId: { $in: jobIds },
      personType,
    }).sort({ updatedAt: -1 }); // Get the most recently updated one

    if (personDetails) {
      console.log(`Found existing ${personType} details for Gmail ${gmail}`);
    } else {
      console.log(`No existing ${personType} details found for Gmail ${gmail}`);
    }

    return personDetails;
  } catch (error) {
    console.error(
      `Error finding ${personType} details by Gmail ${gmail}:`,
      error
    );
    return null;
  }
};

/**
 * Find all person details across all jobs for this Gmail and person type
 * This is useful for detecting inconsistencies
 */
const findAllPersonDetailsByGmail = async (gmail, personType) => {
  try {
    // First find the client by Gmail
    const client = await Client.findOne({ gmail });
    if (!client) {
      console.log(`No client found with Gmail: ${gmail}`);
      return [];
    }

    // Find all jobs for this client
    const clientJobs = await Job.find({ clientId: client._id });
    if (!clientJobs || clientJobs.length === 0) {
      console.log(`No jobs found for client with Gmail: ${gmail}`);
      return [];
    }

    // Get all job IDs for this client
    const jobIds = clientJobs.map((job) => job._id);

    // Find ALL person details of the specified type for all of these jobs
    const allPersonDetails = await PersonDetails.find({
      jobId: { $in: jobIds },
      personType,
    }).sort({ updatedAt: -1 });

    console.log(
      `Found ${allPersonDetails.length} ${personType} records for Gmail ${gmail}`
    );

    return allPersonDetails;
  } catch (error) {
    console.error(
      `Error finding all ${personType} details by Gmail ${gmail}:`,
      error
    );
    return [];
  }
};


/**
 * Find company details for a specific Gmail address
 * Returns the most recently updated record
 */
const findCompanyDetailsByGmail = async (gmail) => {
  try {
    // First find the client by Gmail
    const client = await Client.findOne({ gmail });
    if (!client) {
      console.log(`No client found with Gmail: ${gmail}`);
      return null;
    }

    // Find all jobs for this client
    const clientJobs = await Job.find({ clientId: client._id });
    if (!clientJobs || clientJobs.length === 0) {
      console.log(`No jobs found for client with Gmail: ${gmail}`);
      return null;
    }

    // Get all job IDs for this client
    const jobIds = clientJobs.map((job) => job._id);
    console.log(
      `Found ${jobIds.length} jobs for Gmail ${gmail}, searching for company details`
    );

    // Find company details for any of these jobs
    // Sort by updatedAt in descending order to get the most recently updated one first
    const companyDetails = await CompanyDetails.findOne({
      jobId: { $in: jobIds },
    }).sort({ updatedAt: -1 }); // Get the most recently updated one

    if (companyDetails) {
      console.log(`Found existing company details for Gmail ${gmail}`);
    } else {
      console.log(`No existing company details found for Gmail ${gmail}`);
    }

    return companyDetails;
  } catch (error) {
    console.error(`Error finding company details by Gmail ${gmail}:`, error);
    return null;
  }
};

/**
 * Synchronize company details across all jobs for a client
 */
const synchronizeCompanyDetails = async (gmail, sourceJobId) => {
  try {
    console.log(`Starting synchronization of company details for ${gmail}`);
    
    // Find the client by Gmail
    const client = await Client.findOne({ gmail });
    if (!client) {
      return { success: false, message: "Client not found" };
    }

    // Find all jobs for this client
    const clientJobs = await Job.find({ clientId: client._id });
    if (!clientJobs || clientJobs.length <= 1) {
      return { 
        success: true, 
        message: "No synchronization needed - only one or zero jobs found", 
        updatedRecords: 0 
      };
    }

    // Get the source company details
    const sourceCompanyDetails = await CompanyDetails.findOne({ jobId: sourceJobId });
    if (!sourceCompanyDetails) {
      return { success: false, message: "Source company details not found" };
    }

    console.log(`Using company details from job ${sourceJobId} as source of truth`);

    // Fields to synchronize (excluding job-specific fields)
    const fieldsToSync = [
      "companyName", "qfcNo", "registeredAddress", "incorporationDate", 
      "serviceType", "engagementLetters", "mainPurpose", "expiryDate",
      "companyComputerCard", "companyComputerCardExpiry", "taxCard", 
      "taxCardExpiry", "crExtract", "crExtractExpiry", "scopeOfLicense", 
      "scopeOfLicenseExpiry", "articleOfAssociate", "certificateOfIncorporate",
      "kycActiveStatus"
    ];

    // Create update data object with only the fields that have values
    const updateData = {};
    fieldsToSync.forEach(field => {
      if (sourceCompanyDetails[field] !== null && 
          sourceCompanyDetails[field] !== undefined && 
          sourceCompanyDetails[field] !== "") {
        updateData[field] = sourceCompanyDetails[field];
      }
    });

    console.log(`Update data prepared with fields: ${Object.keys(updateData).join(", ")}`);

    // Find jobs to update (all except the source job)
    const jobsToUpdate = clientJobs.filter(job => 
      job._id.toString() !== sourceJobId.toString()
    );

    console.log(`Found ${jobsToUpdate.length} jobs to update`);

    let updatedCount = 0;

    // Update company details for each job
    for (const job of jobsToUpdate) {
      console.log(`Updating company details for job ${job._id}`);
      
      // Check if company details exist for this job
      let companyDetails = await CompanyDetails.findOne({ jobId: job._id });
      
      if (companyDetails) {
        // Update existing company details
        const result = await CompanyDetails.updateOne(
          { jobId: job._id },
          { $set: { ...updateData, updatedAt: new Date() } }
        );
        
        console.log(`Update result for job ${job._id}: ${JSON.stringify(result)}`);
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          
          // Add timeline entry
          await Job.updateOne(
            { _id: job._id },
            {
              $push: {
                timeline: {
                  status: "updated",
                  description: "Company details synchronized from another job",
                  timestamp: new Date(),
                }
              }
            }
          );
        }
      } else {
        // Create new company details with synchronized data
        const newCompanyDetails = new CompanyDetails({
          jobId: job._id,
          ...updateData,
          updatedBy: sourceCompanyDetails.updatedBy,
        });
        
        await newCompanyDetails.save();
        updatedCount++;
        
        // Add timeline entry
        await Job.updateOne(
          { _id: job._id },
          {
            $push: {
              timeline: {
                status: "updated",
                description: "Company details synchronized from another job",
                timestamp: new Date(),
              }
            }
          }
        );
        
        console.log(`Created new company details for job ${job._id}`);
      }
    }

    console.log(`Synchronized ${updatedCount} company detail records for ${gmail}`);

    return {
      success: true,
      message: `Synchronized ${updatedCount} records`,
      source: sourceJobId,
      updatedRecords: updatedCount,
    };
  } catch (error) {
    console.error(`Error synchronizing company details: ${error.message}`);
    return { success: false, message: error.message };
  }
};


/**
 * Improved synchronize person details across all jobs for a client
 * This ensures all person records for the same email and type have consistent data
 */
const synchronizePersonDetails = async (
  gmail,
  personType,
  sourcePersonId = null
) => {
  try {
    // Log the start of synchronization
    console.log(
      `Starting synchronization for ${personType} details with Gmail ${gmail}`
    );

    // Get all person details for this client and type
    const allPersonDetails = await findAllPersonDetailsByGmail(
      gmail,
      personType
    );

    if (allPersonDetails.length <= 1) {
      console.log(`No synchronization needed - only one or zero records found`);
      return {
        success: true,
        message: "No synchronization needed",
        updatedRecords: 0,
      };
    }

    // Determine which record to use as the source of truth
    let sourceRecord;

    if (sourcePersonId) {
      // If a specific ID was provided, use that record
      sourceRecord = allPersonDetails.find(
        (record) => record._id.toString() === sourcePersonId
      );
      if (!sourceRecord) {
        console.error(`Source record with ID ${sourcePersonId} not found`);
        return { success: false, message: "Source record not found" };
      }
    } else {
      // Otherwise use the most recently updated record
      sourceRecord = allPersonDetails[0]; // Already sorted by updatedAt desc
    }

    console.log(
      `Using record ID ${sourceRecord._id} as source of truth for synchronization`
    );

    // Fields to synchronize (excluding job-specific fields like jobId)
    const fieldsToSync = [
      "name",
      "nationality",
      "visaCopy",
      "qidNo",
      "qidDoc",
      "qidExpiry",
      "nationalAddress",
      "nationalAddressDoc",
      "nationalAddressExpiry",
      "passportNo",
      "passportDoc",
      "passportExpiry",
      "mobileNo",
      "email",
      "cv",
    ];

    // Create update data object with only the fields that have values
    const updateData = {};
    fieldsToSync.forEach((field) => {
      // Only include fields that have actual values in the source record
      if (
        sourceRecord[field] !== null && 
        sourceRecord[field] !== undefined && 
        sourceRecord[field] !== ""
      ) {
        updateData[field] = sourceRecord[field];
      }
    });

    console.log(`Update data prepared with fields: ${Object.keys(updateData).join(", ")}`);

    // Update all records except the source
    const recordsToUpdate = allPersonDetails.filter(
      (record) => record._id.toString() !== sourceRecord._id.toString()
    );

    console.log(`Found ${recordsToUpdate.length} records to update`);

    // Create update promises - add more detailed logging
    const updatePromises = recordsToUpdate.map((record) => {
      console.log(`Updating record ${record._id} for job ${record.jobId}`);

      // Add a timestamp to ensure the update is reflected in updatedAt
      const updatedData = {
        ...updateData,
        // Also update the updatedAt timestamp explicitly
        updatedAt: new Date(),
      };

      return PersonDetails.updateOne(
        { _id: record._id },
        { $set: updatedData }
      ).then((result) => {
        console.log(
          `Update result for record ${record._id}: ${JSON.stringify(result)}`
        );
        return result;
      });
    });

    const results = await Promise.all(updatePromises);

    // Count how many documents were actually modified
    const modifiedCount = results.reduce(
      (sum, result) => sum + (result.modifiedCount || 0),
      0
    );

    console.log(
      `Synchronized ${modifiedCount} records for ${gmail} (${personType})`
    );

    // Update Job timelines to reflect the synchronization
    const jobsWithUpdatedRecords = recordsToUpdate.map(
      (record) => record.jobId
    );
    if (jobsWithUpdatedRecords.length > 0) {
      console.log(
        `Updating timelines for ${jobsWithUpdatedRecords.length} jobs`
      );

      try {
        // Add a timeline entry for each affected job
        const timelineUpdates = await Job.updateMany(
          { _id: { $in: jobsWithUpdatedRecords } },
          {
            $push: {
              timeline: {
                status: "updated",
                description: `${
                  personType.charAt(0).toUpperCase() + personType.slice(1)
                } details synchronized from another job`,
                timestamp: new Date(),
                // We don't have the user ID here, so this will be null
              },
            },
          }
        );

        console.log(
          `Updated timelines for ${timelineUpdates.modifiedCount} jobs`
        );
      } catch (timelineError) {
        console.error(`Error updating job timelines: ${timelineError.message}`);
        // Continue even if timeline updates fail
      }
    }

    return {
      success: true,
      message: `Synchronized ${modifiedCount} records`,
      source: sourceRecord._id,
      updatedRecords: modifiedCount,
    };
  } catch (error) {
    console.error(`Error synchronizing person details: ${error.message}`);
    return { success: false, message: error.message };
  }
};

module.exports = {
  findPersonDetailsByGmail,
  findAllPersonDetailsByGmail,
  synchronizePersonDetails,
  findCompanyDetailsByGmail,
  synchronizeCompanyDetails,
};