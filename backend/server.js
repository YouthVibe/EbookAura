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

// Find the static files directory
// Try multiple possible locations to handle different deployment environments
const findStaticDir = () => {
  const possibleDirs = [
    path.join(__dirname, 'out'),                // Direct 'out' subdirectory of backend
    path.join(__dirname, 'public'),             // 'public' directory if renamed
    path.join(__dirname, '..', 'out'),          // One level up
    path.join(__dirname, 'ebooks-aura', 'out'), // In case the frontend folder is included
    path.resolve(process.env.STATIC_FILES_DIR || '')  // From environment variable if set
  ];

  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      try {
        // Verify it's a directory and has index.html
        const stats = fs.statSync(dir);
        if (stats.isDirectory() && fs.existsSync(path.join(dir, 'index.html'))) {
          console.log(`Found static site directory at: ${dir}`);
          return dir;
        }
      } catch (err) {
        console.error(`Error checking directory ${dir}:`, err.message);
      }
    }
  }

  return null;
};

// Get the static directory
const staticDir = findStaticDir();

// Serve static files
if (staticDir) {
  console.log('📂 Static site found. Serving files from:', staticDir);
  
  // Serve static assets with caching for production
  app.use(express.static(staticDir, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, // 1 day cache in production
    etag: true,
    index: false // Don't automatically serve index.html, we'll handle that
  }));

  // Handle client-side routing - serve index.html for any non-API route not found
  app.get('*', (req, res, next) => {
    // Skip API routes and direct them to the appropriate handler
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    try {
      // Check if the specific file exists (for assets like images, CSS, JS)
      const filePath = path.join(staticDir, req.path);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
      }
      
      // Check if it's a directory with index.html
      if (fs.existsSync(path.join(staticDir, req.path, 'index.html'))) {
        return res.sendFile(path.join(staticDir, req.path, 'index.html'));
      }

      // Route not found, serve the main index.html for client-side routing
      console.log(`Route "${req.path}" not found, serving index.html`);
      return res.sendFile(path.join(staticDir, 'index.html'));
    } catch (err) {
      console.error(`Error serving static file for path ${req.path}:`, err.message);
      // If there's an error, continue to API routes or 404 handler
      next();
    }
  });
  
  console.log('🌐 Static site is now being served along with the API');
} else {
  console.warn('⚠️ Static site directory not found. UI will not be served.');
  console.warn('  Please ensure the "out" directory exists and contains index.html');
  
  // Create a simple HTML maintenance page if no static site is found
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EbookAura API Server</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #ef4444; }
          .message { background: #f9fafb; padding: 20px; border-radius: 8px; }
          .status { color: #10b981; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>EbookAura API Server</h1>
        <div class="message">
          <p>The API server is running, but no static website files were found.</p>
          <p>API Status: <span class="status">Online</span></p>
          <p>Server Time: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `);
  });
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
  if (staticDir) {
    console.log(`🌐 Website available at http://localhost:${PORT}`);
  }
}); 