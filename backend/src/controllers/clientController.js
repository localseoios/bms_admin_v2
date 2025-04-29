// controllers/clientController.js

const Client = require("../models/Client");
const Job = require("../models/Job");
const { CompanyDetails } = require("../models/OperationModels");
const { findPersonDetailsByGmail } = require("../utils/clientUtils"); // Import the utility function
const asyncHandler = require("express-async-handler");

// Modified getClientByGmail to work with any email format
const getClientByGmail = async (req, res) => {
  const { gmail } = req.params; // Despite the name, this now contains any email
  try {
    // Find the client using the email (stored in the gmail field)
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Rest of the function remains the same
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

// We don't need to modify other functions as they will work with any email
// stored in the gmail field of the Client model

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

const getAssignedClients = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(`Finding jobs assigned to user ${req.user._id}`);

    // First, get all jobs assigned to this user
    const assignedJobs = await Job.find({ assignedPerson: req.user._id })
      .select("clientId serviceType status createdAt")
      .populate("clientId", "name gmail startingPoint");

    console.log(
      `Found ${assignedJobs ? assignedJobs.length : 0} assigned jobs`
    );

    if (!assignedJobs || assignedJobs.length === 0) {
      return res.status(200).json({
        clients: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
        },
        message: "No clients are currently assigned to you",
      });
    }

    // Group jobs by client
    const clientsMap = {};

    assignedJobs.forEach((job) => {
      // Skip jobs with no valid clientId (just in case)
      if (!job.clientId || !job.clientId._id) {
        console.log(`Job ${job._id} has no valid clientId, skipping`);
        return;
      }

      const clientId = job.clientId._id.toString();

      if (!clientsMap[clientId]) {
        clientsMap[clientId] = {
          _id: job.clientId._id,
          name: job.clientId.name,
          gmail: job.clientId.gmail,
          startingPoint: job.clientId.startingPoint,
          jobs: [],
          jobCount: 0,
          activeJobCount: 0,
          latestJobDate: null,
          latestServiceType: null,
        };
      }

      // Add job to client's jobs array
      clientsMap[clientId].jobs.push({
        _id: job._id,
        serviceType: job.serviceType,
        status: job.status,
        createdAt: job.createdAt,
      });

      // Update counts
      clientsMap[clientId].jobCount++;

      if (!["completed", "cancelled", "rejected"].includes(job.status)) {
        clientsMap[clientId].activeJobCount++;
      }

      // Update latest job info if needed
      if (
        !clientsMap[clientId].latestJobDate ||
        new Date(job.createdAt) > new Date(clientsMap[clientId].latestJobDate)
      ) {
        clientsMap[clientId].latestJobDate = job.createdAt;
        clientsMap[clientId].latestServiceType = job.serviceType;
      }
    });

    // Convert to array and sort by latest job date
    let clientsArray = Object.values(clientsMap);

    console.log(`Grouped into ${clientsArray.length} unique clients`);

    if (clientsArray.length === 0) {
      return res.status(200).json({
        clients: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
        },
        message: "No valid clients found in your assigned jobs",
      });
    }

    clientsArray.sort((a, b) => {
      if (!a.latestJobDate) return 1;
      if (!b.latestJobDate) return -1;
      return new Date(b.latestJobDate) - new Date(a.latestJobDate);
    });

    // Get total count for pagination
    const totalClients = clientsArray.length;

    // Apply pagination
    clientsArray = clientsArray.slice(skip, skip + limit);

    // For each client in the paginated list, find engagement letter
    const jobIdsByClient = {};
    clientsArray.forEach((client) => {
      jobIdsByClient[client._id.toString()] = client.jobs.map((job) => job._id);
    });

    // Flatten job IDs array for query
    const allJobIds = [].concat(...Object.values(jobIdsByClient));

    console.log(`Looking for engagement letters for ${allJobIds.length} jobs`);

    // Get all engagement letters in one query
    const companyDetailsWithLetters = await CompanyDetails.find({
      jobId: { $in: allJobIds },
      engagementLetters: { $exists: true, $ne: null },
    }).select("jobId engagementLetters");

    console.log(`Found ${companyDetailsWithLetters.length} engagement letters`);

    // Map job IDs to letters
    const engagementLettersByJob = {};
    companyDetailsWithLetters.forEach((detail) => {
      engagementLettersByJob[detail.jobId.toString()] =
        detail.engagementLetters;
    });

    // Add engagement letter to each client
    clientsArray = clientsArray.map((client) => {
      // Find first job with a letter
      const jobWithLetter = client.jobs.find(
        (job) => engagementLettersByJob[job._id.toString()]
      );

      // Clean up by removing the jobs array which we no longer need to return
      const { jobs, ...clientData } = client;

      return {
        ...clientData,
        engagementLetter: jobWithLetter
          ? engagementLettersByJob[jobWithLetter._id.toString()]
          : null,
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalClients / limit);

    res.status(200).json({
      clients: clientsArray,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalClients,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error retrieving assigned clients:", error);
    res.status(500).json({
      message: "Error retrieving assigned clients",
      error: error.message,
    });
  }
});


module.exports = {
  getClientByGmail,
  getEngagementLetterByGmail,
  getPersonDetailsByGmail,
  synchronizeClientPersonDetails,
  checkPersonDetailsInconsistencies,
  checkCompanyDetailsStatus,
  getAssignedClients, // New function added
};
