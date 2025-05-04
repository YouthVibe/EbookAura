/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Function to initialize Cloudinary configuration
const initCloudinary = () => {
  // Check if Cloudinary environment variables are set
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('WARNING: Missing Cloudinary configuration environment variables. File uploads will fail.');
    // Continue anyway to not break the app
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  
  console.log('Cloudinary configuration initialized with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
};

// Pre-configure for direct use in controllers
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Add a simple ping to verify credentials
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test successful:', result.status);
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:', error.message);
    return false;
  }
};

module.exports = { cloudinary, initCloudinary, testCloudinaryConnection }; 