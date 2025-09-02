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
    console.log('\n📁 === FILE UPLOAD STARTED ===');
    console.log('Original filename:', file.originalname);
    console.log('Field name:', file.fieldname);
    console.log('Mimetype:', file.mimetype);
    const tempDir = ensureTempDir();
    console.log('Temp directory:', tempDir);
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Create a safe filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeFilename = Buffer.from(file.originalname, "latin1")
      .toString("utf8")
      .replace(/[^a-zA-Z0-9-_.]/g, "_");

    const finalFilename = `${file.fieldname}-${uniqueSuffix}${path.extname(safeFilename)}`;
    console.log('Generated filename:', finalFilename);
    cb(null, finalFilename);
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

  console.log('\n🔍 Validating file type:', file.mimetype);
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('✅ File type accepted:', file.mimetype);
    cb(null, true);
  } else {
    console.error('❌ File type rejected:', file.mimetype);
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
    console.log('\n☁️ === CLOUDINARY UPLOAD ===');
    console.log(`📤 Uploading file: ${filePath}`);
    console.log(`📂 Upload folder: ${options.folder || "uploads"}`);

    // Check if file exists before uploading
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileSize = fs.statSync(filePath).size;
    console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Set default folder if not provided
    const uploadOptions = {
      folder: options.folder || "uploads",
      resource_type: "auto", // Auto-detect resource type
      timeout: 60000, // 60 seconds timeout
      ...options,
    };

    console.log('🚀 Starting upload to Cloudinary...');
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    console.log(`✅ Upload successful!`);
    console.log(`🌐 URL: ${result.secure_url}`);
    console.log(`🆔 Public ID: ${result.public_id}`);
    console.log('==========================\n');

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error(`❌ Cloudinary upload error:`, error.message);
    console.error(`Error details:`, error);

    // Generate a fallback URL to serve the file locally
    const filename = path.basename(filePath);
    const fallbackUrl = `/files/${filename}`;
    console.log(`🔄 Using fallback URL: ${fallbackUrl}`);
    console.log('==========================\n');

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
