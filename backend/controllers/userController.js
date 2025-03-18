const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
    console.log("User not found in database");
    res.status(400);
    throw new Error("User not found, please signup");
  }
  
  // Log user details and password hash for debugging
  console.log("User found:", {
    id: user._id,
    email: user.email,
    roleId: user.role,
    // Show password hash length and format for diagnostic purposes
    passwordHashLength: user.password.length,
    passwordHashStart: user.password.substring(0, 10) + '...'
  });

  // Populate the role
  await user.populate("role");
  console.log("Role populated:", user.role ? user.role.name : "Role not found");

  // Standard password verification
  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  console.log("Password verification:", passwordIsCorrect ? "Successful" : "Failed");

  if (passwordIsCorrect) {
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
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});



// Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({ message: "Successfully Logged Out" });
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
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  await user.remove();
  res.status(200).json({ message: "User deleted" });
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
  
  console.log(`Password reset successful for user: ${user.email}`);
  
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
};
