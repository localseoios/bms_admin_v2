const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendPasswordResetEmail, send2FAEmail } = require("../services/emailService");
const { uploadToCloudinary, deleteFromCloudinary } = require("../services/fileUploadService");
const fs = require("fs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  const customerRole = await Role.findOne({ name: "customer" });
  if (!customerRole) {
    res.status(500);
    throw new Error("Default customer role not found");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: customerRole._id,
  });

  const token = generateToken(user._id);
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { _id, name, email, role } = user;
    res.status(201).json({ _id, name, email, role, token });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});



// Login User - Enhanced with Better Diagnostics
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log("Received login attempt for email:", email);

  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  await user.populate("role");

  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  if (passwordIsCorrect) {
    // Generate 2FA code
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
    const twoFAExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save 2FA code to user
    user.twoFACode = twoFACode;
    user.twoFAExpire = twoFAExpiry;
    user.isLoginPending = true;
    await user.save();

    // Send 2FA email in background (non-blocking for faster response)
    send2FAEmail(user.email, twoFACode, user.name)
      .then(result => {
        if (result.success) {
          console.log(`2FA email sent successfully to ${user.email}`);
        } else {
          console.error(`Failed to send 2FA email to ${user.email}:`, result.error);
        }
      })
      .catch(err => {
        console.error(`2FA email error for ${user.email}:`, err.message);
      });

    // Respond immediately without waiting for email
    res.status(200).json({
      success: true,
      requiresTwoFA: true,
      message: "Verification code sent to your email",
      email: user.email,
      userId: user._id
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});



// Logout User
const logout = asyncHandler(async (req, res) => {
  try {
    // Try to get user ID from request body or query (for manual logout)
    const userId = req.body.userId || req.query.userId;
    
    if (userId) {
      // Manual logout with user ID provided
      const user = await User.findById(userId);
      if (user) {
        user.isOnline = false;
        user.lastActivity = new Date();
        await user.save();
        console.log(`User ${user.email} manually logged out`);
      }
    } else if (req.user) {
      // Protected logout (if middleware runs)
      const user = await User.findById(req.user._id);
      if (user) {
        user.isOnline = false;
        user.lastActivity = new Date();
        await user.save();
        console.log(`User ${user.email} logged out via protected route`);
      }
    }

    // Clear the authentication cookie
    res.cookie("token", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(0),
      sameSite: "none",
      secure: true,
    });
    
    res.status(200).json({ message: "Successfully Logged Out" });
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear the cookie even if database update fails
    res.cookie("token", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(0),
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({ message: "Logged out (with error updating status)" });
  }
});

// Get all users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate("role");
  res.status(200).json(users);
});

// Create a user (admin only)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password || !roleId) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const role = await Role.findById(roleId);
  if (!role) {
    res.status(400);
    throw new Error("Role not found");
  }

  // Remove the manual password hashing
  // Let the pre-save hook in the user model handle the hashing
  const user = await User.create({
    name,
    email,
    password, // No longer manually hashing here
    role: roleId,
  });
  res.status(201).json(user);
});

// Get a user
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate("role");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json(user);
});

// Update a user
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email, roleId } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (roleId) {
    const role = await Role.findById(roleId);
    if (!role) {
      res.status(400);
      throw new Error("Role not found");
    }
    user.role = roleId;
  }
  await user.save();
  res.status(200).json(user);
});

// Delete a user
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate("role");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role && user.role.name && user.role.name.toLowerCase() === "admin") {
    res.status(403);
    throw new Error("Cannot delete admin users");
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "User deleted successfully" });
});

// Reset user password (admin only)
const resetUserPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body;
  
  if (!userId || !newPassword) {
    res.status(400);
    throw new Error("Please provide user ID and new password");
  }
  
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Set the new password directly
  user.password = newPassword;
  
  // Save the user (this will trigger the pre-save hook to hash the password correctly)
  await user.save();

  res.status(200).json({ 
    message: "Password reset successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});


// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("role");
  if (user) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update current user
const updateCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) {
    // Validate email format
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error("Please enter a valid email");
    }
    // Check if email is already in use by another user
    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
      res.status(400);
      throw new Error("Email is already in use");
    }
    user.email = email;
  }
  await user.save();
  await user.populate("role");
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Please provide current and new passwords");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const passwordIsCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!passwordIsCorrect) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();
  res.status(200).json({ message: "Password updated successfully" });
});

// Get online users
const getOnlineUsers = asyncHandler(async (req, res) => {
  try {
    // Consider users online if they logged in recently (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const onlineUsers = await User.find({
      $or: [
        { isOnline: true },
        { lastActivity: { $gte: thirtyMinutesAgo } }
      ]
    })
    .populate("role", "name")
    .select("-password")
    .sort({ lastActivity: -1 });

    res.status(200).json({
      success: true,
      count: onlineUsers.length,
      data: onlineUsers,
      message: `Found ${onlineUsers.length} online users`
    });
  } catch (error) {
    console.error("Error fetching online users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching online users",
      error: error.message
    });
  }
});

