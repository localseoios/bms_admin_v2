const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Utility function to access nested properties using dot notation
const getNestedProperty = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

// Protect middleware (already present)
const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verified.id)
      .select("-password")
      .populate("role");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

// Admin-only middleware (already present)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.name === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};

// New middleware to check permissions
const checkPermission = (permissionPath) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      res.status(401);
      throw new Error("Not authorized");
    }
    const permissionValue = getNestedProperty(
      user.role.permissions,
      permissionPath
    );
    if (permissionValue === true) {
      next();
    } else {
      res.status(403);
      throw new Error("Forbidden: Insufficient permissions");
    }
  });
};

module.exports = { protect, adminOnly, checkPermission };
