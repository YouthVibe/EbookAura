// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./utils/errorHandler');
const { initCloudinary } = require('./config/cloudinary');
const { createTransporter } = require('./config/email');
const fileUpload = require('express-fileupload');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Database connection
connectDB();

// Initialize services
const emailTransporter = createTransporter();
initCloudinary();

// Initialize Express app
const app = express();

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// Configure file upload options
const fileUploadOptions = {
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'temp'),
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  debug: false // Turn off debug mode to reduce console logs
};

// API routes
// Apply normal middleware for user routes without file upload
app.use('/api/users', userRoutes);

// Apply file upload middleware only for routes that need it
app.use('/api/upload', fileUpload(fileUploadOptions), uploadRoutes);

// Add a simple ping endpoint for connectivity checks
app.get('/ping', (req, res) => {
  res.status(200).json({
    message: 'API server is running',
    serverTime: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Apply error handler middleware
app.use(errorHandler);

// Handle graceful shutdown
const cleanupAndExit = () => {
  console.log('Cleaning up before exit...');
  
  // Clean up temp directory
  if (fs.existsSync(path.join(__dirname, 'temp'))) {
    try {
      const files = fs.readdirSync(path.join(__dirname, 'temp'));
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(__dirname, 'temp', file));
        }
      }
      console.log('Cleaned up temp directory');
    } catch (error) {
      console.error('Error cleaning temp directory:', error);
    }
  }
  
  process.exit(0);
};

// Register cleanup handlers
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);

// Server initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 