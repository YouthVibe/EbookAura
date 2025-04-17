// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./utils/errorHandler');
const { initCloudinary, testCloudinaryConnection } = require('./config/cloudinary');
const { createTransporter } = require('./config/email');
const fileUpload = require('express-fileupload');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const reviewRoutes = require('./routes/reviewRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const bookRoutes = require('./routes/bookRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

// Database connection
connectDB();

// Initialize services
const emailTransporter = createTransporter();
initCloudinary();

// Test Cloudinary connection
testCloudinaryConnection()
  .then(success => {
    if (!success) {
      console.warn('⚠️ Cloudinary connection test failed. PDF uploads may not work correctly.');
    } else {
      console.log('✅ Cloudinary connection verified. PDF uploads should work correctly.');
    }
  })
  .catch(err => {
    console.error('Error testing Cloudinary connection:', err);
  });

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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max file size
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  debug: false // Turn off debug mode to reduce console logs
};

// API routes
// Apply normal middleware for user routes without file upload
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

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

// Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files from the Next.js out directory
const outDir = path.join(__dirname, 'out');
if (fs.existsSync(outDir)) {
  console.log('📂 Static site found in out directory. Serving files...');
  
  // Serve static assets (images, JS, CSS files)
  app.use(express.static(outDir, {
    maxAge: '1y',  // Set cache time for static assets to 1 year
    etag: true
  }));

  // Handle client-side routing - serve index.html for any request not found
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Check if the specific file exists
    const filePath = path.join(outDir, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    
    // For any route that doesn't have an extension or isn't a direct file,
    // serve the appropriate HTML file or fallback to index.html
    const htmlPath = path.join(outDir, req.path, 'index.html');
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
    
    // Fallback to index.html for client-side routing
    res.sendFile(path.join(outDir, 'index.html'));
  });
  
  console.log('🌐 Static site is now being served along with the API');
} else {
  console.warn('⚠️ Out directory not found. Static site will not be served.');
  console.warn('  Create the static site by running: npm run build');
}

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  if (fs.existsSync(outDir)) {
    console.log(`🌐 Website available at http://localhost:${PORT}`);
  }
}); 