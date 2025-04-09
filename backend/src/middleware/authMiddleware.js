// middleware/authMiddleware.js (Update for BRA permissions)

const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Utility function to safely access nested properties using dot notation
const getNestedProperty = (obj, path) => {
  if (!obj || !path) return undefined;

  // Handle array paths like 'permissions.kycManagement.lmro'
  return path.split(".").reduce((curr, key) => {
    return curr && typeof curr !== "undefined" ? curr[key] : undefined;
  }, obj);
};

// Protect middleware - verifies the JWT token and attaches the user to the request
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

    // Add user to request
    req.user = user;

    // For debugging - log the user's permissions
    // console.log("User role:", user.role?.name);
    // console.log(
    //   "User permissions:",
    //   JSON.stringify(user.role?.permissions, null, 2)
    // );

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.name === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an admin");
  }
};

// Enhanced middleware to check permissions - supports nested paths with dot notation
const checkPermission = (permissionPath) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user || !user.role) {
      console.error("No user or role found in request");
      res.status(401);
      throw new Error("Not authorized");
    }

    // Handle the case of admin always having all permissions
    if (user.role.name === "admin") {
      return next();
    }

    // Handle array of permission paths (any match grants access)
    if (Array.isArray(permissionPath)) {
      const hasAnyPermission = permissionPath.some((path) => {
        const permission = getNestedProperty(user.role.permissions, path);
        return permission === true;
      });

      if (hasAnyPermission) {
        return next();
      }

      console.error(
        `User lacks any of these permissions: ${permissionPath.join(", ")}`
      );
      res.status(403);
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Handle single permission path
    const permissionValue = getNestedProperty(
      user.role.permissions,
      permissionPath
    );

    console.log(
      `Checking permission: ${permissionPath}, Value:`,
      permissionValue
    );

    if (permissionValue === true) {
      return next();
    }

    console.error(`User lacks permission: ${permissionPath}`);
    res.status(403);
    throw new Error("Forbidden: Insufficient permissions");
  });
};

// Special middleware for KYC management - allows access if user has any KYC role
const checkKycPermission = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user || !user.role) {
    res.status(401);
    throw new Error("Not authorized");
  }

  // Handle the case of admin always having all permissions
  if (user.role.name === "admin") {
    return next();
  }

  // Check for any KYC management permission
  const kycPermissions = user.role.permissions?.kycManagement;
  const hasKycPermission =
    kycPermissions &&
    (kycPermissions.lmro === true ||
      kycPermissions.dlmro === true ||
      kycPermissions.ceo === true);

  if (hasKycPermission) {
    return next();
  }

  console.error("User lacks any KYC management permission");
  res.status(403);
  throw new Error("Forbidden: Insufficient KYC management permissions");
});

// New middleware for BRA management - allows access if user has any BRA role
const checkBraPermission = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user || !user.role) {
    res.status(401);
    throw new Error("Not authorized");
  }

  // Handle the case of admin always having all permissions
  if (user.role.name === "admin") {
    return next();
  }

  // Check for any BRA management permission
  const braPermissions = user.role.permissions?.braManagement;
  const hasBraPermission =
    braPermissions &&
    (braPermissions.lmro === true ||
      braPermissions.dlmro === true ||
      braPermissions.ceo === true);

  if (hasBraPermission) {
    return next();
  }

  console.error("User lacks any BRA management permission");
  res.status(403);
  throw new Error("Forbidden: Insufficient BRA management permissions");
});

module.exports = {
  protect,
  adminOnly,
  checkPermission,
  checkKycPermission,
  checkBraPermission,
};
