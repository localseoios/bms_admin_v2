const Archive = require("../models/archiveModel");
const Client = require("../models/Client");
const asyncHandler = require("express-async-handler");

const getArchivesByClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const {
    documentType,
    sourceType,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const query = { clientId };

  if (documentType) {
    query.documentType = documentType;
  }

  if (sourceType) {
    query.sourceType = sourceType;
  }

  if (startDate || endDate) {
    query.archivedAt = {};
    if (startDate) {
      query.archivedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.archivedAt.$lte = new Date(endDate);
    }
  }

  if (search) {
    query.$or = [
      { fileName: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
      { personName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [archives, total] = await Promise.all([
    Archive.find(query)
      .populate("archivedBy", "name email")
      .populate("jobId", "jobNumber serviceType")
      .sort({ archivedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Archive.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: archives,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

const getAllArchives = asyncHandler(async (req, res) => {
  const {
    documentType,
    sourceType,
    clientId,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const query = {};

  if (clientId) {
    query.clientId = clientId;
  }

  if (documentType) {
    query.documentType = documentType;
  }

  if (sourceType) {
    query.sourceType = sourceType;
  }

  if (startDate || endDate) {
    query.archivedAt = {};
    if (startDate) {
      query.archivedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.archivedAt.$lte = new Date(endDate);
    }
  }

  if (search) {
    query.$or = [
      { fileName: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
      { personName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [archives, total] = await Promise.all([
    Archive.find(query)
      .populate("archivedBy", "name email")
      .populate("clientId", "clientName email")
      .populate("jobId", "jobNumber serviceType")
      .sort({ archivedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Archive.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: archives,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

const getArchiveById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const archive = await Archive.findById(id)
    .populate("archivedBy", "name email")
    .populate("clientId", "clientName email")
    .populate("jobId", "jobNumber serviceType");

  if (!archive) {
    res.status(404);
    throw new Error("Archive not found");
  }

  res.status(200).json({
    success: true,
    data: archive,
  });
});

const getArchiveStats = asyncHandler(async (req, res) => {
  const { clientId } = req.query;

  const matchStage = clientId ? { clientId: require("mongoose").Types.ObjectId(clientId) } : {};

  const [byDocumentType, bySourceType, totalCount, recentArchives] = await Promise.all([
    Archive.aggregate([
      { $match: matchStage },
      { $group: { _id: "$documentType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Archive.aggregate([
      { $match: matchStage },
      { $group: { _id: "$sourceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Archive.countDocuments(matchStage),
    Archive.find(matchStage)
      .populate("clientId", "clientName")
      .sort({ archivedAt: -1 })
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    data: {
      byDocumentType,
      bySourceType,
      totalCount,
      recentArchives,
    },
  });
});

const archiveDocument = asyncHandler(async (req, res) => {
  const {
    clientId,
    jobId,
    documentType,
    sourceType,
    personName,
    personId,
    fileUrl,
    fileName,
    title,
    description,
    reason,
    originalUploadedAt,
    metadata,
  } = req.body;

  if (!clientId || !documentType || !sourceType || !fileUrl) {
    res.status(400);
    throw new Error("Missing required fields: clientId, documentType, sourceType, fileUrl");
  }

  const archive = await Archive.create({
    clientId,
    jobId,
    documentType,
    sourceType,
    personName,
    personId,
    fileUrl,
    fileName,
    title,
    description,
    archivedBy: req.user._id,
    reason: reason || "replaced",
    originalUploadedAt,
    metadata,
  });

  res.status(201).json({
    success: true,
    data: archive,
  });
});

const deleteArchive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isAdmin = req.user.role?.name === "admin";
  if (!isAdmin) {
    res.status(403);
    throw new Error("Only administrators can delete archived documents");
  }

  const archive = await Archive.findById(id);

  if (!archive) {
    res.status(404);
    throw new Error("Archive not found");
  }

  await Archive.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Archive deleted successfully",
  });
});

module.exports = {
  getArchivesByClient,
  getAllArchives,
  getArchiveById,
  getArchiveStats,
  archiveDocument,
  deleteArchive,
};
