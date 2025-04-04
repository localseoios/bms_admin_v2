// middleware/errorLoggingMiddleware.js

const errorLoggingMiddleware = (err, req, res, next) => {
  // Log detailed error information
  console.error("=== API ERROR ===");
  console.error(`Route: ${req.method} ${req.originalUrl}`);
  console.error(`Error message: ${err.message}`);
  console.error(`Stack trace: ${err.stack}`);

  if (req.user) {
    console.error(`User: ${req.user.name} (${req.user._id})`);
    console.error(`Role: ${req.user.role?.name}`);
    console.error(
      "Permissions:",
      JSON.stringify(req.user.role?.permissions, null, 2)
    );
  } else {
    console.error("No authenticated user");
  }

  // Pass to next error handler
  next(err);
};

module.exports = errorLoggingMiddleware;
