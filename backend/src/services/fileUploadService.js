// src/services/fileUploadService.js
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");

// Ensure temp directory exists
const ensureTempDir = () => {
  const tempDir = path.join(__dirname, "../temp-uploads");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

// Configure multer disk storage for temporary files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = ensureTempDir();
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Create a safe filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeFilename = Buffer.from(file.originalname, "latin1")
      .toString("utf8")
      .replace(/[^a-zA-Z0-9-_.]/g, "_");

    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(safeFilename)}`);
  },
});

// File filter to validate document types
const fileFilter = (req, file, cb) => {
  // Accept only common document formats
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, Word, Excel, and image files are allowed."
      ),
      false
    );
  }
};

// Enhanced Cloudinary upload function with better error handling
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    console.log(`Uploading file to Cloudinary: ${filePath}`);

    // Check if file exists before uploading
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Set default folder if not provided
    const uploadOptions = {
      folder: options.folder || "uploads",
      resource_type: "auto", // Auto-detect resource type
      timeout: 60000, // 60 seconds timeout
      ...options,
    };

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    console.log(`Upload successful: ${result.secure_url}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error(`Cloudinary upload error for ${filePath}:`, error);

    // Generate a fallback URL to serve the file locally
    const filename = path.basename(filePath);
    const fallbackUrl = `/files/${filename}`;

    return {
      success: false,
      url: fallbackUrl,
      error: error.message,
      originalPath: filePath,
    };
  }
};

// Function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("Public ID is required");
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
      result,
    };
  } catch (error) {
    console.error(`Error deleting from Cloudinary (${publicId}):`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 10MB size limit
  },
});

const largeFileUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 250 * 1024 * 1024, // 25MB size limit for CEO documents
  },
});

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  ensureTempDir,
  largeFileUpload,
};
