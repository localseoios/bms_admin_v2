// Load dotenv config first to ensure environment variables are available
require("dotenv").config();

const cloudinary = require("cloudinary").v2;

// Log environment variables (without secrets) for debugging
console.log(
  "Cloudinary Config - Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME ? "✓ Found" : "❌ Missing"
);
console.log(
  "Cloudinary Config - API Key:",
  process.env.CLOUDINARY_API_KEY ? "✓ Found" : "❌ Missing"
);
console.log(
  "Cloudinary Config - API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "✓ Found" : "❌ Missing"
);

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 seconds timeout
});

module.exports = cloudinary;