// Get all operation managers
const getOperationManagers = asyncHandler(async (req, res) => {
  try {
    // Get all users and populate their role information
    const users = await User.find()
      .populate({
        path: 'role',
        select: 'name permissions'
      })
      .select('_id name email role');

    // Filter users who have operation manager role or permission
    const operationManagers = users.filter(user => 
      user.role && (
        user.role.name === "operation_manager" || 
        (user.role.permissions && user.role.permissions.operationManagement === true)
      )
    );

    res.status(200).json(operationManagers);
  } catch (error) {
    console.error("Error fetching operation managers:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Generate 6-digit reset code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Please provide email address");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("No account found with this email address");
  }

  // Generate reset code and set expiry (15 minutes)
  const resetCode = generateResetCode();
  const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);

  // Save reset code to user
  user.resetPasswordToken = resetCode;
  user.resetPasswordExpire = resetExpiry;
  await user.save();

  // Send email
  const emailResult = await sendPasswordResetEmail(email, resetCode);

  if (!emailResult.success) {
    res.status(500);
    throw new Error("Failed to send reset email. Please try again later.");
  }

  res.status(200).json({
    message: "Password reset code sent to your email",
    success: true
  });
});

// Verify reset code and reset password
const resetPasswordWithCode = asyncHandler(async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    res.status(400);
    throw new Error("Please provide email, reset code, and new password");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const user = await User.findOne({
    email,
    resetPasswordToken: resetCode,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset code");
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  res.status(200).json({
    message: "Password reset successful",
    success: true
  });
});

// Verify 2FA code and complete login
const verify2FA = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    res.status(400);
    throw new Error("Please provide user ID and verification code");
  }

  const user = await User.findOne({
    _id: userId,
    twoFACode: code,
    twoFAExpire: { $gt: Date.now() },
    isLoginPending: true
  }).populate("role");

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification code");
  }

  // Clear 2FA data and complete login
  user.twoFACode = null;
  user.twoFAExpire = null;
  user.isLoginPending = false;
  user.isOnline = true;
  user.lastLogin = new Date();
  user.lastActivity = new Date();
  await user.save();

  const token = generateToken(user._id);
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
  });

  const { _id, name, email, role } = user;
  const response = { _id, name, email, role };
  if (process.env.NODE_ENV === "development") {
    response.token = token;
  }
  res.status(200).json(response);
});

const getUsersByServiceType = asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  const Service = require("../models/serviceModel");

  const service = await Service.findOne({ name: serviceName, status: "active" }).populate("roles");

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  if (!service.roles || service.roles.length === 0) {
    return res.status(200).json([]);
  }

  const roleIds = service.roles.map((role) => role._id);

  const users = await User.find({ role: { $in: roleIds } })
    .populate("role", "name")
    .select("_id name email role status")
    .sort({ name: 1 });

  res.status(200).json(users);
});

const getDashboardUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .populate("role", "name")
    .select("_id name email role status createdAt")
    .sort({ name: 1 });

  res.status(200).json(users);
});

const getUsersWithSignaturePermissions = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .populate({
      path: "role",
      select: "name permissions",
    })
    .select("_id name email role signatureImage");

  const usersWithSignaturePerms = users.filter((user) => {
    if (!user.role || !user.role.permissions) return false;
    const kycPerms = user.role.permissions.kycManagement;
    return kycPerms && (kycPerms.dlmro === true || kycPerms.lmro === true || kycPerms.ceo === true);
  });

  res.status(200).json(usersWithSignaturePerms);
});

const uploadUserSignature = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).populate("role");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const kycPerms = user.role?.permissions?.kycManagement;
  if (!kycPerms || !(kycPerms.dlmro || kycPerms.lmro || kycPerms.ceo)) {
    res.status(400);
    throw new Error("User does not have KYC signing permissions (DLMRO, LMRO, or CEO)");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a signature image");
  }

  try {
    if (user.signatureImage?.cloudinaryId) {
      await deleteFromCloudinary(user.signatureImage.cloudinaryId);
    }

    const uploadResult = await uploadToCloudinary(req.file.path, {
      folder: "signatures",
    });

    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (!uploadResult.success) {
      res.status(500);
      throw new Error("Failed to upload signature to cloud storage");
    }

    user.signatureImage = {
      fileUrl: uploadResult.url,
      cloudinaryId: uploadResult.publicId,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
    };

    await user.save();

    res.status(200).json({
      message: "Signature uploaded successfully",
      signatureImage: user.signatureImage,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

const deleteUserSignature = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.signatureImage?.cloudinaryId) {
    res.status(400);
    throw new Error("User does not have a signature uploaded");
  }

  await deleteFromCloudinary(user.signatureImage.cloudinaryId);

  user.signatureImage = {
    fileUrl: null,
    cloudinaryId: null,
    uploadedAt: null,
    uploadedBy: null,
  };

  await user.save();

  res.status(200).json({
    message: "Signature deleted successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getOnlineUsers,
  getOperationManagers,
  requestPasswordReset,
  resetPasswordWithCode,
  verify2FA,
  getUsersByServiceType,
  getDashboardUsers,
  getUsersWithSignaturePermissions,
  uploadUserSignature,
  deleteUserSignature,
};
