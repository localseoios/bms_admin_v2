const asyncHandler = require("express-async-handler");
const Service = require("../models/serviceModel");

// @desc    Get all services
// @route   GET /api/services
// @access  Private/Admin
const getServices = asyncHandler(async (req, res) => {
  const services = await Service.find({}).sort({ createdAt: -1 });
  res.status(200).json(services);
});

// @desc    Get a service by ID
// @route   GET /api/services/:id
// @access  Private/Admin
const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (service) {
    res.status(200).json(service);
  } else {
    res.status(404);
    throw new Error("Service not found");
  }
});

// @desc    Create a new service
// @route   POST /api/services
// @access  Private/Admin
const createService = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;

  // Check if service already exists with the same name
  const serviceExists = await Service.findOne({ name });
  if (serviceExists) {
    res.status(400);
    throw new Error("Service with that name already exists");
  }

  const service = await Service.create({
    name,
    description,
    status: status || "active",
    usageCount: 0,
  });

  if (service) {
    res.status(201).json(service);
  } else {
    res.status(400);
    throw new Error("Invalid service data");
  }
});

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;

  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  // Check for name uniqueness if name is being changed
  if (name && name !== service.name) {
    const nameExists = await Service.findOne({ name });
    if (nameExists) {
      res.status(400);
      throw new Error("A service with that name already exists");
    }
  }

  service.name = name || service.name;
  service.description = description || service.description;
  service.status = status || service.status;

  const updatedService = await service.save();
  res.status(200).json(updatedService);
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  await service.deleteOne();
  res.status(200).json({ message: "Service removed" });
});

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
