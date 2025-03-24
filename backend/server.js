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
const notificationRoutes = require("./src/routes/notificationRoutes");

dotenv.config();
const app = express();

// Increase server timeout settings
app.timeout = 120000; // 2 minutes

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Don't use upload.none() here as it conflicts with file upload routes
// app.use(upload.none()); // REMOVE THIS LINE

app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(
  "/temp-uploads",
  express.static(path.join(__dirname, "src/temp-uploads"))
);

// Create a route to serve the files as a fallback when Cloudinary is not available
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'src/temp-uploads', req.params.filename);
  res.sendFile(filePath);
});

app.use("/api/auth", require("./src/routes/authRoute"));
app.use("/api/users", require("./src/routes/userRoute"));
app.use("/api/roles", require("./src/routes/roleRoute"));
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/clients", require("./src/routes/clientRoutes"));

app.use(errorHandler);

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
