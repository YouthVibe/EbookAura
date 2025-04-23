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
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const coinRoutes = require('./routes/coinRoutes');

// Load environment variables
dotenv.config();

// Check for Render.com environment
const isRenderEnvironment = process.env.RENDER || process.env.RENDER_EXTERNAL_URL;
if (isRenderEnvironment) {
  console.log('🌐 Render.com environment detected');
}

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
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB max file size
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
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/coins', coinRoutes);

// Find the static files directory
// Try multiple possible locations to handle different deployment environments
const findStaticDir = () => {
  const possibleDirs = [
    process.env.STATIC_FILES_DIR,                // From environment variable if set
    path.join(__dirname, 'out'),                // Direct 'out' subdirectory of backend
    path.join(__dirname, 'public'),             // 'public' directory if renamed
    path.join(__dirname, '..', 'out'),          // One level up
    path.join(__dirname, 'ebooks-aura', 'out'), // In case the frontend folder is included
  ].filter(Boolean); // Filter out undefined values

  console.log('🔍 Searching for static files in these locations:');
  for (const dir of possibleDirs) {
    console.log(`  - ${dir}`);
  }

  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      try {
        // Verify it's a directory and has index.html
        const stats = fs.statSync(dir);
        if (stats.isDirectory() && fs.existsSync(path.join(dir, 'index.html'))) {
          console.log(`✅ Found valid static site directory at: ${dir}`);
          
          // If on Render.com, log more details about the directory
          if (isRenderEnvironment) {
            try {
              const dirContents = fs.readdirSync(dir);
              console.log(`Directory contents (${dirContents.length} items):`);
              dirContents.forEach(item => {
                const itemPath = path.join(dir, item);
                const itemStats = fs.statSync(itemPath);
                console.log(`  - ${item} (${itemStats.isDirectory() ? 'directory' : 'file'})`);
              });
            } catch (err) {
              console.error(`Error reading directory contents: ${err.message}`);
            }
          }
          
          return dir;
        }
      } catch (err) {
        console.error(`Error checking directory ${dir}:`, err.message);
      }
    }
  }

  console.log('❌ No valid static site directory found');
  return null;
};

// Get the static directory
const staticDir = findStaticDir();

// Serve static files
if (staticDir) {
  console.log('📂 Static site found. Serving files from:', staticDir);
  
  // Serve static assets with caching for production
  const staticOptions = {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, // 1 day cache in production
    etag: true,
    index: false, // Don't automatically serve index.html, we'll handle that
    dotfiles: 'ignore',
    // Add additional debugging in Render environment
    setHeaders: function (res, path, stat) {
      if (isRenderEnvironment && process.env.DEBUG === 'true') {
        console.log(`Serving static file: ${path}`);
      }
    }
  };
  
  app.use(express.static(staticDir, staticOptions));

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
  
  // Generate a maintenance page if we're on Render
  if (isRenderEnvironment || process.env.FORCE_STATIC_GENERATION === 'true') {
    console.log('🔧 Creating maintenance page for Render.com...');
    
    // Create a simple HTML maintenance page if no static site is found
    app.get('/', (req, res) => {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
      });
      const formattedTime = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>EbookAura - Maintenance</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9fafb;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                    color: #111827;
                }
                .container {
                    max-width: 600px;
                    padding: 2rem;
                    background-color: white;
                    border-radius: 1rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    margin: 1rem;
                }
                .logo {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                }
                .logo-ebook {
                    color: #111827;
                }
                .logo-aura {
                    color: #ef4444;
                }
                h1 {
                    font-size: 1.8rem;
                    margin-bottom: 1.5rem;
                    color: #111827;
                }
                p {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: #4b5563;
                    margin-bottom: 1.5rem;
                }
                .progress {
                    width: 100%;
                    height: 8px;
                    background-color: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 2rem 0;
                }
                .progress-bar {
                    height: 100%;
                    width: 75%;
                    background-color: #ef4444;
                    border-radius: 4px;
                    animation: progress 1.5s ease-in-out infinite;
                }
                @keyframes progress {
                    0% { width: 25%; }
                    50% { width: 75%; }
                    100% { width: 25%; }
                }
                .status {
                    font-weight: bold;
                    color: #10b981;
                }
            </style>
            <meta http-equiv="refresh" content="60">
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <span class="logo-ebook">Ebook</span><span class="logo-aura">Aura</span>
                </div>
                <h1>Site Maintenance</h1>
                <p>Our website is currently undergoing scheduled maintenance.</p>
                
                <div class="progress">
                    <div class="progress-bar"></div>
                </div>
                
                <p>Please check back soon. The API remains <span class="status">fully operational</span>.</p>
                
                <p>Server Time: ${formattedDate}, ${formattedTime}</p>
            </div>
        </body>
        </html>
      `);
    });
    
    // Catch-all route to serve the same maintenance page for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.redirect('/');
    });
    
    console.log('✅ Maintenance page routes configured');
  } else {
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
  } else if (isRenderEnvironment || process.env.FORCE_STATIC_GENERATION === 'true') {
    console.log(`🌐 Maintenance page available at http://localhost:${PORT}`);
  }
}); 