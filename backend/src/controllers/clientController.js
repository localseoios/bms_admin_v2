// controllers/clientController.js - Updated to include documents from most recent job

const Client = require("../models/Client");
const Job = require("../models/Job");
const { CompanyDetails } = require("../models/OperationModels");
const { findPersonDetailsByGmail } = require("../utils/clientUtils");
const asyncHandler = require("express-async-handler");

// Modified getClientByGmail to include documents from most recent job
const getClientByGmail = async (req, res) => {
  const { gmail } = req.params;
  try {
    // Find the client using the email (stored in the gmail field)
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get all jobs for this client, sorted by most recent first
    const jobs = await Job.find({ clientId: client._id }).sort({
      createdAt: -1,
    });

    // Find the most recent engagement letter for this client
    let engagementLetter = null;
    if (jobs.length > 0) {
      const jobIds = jobs.map((job) => job._id);
      const companyDetailsWithLetter = await CompanyDetails.findOne({
        jobId: { $in: jobIds },
        engagementLetters: { $exists: true, $ne: null },
      }).sort({ updatedAt: -1 });

      if (companyDetailsWithLetter) {
        engagementLetter = companyDetailsWithLetter.engagementLetters;
      }
    }

    // Get documents from the most recent job that has documents
    let mostRecentDocuments = {
      documentPassport: null,
      documentID: null,
      otherDocuments: [],
    };

    if (jobs.length > 0) {
      // Find the most recent job with documents
      const jobWithDocuments = jobs.find(
        (job) =>
          job.documentPassport ||
          job.documentID ||
          (job.otherDocuments && job.otherDocuments.length > 0)
      );

      if (jobWithDocuments) {
        mostRecentDocuments = {
          documentPassport: jobWithDocuments.documentPassport,
          documentID: jobWithDocuments.documentID,
          otherDocuments: jobWithDocuments.otherDocuments || [],
        };
      }
    }

    // Return the enhanced response with engagement letter and documents
    res.status(200).json({
      client,
      jobs,
      engagementLetter,
      mostRecentDocuments, // Include documents from most recent job
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
      }).sort({ updatedAt: -1 });

      if (companyDetailsWithLetter) {
        engagementLetter = companyDetailsWithLetter.engagementLetters;
      }
    }

    if (!engagementLetter) {
      return res
        .status(404)
        .json({ message: "No engagement letter found for this client" });
    }

    res.status(200).json({ engagementLetter });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get person details by Gmail
const getPersonDetailsByGmail = async (req, res) => {
  const { gmail, personType } = req.params;

  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    return res.status(400).json({ message: "Invalid person type" });
  }

  try {
    console.log(`Looking for ${personType} details for gmail: ${gmail}`);
    const personDetails = await findPersonDetailsByGmail(gmail, personType);

    if (!personDetails) {
      return res.status(404).json({
        message: `No ${personType} details found for client with Gmail ${gmail}`,
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

  if (!["director", "shareholder", "secretary", "sef"].includes(personType)) {
    return res.status(400).json({ message: "Invalid person type" });
  }

  try {
    const {
      findAllPersonDetailsByGmail,
      synchronizePersonDetails,
    } = require("../utils/clientUtils");

    const allRecords = await findAllPersonDetailsByGmail(gmail, personType);

    if (allRecords.length <= 1) {
      return res.status(200).json({
        success: true,
        message: "No synchronization needed - only one or zero records found",
        records: allRecords,
      });
    }

    const syncResult = await synchronizePersonDetails(
      gmail,
      personType,
      sourcePersonId
    );

    if (!syncResult.success) {
      return res.status(400).json({
        success: false,
        message: "Synchronization failed",
        error: syncResult.message,
      });
    }

    const updatedRecords = await findAllPersonDetailsByGmail(gmail, personType);

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncResult.updatedRecords} records`,
      sourceRecord: syncResult.source,
      updatedRecords: syncResult.updatedRecords,
      records: updatedRecords,
    });
  } catch (error) {
    console.error("Error in synchronizeClientPersonDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during synchronization",
      error: error.message,
    });
  }
};

/**
 * Get inconsistencies in person details across all jobs for a client
 */
const checkPersonDetailsInconsistencies = async (req, res) => {
  const { gmail } = req.params;

  try {
    const { findAllPersonDetailsByGmail } = require("../utils/clientUtils");

    const results = {};
    const inconsistencies = {};

    for (const personType of ["director", "shareholder", "secretary", "sef"]) {
      const records = await findAllPersonDetailsByGmail(gmail, personType);
      results[personType] = records.length;

      if (records.length > 1) {
        const firstRecord = records[0];

        const fieldsToCheck = [
          "name",
          "nationality",
          "qidNo",
          "mobileNo",
          "email",
          "passportNo",
          "nationalAddress",
        ];

        fieldsToCheck.forEach((field) => {
          const uniqueValues = new Set(
            records
              .map((r) => r[field])
              .filter((val) => val !== null && val !== undefined && val !== "")
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

    return res.status(200).json({
      records: results,
      hasInconsistencies: Object.keys(inconsistencies).length > 0,
      inconsistencies,
    });
  } catch (error) {
    console.error("Error checking inconsistencies:", error);
    return res.status(500).json({
      message: "Server error checking inconsistencies",
      error: error.message,
    });
  }
};

/**
 * Get company details status across all jobs for a client
 */
const checkCompanyDetailsStatus = async (req, res) => {
  const { gmail } = req.params;

  try {
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const jobs = await Job.find({ clientId: client._id });

    let jobsWithCompanyDetails = 0;

    for (const job of jobs) {
      const companyDetails = await CompanyDetails.findOne({ jobId: job._id });
      if (companyDetails) {
        jobsWithCompanyDetails++;
      }
    }

    return res.status(200).json({
      totalJobs: jobs.length,
      jobsWithCompanyDetails,
      hasMultipleJobs: jobs.length > 1,
    });
  } catch (error) {
    console.error("Error checking company details status:", error);
    return res.status(500).json({
      message: "Server error checking company details",
      error: error.message,
    });
  }
};

const getAssignedClients = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(`Finding jobs assigned to user ${req.user._id}`);

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

    const clientsMap = {};

    assignedJobs.forEach((job) => {
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

      clientsMap[clientId].jobs.push({
        _id: job._id,
        serviceType: job.serviceType,
        status: job.status,
        createdAt: job.createdAt,
      });

      clientsMap[clientId].jobCount++;

      if (!["completed", "cancelled", "rejected"].includes(job.status)) {
        clientsMap[clientId].activeJobCount++;
      }

      if (
        !clientsMap[clientId].latestJobDate ||
        new Date(job.createdAt) > new Date(clientsMap[clientId].latestJobDate)
      ) {
        clientsMap[clientId].latestJobDate = job.createdAt;
        clientsMap[clientId].latestServiceType = job.serviceType;
      }
    });

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

    const totalClients = clientsArray.length;
    clientsArray = clientsArray.slice(skip, skip + limit);

    const jobIdsByClient = {};
    clientsArray.forEach((client) => {
      jobIdsByClient[client._id.toString()] = client.jobs.map((job) => job._id);
    });

    const allJobIds = [].concat(...Object.values(jobIdsByClient));

    console.log(`Looking for engagement letters for ${allJobIds.length} jobs`);

    const companyDetailsWithLetters = await CompanyDetails.find({
      jobId: { $in: allJobIds },
      engagementLetters: { $exists: true, $ne: null },
    }).select("jobId engagementLetters");

    console.log(`Found ${companyDetailsWithLetters.length} engagement letters`);

    const engagementLettersByJob = {};
    companyDetailsWithLetters.forEach((detail) => {
      engagementLettersByJob[detail.jobId.toString()] =
        detail.engagementLetters;
    });

    clientsArray = clientsArray.map((client) => {
      const jobWithLetter = client.jobs.find(
        (job) => engagementLettersByJob[job._id.toString()]
      );

      const { jobs, ...clientData } = client;

      return {
        ...clientData,
        engagementLetter: jobWithLetter
          ? engagementLettersByJob[jobWithLetter._id.toString()]
          : null,
      };
    });

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

const getAllClients = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalClients = await Client.countDocuments();
    const clients = await Client.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enhancedClients = await Promise.all(
      clients.map(async (client) => {
        const jobs = await Job.find({ clientId: client._id });

        const jobCount = jobs.length;
        const activeJobCount = jobs.filter(
          (job) => !["completed", "cancelled", "rejected"].includes(job.status)
        ).length;

        let latestJob = null;
        let latestJobDate = null;
        let latestServiceType = null;

        if (jobs.length > 0) {
          latestJob = jobs.reduce(
            (latest, job) =>
              new Date(job.createdAt) > new Date(latest.createdAt)
                ? job
                : latest,
            jobs[0]
          );

          latestJobDate = latestJob.createdAt;
          latestServiceType = latestJob.serviceType;
        }

        let engagementLetter = null;
        if (jobs.length > 0) {
          const jobIds = jobs.map((job) => job._id);
          const companyDetails = await CompanyDetails.findOne({
            jobId: { $in: jobIds },
            engagementLetters: { $exists: true, $ne: null },
          });

          if (companyDetails) {
            engagementLetter = companyDetails.engagementLetters;
          }
        }

        return {
          _id: client._id,
          name: client.name,
          gmail: client.gmail,
          startingPoint: client.startingPoint,
          jobCount,
          activeJobCount,
          latestJobDate,
          latestServiceType,
          engagementLetter,
        };
      })
    );

    res.status(200).json({
      clients: enhancedClients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalClients / limit),
        totalItems: totalClients,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error retrieving all clients:", error);
    res.status(500).json({
      message: "Error retrieving all clients",
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
  getAssignedClients,
  getAllClients,
};
