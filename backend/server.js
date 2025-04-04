const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const bodyParser = require("body-parser");
const errorHandler = require("./src/middleware/errorMiddleware");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jobRoutes = require("./src/routes/jobRoutes");
const path = require("path");
const fs = require("fs");
const notificationRoutes = require("./src/routes/notificationRoutes");
const operationRoutes = require("./src/routes/operationRoutes"); // New operation routes
const kycRoutes = require("./src/routes/kycRoutes");
const errorLoggingMiddleware = require("./src/middleware/errorLoggingMiddleware");
const braRoutes = require("./src/routes/braRoutes"); // New BRA routes

// Ensure temp uploads directory exists
const tempUploadsDir = path.join(__dirname, "src/temp-uploads");
if (!fs.existsSync(tempUploadsDir)) {
  console.log("Creating temp uploads directory:", tempUploadsDir);
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

dotenv.config();
const app = express();

// Add this BEFORE your existing error handler
app.use(errorLoggingMiddleware);

// Increase server timeout settings
app.timeout = 120000; // 2 minutes

// Increase payload size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

// Enhanced CORS settings for file uploads
app.use(
  cors({
    origin: [process.env.VITE_FRONTEND_URL, "https://testapp.newoon.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    exposedHeaders: ["Content-Disposition"],
  })
);

// Configure static folder for temp uploads with proper headers
app.use(
  "/temp-uploads",
  (req, res, next) => {
    // Set headers to prevent caching for uploaded files
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    next();
  },
  express.static(path.join(__dirname, "src/temp-uploads"))
);

// Improved route to serve uploaded files with proper error handling
app.get("/files/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "src/temp-uploads",
    req.params.filename
  );

  // Check if file exists
  if (fs.existsSync(filePath)) {
    // Set content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";
    res.set("Content-Type", contentType);

    // Send the file
    res.sendFile(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
    res.status(404).send("File not found");
  }
});

app.use("/api/auth", require("./src/routes/authRoute"));
app.use("/api/users", require("./src/routes/userRoute"));
app.use("/api/roles", require("./src/routes/roleRoute"));
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/clients", require("./src/routes/clientRoutes"));
app.use("/api/operations", operationRoutes); // New operation routes
app.use("/api/kyc", kycRoutes);
app.use("/api/bra", braRoutes); // New BRA routes added here

// Add specific handler for multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error("Multer upload error:", err);

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File too large",
        error: `Maximum file size is ${(err.size || 10) / (1024 * 1024)}MB`,
      });
    }

    return res.status(400).json({
      message: "File upload error",
      error: err.message,
    });
  }

  // For other errors, pass to the generic error handler
  next(err);
});

// Standard error handler
app.use(errorHandler);

// Add this catch-all error handler for uncaught errors
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({
    message: "An unexpected error occurred",
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const PORT = process.env.PORT || 5000;
mongoose
  .set("strictQuery", false)
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000, // 30 seconds MongoDB connection timeout
    socketTimeoutMS: 45000, // 45 seconds MongoDB operation timeout
  })
  .then(() => {
    console.log("MongoDB connected successfully");
    const server = app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}`);
    });

    // Set timeout for the server
    server.timeout = 120000; // 2 minutes
  })
  .catch((err) => console.log(err));
