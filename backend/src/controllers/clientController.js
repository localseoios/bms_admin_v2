// controllers/clientController.js - Updated to include documents from most recent job

const Client = require("../models/Client");
const Job = require("../models/Job");
const { CompanyDetails, PersonDetails, KycDocument, UboDetails, BraDocument, OtherDocumentsDetails, CddDetails } = require("../models/OperationModels");
const { findPersonDetailsByGmail } = require("../utils/clientUtils");
const asyncHandler = require("express-async-handler");
const notificationService = require("../services/notificationService");

// Modified getClientByGmail to include documents from most recent job
const getClientByGmail = async (req, res) => {
  const { gmail } = req.params;
  try {
    let client;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(gmail);

    if (isObjectId) {
      client = await Client.findById(gmail);
    } else {
      client = await Client.findOne({ gmail });
    }

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get all jobs for this client, sorted by most recent first
    const jobs = await Job.find({ clientId: client._id })
      .populate("assignedPerson", "name email")
      .populate("selectedServiceUsers", "name email")
      .sort({ createdAt: -1 });

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

    // Fetch all person details documents for all jobs
    let personDetailsDocuments = [];
    if (jobs.length > 0) {
      const jobIds = jobs.map((job) => job._id);
      const allPersonDetails = await PersonDetails.find({
        jobId: { $in: jobIds },
      });

      allPersonDetails.forEach((person) => {
        const job = jobs.find((j) => j._id.toString() === person.jobId.toString());

        if (person.passportDoc) {
          personDetailsDocuments.push({
            fileName: `Passport - ${person.name}`,
            fileUrl: person.passportDoc,
            uploadedAt: person.updatedAt,
            personName: person.name,
            personType: person.personType,
            personId: person._id,
            jobNumber: job?.jobNumber,
            jobId: person.jobId,
            documentType: 'passport'
          });
        }

        if (person.qidDoc) {
          personDetailsDocuments.push({
            fileName: `QID - ${person.name}`,
            fileUrl: person.qidDoc,
            uploadedAt: person.updatedAt,
            personName: person.name,
            personType: person.personType,
            personId: person._id,
            jobNumber: job?.jobNumber,
            jobId: person.jobId,
            documentType: 'qid'
          });
        }

        if (person.nationalAddressDoc) {
          personDetailsDocuments.push({
            fileName: `National Address - ${person.name}`,
            fileUrl: person.nationalAddressDoc,
            uploadedAt: person.updatedAt,
            personName: person.name,
            personType: person.personType,
            personId: person._id,
            jobNumber: job?.jobNumber,
            jobId: person.jobId,
            documentType: 'nationalAddress'
          });
        }

        if (person.cv) {
          personDetailsDocuments.push({
            fileName: `CV - ${person.name}`,
            fileUrl: person.cv,
            uploadedAt: person.updatedAt,
            personName: person.name,
            personType: person.personType,
            personId: person._id,
            jobNumber: job?.jobNumber,
            jobId: person.jobId,
            documentType: 'cv'
          });
        }

        if (person.otherDocuments && person.otherDocuments.length > 0) {
          person.otherDocuments.forEach((doc, index) => {
            personDetailsDocuments.push({
              fileName: doc.fileName || `Other Document ${index + 1} - ${person.name}`,
              fileUrl: doc.fileUrl,
              uploadedAt: doc.uploadedAt || person.updatedAt,
              personName: person.name,
              personType: person.personType,
              personId: person._id,
              jobNumber: job?.jobNumber,
              jobId: person.jobId,
              documentType: 'other'
            });
          });
        }
      });
    }

    // Transform client to include phone (mapped from contactNumber) for frontend compatibility
    const clientData = client.toObject();
    clientData.phone = clientData.contactNumber || '';

    // Return the enhanced response with engagement letter and documents
    res.status(200).json({
      client: clientData,
      jobs,
      engagementLetter,
      mostRecentDocuments,
      personDetailsDocuments, // Include person details documents
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
      .populate("clientId", "name gmail startingPoint riskLevel");

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
          riskLevel: job.clientId.riskLevel,
          jobs: [],
          jobCount: 0,
          activeJobCount: 0,
          nonCancelledJobCount: 0,
          latestJobDate: null,
          lastReviewDate: null,
          latestServiceType: null,
        };
      }

      clientsMap[clientId].jobs.push({
        _id: job._id,
        serviceType: job.serviceType,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });

      clientsMap[clientId].jobCount++;

      if (!["completed", "cancelled", "rejected"].includes(job.status)) {
        clientsMap[clientId].activeJobCount++;
      }

      if (!["cancelled", "rejected"].includes(job.status)) {
        clientsMap[clientId].nonCancelledJobCount++;
      }

      if (
        !clientsMap[clientId].latestJobDate ||
        new Date(job.createdAt) > new Date(clientsMap[clientId].latestJobDate)
      ) {
        clientsMap[clientId].latestJobDate = job.createdAt;
        clientsMap[clientId].latestServiceType = job.serviceType;
      }

      if (
        !clientsMap[clientId].lastReviewDate ||
        new Date(job.updatedAt) > new Date(clientsMap[clientId].lastReviewDate)
      ) {
        clientsMap[clientId].lastReviewDate = job.updatedAt;
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
    const search = req.query.search || '';
    const status = req.query.status || '';

    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { gmail: { $regex: search, $options: 'i' } },
          { startingPoint: { $regex: search, $options: 'i' } },
          { clientCode: { $regex: search, $options: 'i' } }
        ]
      };
    }

    if (status === 'edd') {
      searchQuery.cddType = 'EDD';
    }

    const [allMatchingClients, allJobs, allClients] = await Promise.all([
      Client.find(searchQuery).sort({ createdAt: -1 }).lean(),
      Job.find({}).lean(),
      Client.find({}).lean()
    ]);

    const jobsByClient = {};
    let totalActiveJobs = 0;
    allJobs.forEach(job => {
      const clientId = job.clientId?.toString();
      if (clientId) {
        if (!jobsByClient[clientId]) jobsByClient[clientId] = [];
        jobsByClient[clientId].push(job);
      }
      if (!["completed", "cancelled", "rejected"].includes(job.status)) {
        totalActiveJobs++;
      }
    });

    let totalActive = 0, totalPending = 0, totalInactive = 0, totalEDD = 0;
    allClients.forEach(client => {
      const clientJobs = jobsByClient[client._id.toString()] || [];
      const nonCancelledCount = clientJobs.filter(j => !["cancelled", "rejected"].includes(j.status)).length;

      if (nonCancelledCount > 0) totalActive++;
      else if (clientJobs.length > 0) totalInactive++;
      else totalPending++;

      if (client.cddType === 'EDD') totalEDD++;
    });

    const allEnhancedClients = allMatchingClients.map(client => {
      const jobs = jobsByClient[client._id.toString()] || [];
      const jobCount = jobs.length;
      const activeJobCount = jobs.filter(j => !["completed", "cancelled", "rejected"].includes(j.status)).length;
      const nonCancelledJobCount = jobs.filter(j => !["cancelled", "rejected"].includes(j.status)).length;

      let clientStatus = 'pending';
      if (nonCancelledJobCount > 0) clientStatus = 'active';
      else if (jobCount > 0) clientStatus = 'inactive';

      let latestJobDate = null, lastReviewDate = null, latestServiceType = null;
      if (jobs.length > 0) {
        const sorted = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        latestJobDate = sorted[0].createdAt;
        latestServiceType = sorted[0].serviceType;
        const byUpdate = [...jobs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        lastReviewDate = byUpdate[0].updatedAt;
      }

      return {
        _id: client._id,
        name: client.name,
        gmail: client.gmail,
        startingPoint: client.startingPoint,
        riskLevel: client.riskLevel,
        clientCode: client.clientCode || '',
        crNo: client.crNo || '',
        cddType: client.cddType || '',
        phone: client.contactNumber || '',
        address: client.address || '',
        lastReviewDate: client.lastReviewDate || lastReviewDate,
        jobCount,
        activeJobCount,
        nonCancelledJobCount,
        clientStatus,
        latestJobDate,
        latestServiceType,
      };
    });

    let filteredClients = allEnhancedClients;
    if (status && status !== 'edd') {
      filteredClients = allEnhancedClients.filter(c => c.clientStatus === status);
    }

    const totalFilteredClients = filteredClients.length;
    const skip = (page - 1) * limit;
    const paginatedClients = filteredClients.slice(skip, skip + limit);

    res.status(200).json({
      clients: paginatedClients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFilteredClients / limit),
        totalItems: totalFilteredClients,
        itemsPerPage: limit,
      },
      stats: {
        totalClients: allMatchingClients.length,
        totalActiveJobs,
        totalActive,
        totalPending,
        totalInactive,
        totalEDD,
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

const updateClientRiskLevel = asyncHandler(async (req, res) => {
  try {
    const { gmail } = req.params;
    const { riskLevel } = req.body;

    if (!['Pending', 'Low', 'Medium', 'High'].includes(riskLevel)) {
      return res.status(400).json({ message: 'Invalid risk level. Must be Pending, Low, Medium, or High' });
    }

    const client = await Client.findOneAndUpdate(
      { gmail },
      { riskLevel },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({
      message: 'Risk level updated successfully',
      client: {
        _id: client._id,
        name: client.name,
        gmail: client.gmail,
        riskLevel: client.riskLevel
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const updateClientCddType = asyncHandler(async (req, res) => {
  try {
    const { gmail } = req.params;
    const { cddType } = req.body;

    if (!['', 'SDD', 'RDD', 'EDD'].includes(cddType)) {
      return res.status(400).json({ message: 'Invalid CDD type. Must be SDD, RDD, or EDD' });
    }

    const client = await Client.findOneAndUpdate(
      { gmail },
      { cddType },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({
      message: 'CDD type updated successfully',
      client: {
        _id: client._id,
        name: client.name,
        gmail: client.gmail,
        cddType: client.cddType
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const updateClientCrNo = asyncHandler(async (req, res) => {
  try {
    const { gmail } = req.params;
    const { crNo } = req.body;

    const client = await Client.findOneAndUpdate(
      { gmail },
      { crNo: crNo || '' },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({
      message: 'CR Number updated successfully',
      client: {
        _id: client._id,
        name: client.name,
        gmail: client.gmail,
        crNo: client.crNo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const deleteClient = asyncHandler(async (req, res) => {
  try {
    const { gmail } = req.params;
    console.log("=== DELETE CLIENT START ===");
    console.log("Client email to delete:", gmail);

    const client = await Client.findOne({ gmail });
    if (!client) {
      console.log("Client not found");
      return res.status(404).json({ message: 'Client not found' });
    }
    console.log("Client found:", client.name);

    const deletionTime = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const jobs = await Job.find({ clientId: client._id });
    const jobIds = jobs.map(job => job._id);
    console.log("Jobs to delete:", jobIds.length);

    console.log("Creating notification for all users...");
    const notification = await notificationService.createNotification(
      {
        title: "Client Deleted",
        description: `Client "${client.name}" (${gmail}) has been permanently deleted by ${req.user.name} on ${deletionTime}. ${jobs.length} job(s) and all related data were also removed.`,
        type: "client",
        subType: "deletion",
        relatedTo: { model: "Client", id: null },
      },
      {}
    );
    console.log("Notification created:", notification?._id, "Recipients:", notification?.recipients?.length);

    if (!notification || notification.recipients.length === 0) {
      console.log("WARNING: No notification recipients found");
      return res.status(500).json({
        message: "Failed to send notification - no recipients found",
      });
    }

    let deletedJobsData = {
      jobCount: jobs.length,
      companyDetails: 0,
      personDetails: 0,
      kycDocuments: 0,
      braDocuments: 0,
      otherDocuments: 0,
      uboDetails: 0,
      cddDetails: 0,
    };

    if (jobIds.length > 0) {
      console.log("Deleting related data for jobs...");
      const deleteResults = await Promise.all([
        CompanyDetails.deleteMany({ jobId: { $in: jobIds } }),
        PersonDetails.deleteMany({ jobId: { $in: jobIds } }),
        KycDocument.deleteMany({ jobId: { $in: jobIds } }),
        BraDocument.deleteMany({ jobId: { $in: jobIds } }),
        OtherDocumentsDetails.deleteMany({ jobId: { $in: jobIds } }),
        UboDetails.deleteMany({ jobId: { $in: jobIds } }),
        CddDetails.deleteMany({ jobId: { $in: jobIds } }),
        Job.deleteMany({ clientId: client._id }),
      ]);

      deletedJobsData = {
        jobCount: deleteResults[7].deletedCount,
        companyDetails: deleteResults[0].deletedCount,
        personDetails: deleteResults[1].deletedCount,
        kycDocuments: deleteResults[2].deletedCount,
        braDocuments: deleteResults[3].deletedCount,
        otherDocuments: deleteResults[4].deletedCount,
        uboDetails: deleteResults[5].deletedCount,
        cddDetails: deleteResults[6].deletedCount,
      };
    }

    const deletedClientCode = parseInt(client.clientCode, 10);

    console.log("Deleting client...");
    await Client.deleteOne({ gmail });

    if (!isNaN(deletedClientCode)) {
      const clientsToUpdate = await Client.find({
        clientCode: { $ne: '', $exists: true }
      }).select('clientCode');

      const bulkOps = [];
      clientsToUpdate.forEach(c => {
        const code = parseInt(c.clientCode, 10);
        if (!isNaN(code) && code > deletedClientCode) {
          bulkOps.push({
            updateOne: {
              filter: { _id: c._id },
              update: { $set: { clientCode: String(code - 1) } }
            }
          });
        }
      });

      if (bulkOps.length > 0) {
        await Client.bulkWrite(bulkOps);
      }
    }

    console.log(`Client ${client.name} (${gmail}) deleted with ${deletedJobsData.jobCount} jobs and related data`);
    console.log("=== DELETE CLIENT SUCCESS ===");

    res.status(200).json({
      message: 'Client and all associated jobs deleted successfully',
      deletedClient: {
        gmail: client.gmail,
        name: client.name
      },
      deletedJobsData
    });
  } catch (error) {
    console.error("=== DELETE CLIENT ERROR ===");
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Failed to delete client', error: error.message });
  }
});

const getClientsByRole = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    console.log(`User ID: ${userId} - Fetching clients where user was selected`);

    // Find jobs where user was selected as selectedServiceUser OR in selectedServiceUsers array
    const jobQuery = {
      $or: [
        { selectedServiceUser: userId },
        { selectedServiceUsers: userId }
      ]
    };

    // Get unique client IDs from matching jobs
    const matchingJobs = await Job.find(jobQuery).select('clientId');
    const clientIds = [...new Set(matchingJobs.map(j => j.clientId.toString()))];

    if (clientIds.length === 0) {
      return res.status(200).json({
        clients: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      });
    }

    // Build search query for clients
    let clientQuery = { _id: { $in: clientIds } };
    if (search) {
      clientQuery.$and = [
        { _id: { $in: clientIds } },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { gmail: { $regex: search, $options: 'i' } },
            { startingPoint: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete clientQuery._id;
    }

    const totalClients = await Client.countDocuments(clientQuery);
    const clients = await Client.find(clientQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Enhance clients with job info (ONLY jobs where user was selected)
    const enhancedClients = await Promise.all(
      clients.map(async (client) => {
        // Only show jobs where user was selected
        const clientJobQuery = {
          clientId: client._id,
          $or: [
            { selectedServiceUser: userId },
            { selectedServiceUsers: userId }
          ]
        };

        const jobs = await Job.find(clientJobQuery).sort({ createdAt: -1 });

        const jobCount = jobs.length;
        const activeJobCount = jobs.filter(
          (job) => !["completed", "cancelled", "rejected"].includes(job.status)
        ).length;
        const nonCancelledJobCount = jobs.filter(
          (job) => !["cancelled", "rejected"].includes(job.status)
        ).length;

        let latestJob = null;
        let latestJobDate = null;
        let latestServiceType = null;

        if (jobs.length > 0) {
          latestJob = jobs[0];
          latestJobDate = latestJob.createdAt;
          latestServiceType = latestJob.serviceType;
        }

        return {
          ...client.toObject(),
          jobCount,
          activeJobCount,
          nonCancelledJobCount,
          latestJobDate,
          latestServiceType,
          latestJobId: latestJob?._id,
          latestJobNumber: latestJob?.jobNumber,
          latestJobStatus: latestJob?.status,
          // Include filtered jobs list
          jobs: jobs.map(job => ({
            _id: job._id,
            jobNumber: job.jobNumber,
            serviceType: job.serviceType,
            status: job.status,
            selectedServiceUser: job.selectedServiceUser,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          })),
        };
      })
    );

    res.status(200).json({
      clients: enhancedClients,
      pagination: {
        page,
        limit,
        total: totalClients,
        totalPages: Math.ceil(totalClients / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients by role:", error);
    res.status(500).json({
      message: "Error retrieving clients",
      error: error.message,
    });
  }
});

const exportComplianceClients = asyncHandler(async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || '';

    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { gmail: { $regex: search, $options: 'i' } },
          { startingPoint: { $regex: search, $options: 'i' } },
          { clientCode: { $regex: search, $options: 'i' } }
        ]
      };
    }

    if (status === 'edd') {
      searchQuery.cddType = 'EDD';
    }

    const allClients = await Client.find(searchQuery).sort({ createdAt: -1 }).lean();
    const clientIds = allClients.map(c => c._id);

    const [allJobs, allCompanyDetails, allPersonDetails, allKycDocs, allUboDetails] = await Promise.all([
      Job.find({ clientId: { $in: clientIds } }).lean(),
      CompanyDetails.find({}).lean(),
      PersonDetails.find({}).lean(),
      KycDocument.find({}).lean(),
      UboDetails.find({}).lean()
    ]);

    const jobsByClient = {};
    const jobIdToClient = {};
    allJobs.forEach(job => {
      const clientId = job.clientId.toString();
      if (!jobsByClient[clientId]) jobsByClient[clientId] = [];
      jobsByClient[clientId].push(job);
      jobIdToClient[job._id.toString()] = clientId;
    });

    const companyDetailsByJob = {};
    allCompanyDetails.forEach(cd => {
      if (cd.jobId) companyDetailsByJob[cd.jobId.toString()] = cd;
    });

    const personDetailsByJob = {};
    allPersonDetails.forEach(pd => {
      if (pd.jobId) {
        const jobId = pd.jobId.toString();
        if (!personDetailsByJob[jobId]) personDetailsByJob[jobId] = [];
        personDetailsByJob[jobId].push(pd);
      }
    });

    const kycByJob = {};
    allKycDocs.forEach(kyc => {
      if (kyc.jobId) kycByJob[kyc.jobId.toString()] = kyc;
    });

    const uboByJob = {};
    allUboDetails.forEach(ubo => {
      if (ubo.jobId) uboByJob[ubo.jobId.toString()] = ubo;
    });

    const formatDate = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-GB');
    };

    const getPersonNames = (persons) => {
      const names = persons.map(p => p.name || '').filter(Boolean);
      const uniqueNames = [...new Set(names)];
      return uniqueNames.slice(0, 3).join(', ') || '';
    };

    const getPersonPassportQid = (persons) => {
      const passportQids = persons.map(p => {
        const passport = p.passportNo || '';
        const qid = p.qidNo || '';
        if (passport && qid) return `${passport} / ${qid}`;
        return passport || qid || '';
      }).filter(Boolean);
      const uniquePassportQids = [...new Set(passportQids)];
      return uniquePassportQids.slice(0, 3).join(', ') || '';
    };

    const getUboNames = (uboDetails) => {
      if (!uboDetails || !uboDetails.ubos || !Array.isArray(uboDetails.ubos)) return '';
      const names = uboDetails.ubos.map(u => u.name || '').filter(Boolean);
      const uniqueNames = [...new Set(names)];
      return uniqueNames.slice(0, 3).join(', ') || '';
    };

    const getUboPassportQid = (uboDetails) => {
      if (!uboDetails || !uboDetails.ubos || !Array.isArray(uboDetails.ubos)) return '';
      const passportQids = uboDetails.ubos.map(u => {
        const passport = u.passportNo || '';
        const qid = u.qidNo || '';
        if (passport && qid) return `${passport} / ${qid}`;
        return passport || qid || '';
      }).filter(Boolean);
      const uniquePassportQids = [...new Set(passportQids)];
      return uniquePassportQids.slice(0, 3).join(', ') || '';
    };

    const getUboNationalities = (uboDetails) => {
      if (!uboDetails || !uboDetails.ubos || !Array.isArray(uboDetails.ubos)) return '';
      const nationalities = uboDetails.ubos.map(u => u.nationality || '').filter(Boolean);
      const uniqueNationalities = [...new Set(nationalities)];
      return uniqueNationalities.slice(0, 3).join(', ') || '';
    };

    const exportData = [];
    let rowNumber = 1;

    for (const client of allClients) {
      const clientId = client._id.toString();
      const jobs = jobsByClient[clientId] || [];

      const jobCount = jobs.length;
      const activeJobCount = jobs.filter(
        (job) => !["completed", "cancelled", "rejected"].includes(job.status)
      ).length;
      const nonCancelledJobCount = jobs.filter(
        (job) => !["cancelled", "rejected"].includes(job.status)
      ).length;

      if (status === 'active' && nonCancelledJobCount === 0) continue;
      if (status === 'inactive' && (nonCancelledJobCount > 0 || jobCount === 0)) continue;
      if (status === 'pending' && jobCount > 0) continue;

      let companyDetails = null;
      let directors = [];
      let shareholders = [];
      let secretaries = [];
      let sefs = [];
      let kycDetails = null;
      let uboDetails = null;
      let serviceTypes = [];
      let jobAddress = '';

      if (jobs.length > 0) {
        const jobIds = jobs.map(job => job._id.toString());
        serviceTypes = [...new Set(jobs.map(job => job.serviceType).filter(Boolean))];

        const jobWithAddress = jobs.find(job => job.address);
        if (jobWithAddress) {
          jobAddress = jobWithAddress.address;
        }

        for (const jobId of jobIds) {
          if (!companyDetails && companyDetailsByJob[jobId]) {
            companyDetails = companyDetailsByJob[jobId];
          }
          if (!kycDetails && kycByJob[jobId]) {
            kycDetails = kycByJob[jobId];
          }
          if (!uboDetails && uboByJob[jobId]) {
            uboDetails = uboByJob[jobId];
          }
          const persons = personDetailsByJob[jobId] || [];
          persons.forEach(p => {
            if (p.personType === 'director') directors.push(p);
            else if (p.personType === 'shareholder') shareholders.push(p);
            else if (p.personType === 'secretary') secretaries.push(p);
            else if (p.personType === 'sef') sefs.push(p);
          });
        }
      }

      exportData.push({
        'No': rowNumber++,
        'Client Code': client.clientCode || '',
        'Client Name': client.name || '',
        'Registration No': companyDetails?.qfcNo || '',
        'Incorporation Date': companyDetails ? formatDate(companyDetails.incorporationDate) : '',
        'Registered Authority': client.crNo || '',
        'Registered Address': client.address || jobAddress || companyDetails?.registeredAddress || '',
        'Offered Services (Service Type)': serviceTypes.join(', ') || '',
        'Director': getPersonNames(directors),
        'Director Passport/QID': getPersonPassportQid(directors),
        'Shareholder': getPersonNames(shareholders),
        'Shareholder Passport/QID': getPersonPassportQid(shareholders),
        'SEF': getPersonNames(sefs),
        'SEF Passport/QID': getPersonPassportQid(sefs),
        'Secretary': getPersonNames(secretaries),
        'Secretary Passport/QID': getPersonPassportQid(secretaries),
        'UBO Name': getUboNames(uboDetails),
        'UBO Passport/QID': getUboPassportQid(uboDetails),
        'UBO Nationality (Country)': getUboNationalities(uboDetails),
        'Active Status': kycDetails?.activeStatus === 'yes' ? 'Active' : kycDetails?.activeStatus === 'no' ? 'Inactive' : '',
        'CDD Type': client.cddType || '',
        'Risk Level': client.riskLevel || 'Pending',
        'Key Contact Person': client.name || '',
        'Key Contact Email': client.gmail || '',
        'Key Contact Phone': client.contactNumber || ''
      });
    }

    res.status(200).json({
      success: true,
      data: exportData,
      totalRecords: exportData.length
    });

  } catch (error) {
    console.error('Error exporting compliance clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export compliance clients',
      error: error.message
    });
  }
});

const searchClientsWithDetails = asyncHandler(async (req, res) => {
  try {
    const { query, status } = req.query;

    if (!query || query.trim().length < 2) {
      return getAllClients(req, res);
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const matchCounts = { client: 0, director: 0, shareholder: 0, secretary: 0, sef: 0, company: 0 };
    const clientMatchDetails = {};

    const [allJobs, allPersonDetails, allCompanyDetails, allClients] = await Promise.all([
      Job.find({}).lean(),
      PersonDetails.find({}).lean(),
      CompanyDetails.find({}).lean(),
      Client.find({}).lean()
    ]);

    const jobsByClient = {};
    const jobIdToClientId = {};
    allJobs.forEach(job => {
      const clientId = job.clientId?.toString();
      if (clientId) {
        if (!jobsByClient[clientId]) jobsByClient[clientId] = [];
        jobsByClient[clientId].push(job);
        jobIdToClientId[job._id.toString()] = clientId;
      }
    });

    const addMatch = (clientId, category, field, value) => {
      if (!clientMatchDetails[clientId]) clientMatchDetails[clientId] = [];
      const truncated = value.length > 25 ? value.substring(0, 25) + '...' : value;
      clientMatchDetails[clientId].push({ category, field, value: truncated });
    };

    allClients.forEach(client => {
      const clientId = client._id.toString();
      const fields = ['name', 'gmail', 'startingPoint', 'clientCode', 'crNo', 'phone', 'contactNumber', 'address'];
      fields.forEach(field => {
        if (client[field] && typeof client[field] === 'string' && searchRegex.test(client[field])) {
          matchCounts.client++;
          addMatch(clientId, 'client', field, client[field]);
        }
      });
    });

    allPersonDetails.forEach(person => {
      const jobId = person.jobId?.toString();
      const clientId = jobIdToClientId[jobId];
      if (!clientId) return;

      const fields = ['name', 'nationality', 'qidNo', 'nationalAddress', 'passportNo', 'mobileNo', 'email'];
      const personType = person.personType || 'director';

      fields.forEach(field => {
        if (person[field] && typeof person[field] === 'string' && searchRegex.test(person[field])) {
          if (['director', 'shareholder', 'secretary', 'sef'].includes(personType)) {
            matchCounts[personType]++;
          }
          addMatch(clientId, personType, field, person[field]);
        }
      });
    });

    allCompanyDetails.forEach(company => {
      const jobId = company.jobId?.toString();
      const clientId = jobIdToClientId[jobId];
      if (!clientId) return;

      const fields = ['companyName', 'qfcNo', 'registeredAddress', 'serviceType', 'mainPurpose'];
      fields.forEach(field => {
        if (company[field] && typeof company[field] === 'string' && searchRegex.test(company[field])) {
          matchCounts.company++;
          addMatch(clientId, 'company', field, company[field]);
        }
      });
    });

    const matchedClientIds = Object.keys(clientMatchDetails);

    if (matchedClientIds.length === 0) {
      return res.status(200).json({
        clients: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
        stats: { totalClients: 0, totalActive: 0, totalPending: 0, totalInactive: 0, totalEDD: 0 },
        searchInfo: { matchCounts, totalMatches: 0 }
      });
    }

    let clients = allClients.filter(c => matchedClientIds.includes(c._id.toString()));
    clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const enhancedClients = clients.map(client => {
      const clientId = client._id.toString();
      const jobs = jobsByClient[clientId] || [];
      const jobCount = jobs.length;
      const activeJobCount = jobs.filter(j => !["completed", "cancelled", "rejected"].includes(j.status)).length;
      const nonCancelledJobCount = jobs.filter(j => !["cancelled", "rejected"].includes(j.status)).length;

      let clientStatus = 'pending';
      if (nonCancelledJobCount > 0) clientStatus = 'active';
      else if (jobCount > 0) clientStatus = 'inactive';

      let latestJobDate = null, lastReviewDate = null, latestServiceType = null;
      if (jobs.length > 0) {
        const sorted = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        latestJobDate = sorted[0].createdAt;
        latestServiceType = sorted[0].serviceType;
        const byUpdate = [...jobs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        lastReviewDate = byUpdate[0].updatedAt;
      }

      const uniqueMatches = [];
      const seen = new Set();
      (clientMatchDetails[clientId] || []).forEach(m => {
        const key = `${m.category}-${m.field}-${m.value}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMatches.push(m);
        }
      });

      return {
        _id: client._id,
        name: client.name,
        gmail: client.gmail,
        startingPoint: client.startingPoint,
        riskLevel: client.riskLevel,
        clientCode: client.clientCode || '',
        crNo: client.crNo || '',
        cddType: client.cddType || '',
        phone: client.contactNumber || '',
        address: client.address || '',
        lastReviewDate: client.lastReviewDate || lastReviewDate,
        jobCount,
        activeJobCount,
        nonCancelledJobCount,
        clientStatus,
        latestJobDate,
        latestServiceType,
        searchMatches: uniqueMatches.slice(0, 5)
      };
    });

    let filteredClients = enhancedClients;
    if (status === 'active') filteredClients = enhancedClients.filter(c => c.clientStatus === 'active');
    else if (status === 'inactive') filteredClients = enhancedClients.filter(c => c.clientStatus === 'inactive');
    else if (status === 'pending') filteredClients = enhancedClients.filter(c => c.clientStatus === 'pending');
    else if (status === 'edd') filteredClients = enhancedClients.filter(c => c.cddType === 'EDD');

    let totalActive = 0, totalPending = 0, totalInactive = 0, totalEDD = 0;
    allClients.forEach(client => {
      const clientJobs = jobsByClient[client._id.toString()] || [];
      const nonCancelledCount = clientJobs.filter(j => !["cancelled", "rejected"].includes(j.status)).length;
      if (nonCancelledCount > 0) totalActive++;
      else if (clientJobs.length > 0) totalInactive++;
      else totalPending++;
      if (client.cddType === 'EDD') totalEDD++;
    });

    const totalMatches = Object.values(matchCounts).reduce((a, b) => a + b, 0);

    res.status(200).json({
      clients: filteredClients,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: filteredClients.length,
        itemsPerPage: filteredClients.length
      },
      stats: {
        totalClients: allClients.length,
        totalActive,
        totalPending,
        totalInactive,
        totalEDD
      },
      searchInfo: {
        matchCounts,
        totalMatches
      }
    });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({
      message: 'Error searching clients',
      error: error.message
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
  updateClientRiskLevel,
  updateClientCddType,
  updateClientCrNo,
  deleteClient,
  getClientsByRole,
  exportComplianceClients,
  searchClientsWithDetails,
};
