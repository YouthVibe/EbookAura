const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// @desc    Upload a file to Cloudinary
// @route   POST /api/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    const file = req.files.file;
    
    // Check if file is an image
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size should be less than 2MB' });
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'ebook_aura',
      width: 800,
      crop: 'scale'
    });
    
    // Remove file from temp directory
    fs.unlinkSync(file.tempFilePath);
    
    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error uploading file',
      error: error.message 
    });
  }
};

// @desc    Delete a file from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete file' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting file',
      error: error.message 
    });
  }
};

module.exports = {
  uploadFile,
  deleteFile
}; 