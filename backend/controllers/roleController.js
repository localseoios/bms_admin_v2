const asyncHandler = require("express-async-handler");
const Role = require("../models/roleModel");

// Get all roles
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find();
  res.status(200).json(roles);
});

// Create a role
const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;
  if (!name || !permissions) {
    res.status(400);
    throw new Error("Please provide name and permissions");
  }
  const role = await Role.create({ name, permissions });
  res.status(201).json(role);
});

// Get a single role
const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) {
    res.status(404);
    throw new Error("Role not found");
  }
  res.status(200).json(role);
});

// Update a role
const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) {
    res.status(404);
    throw new Error("Role not found");
  }
  const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json(updatedRole);
});

// Delete a role
// Delete a role
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) {
    res.status(404);
    throw new Error("Role not found");
  }

  // Instead of role.remove(), use findByIdAndDelete
  await Role.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Role deleted" });
});


module.exports = { getRoles, createRole, getRole, updateRole, deleteRole };
