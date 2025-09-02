const asyncHandler = require("express-async-handler");
const Screening = require("../models/screeningModel");
const Client = require("../models/Client");
const Job = require("../models/Job");

// Get all screening records for a client
const getClientScreeningRecords = asyncHandler(async (req, res) => {
  const { gmail } = req.params;
  const { page = 1, limit = 10, type, result } = req.query;

  try {
    // Find client
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Build query
    let query = { clientId: client._id };
    if (type) query.screeningType = type;
    if (result) query.result = result;

    // Get screening records with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const screenings = await Screening.find(query)
      .populate("screenedBy", "name email")
      .populate("reviewedBy", "name email")
      .populate("jobId", "jobNumber serviceType")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Screening.countDocuments(query);

    // Get summary statistics
    const summary = await Screening.aggregate([
      { $match: { clientId: client._id } },
      {
        $group: {
          _id: "$result",
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryStats = {
      total: total,
      clear: summary.find(s => s._id === "clear")?.count || 0,
      review: summary.find(s => s._id === "review")?.count || 0,
      alert: summary.find(s => s._id === "alert")?.count || 0,
      pending: summary.find(s => s._id === "pending")?.count || 0,
    };

    res.status(200).json({
      screenings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
      summary: summaryStats,
    });
  } catch (error) {
    console.error("Error fetching screening records:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new screening record
const createScreeningRecord = asyncHandler(async (req, res) => {
  const {
    clientGmail,
    jobId,
    screeningType,
    result,
    details,
    dataSources,
    riskScore,
    findings,
    reviewNotes,
  } = req.body;

  try {
    // Find client
    const client = await Client.findOne({ gmail: clientGmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Verify job exists and belongs to client
    const job = await Job.findOne({ _id: jobId, clientId: client._id });
    if (!job) {
      return res.status(404).json({ message: "Job not found or doesn't belong to client" });
    }

    const screening = await Screening.create({
      clientId: client._id,
      jobId,
      screeningType,
      result,
      details,
      screenedBy: req.user._id,
      dataSources: dataSources || [],
      riskScore: riskScore || 0,
      findings: findings || [],
      reviewNotes,
    });

    const populatedScreening = await Screening.findById(screening._id)
      .populate("screenedBy", "name email")
      .populate("jobId", "jobNumber serviceType");

    res.status(201).json({
      message: "Screening record created successfully",
      screening: populatedScreening,
    });
  } catch (error) {
    console.error("Error creating screening record:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update screening record
const updateScreeningRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const screening = await Screening.findById(id);
    if (!screening) {
      return res.status(404).json({ message: "Screening record not found" });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        screening[key] = updates[key];
      }
    });

    // Set review information if result is being updated
    if (updates.result && updates.result !== screening.result) {
      screening.reviewedBy = req.user._id;
      screening.reviewedAt = new Date();
    }

    await screening.save();

    const populatedScreening = await Screening.findById(screening._id)
      .populate("screenedBy", "name email")
      .populate("reviewedBy", "name email")
      .populate("jobId", "jobNumber serviceType");

    res.status(200).json({
      message: "Screening record updated successfully",
      screening: populatedScreening,
    });
  } catch (error) {
    console.error("Error updating screening record:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get screening statistics
const getScreeningStatistics = asyncHandler(async (req, res) => {
  try {
    const stats = await Screening.aggregate([
      {
        $group: {
          _id: {
            type: "$screeningType",
            result: "$result",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.type",
          results: {
            $push: {
              result: "$_id.result",
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
    ]);

    const overallStats = await Screening.aggregate([
      {
        $group: {
          _id: "$result",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      byType: stats,
      overall: overallStats,
    });
  } catch (error) {
    console.error("Error fetching screening statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = {
  getClientScreeningRecords,
  createScreeningRecord,
  updateScreeningRecord,
  getScreeningStatistics,
};