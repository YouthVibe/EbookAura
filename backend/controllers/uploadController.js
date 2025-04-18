const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');
const mongoose = require('mongoose');

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

// @desc    Upload a PDF file with metadata to Cloudinary (Admin only)
// @route   POST /api/upload/pdf
// @access  Private/Admin
const uploadPdf = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    // Check if the user is an admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized. Admin access required' });
    }

    // Check if user ID is available
    if (!req.user._id) {
      return res.status(401).json({ message: 'User authentication failed. Please log in again.' });
    }

    console.log('User data:', { 
      userId: req.user._id,
      name: req.user.name, 
      isAdmin: req.user.isAdmin 
    });

    // Check if all required fields are present
    const { title, author, description, category, pageSize } = req.body;
    
    if (!title || !author || !description || !category || !pageSize) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate field lengths
    if (title.length > 100) {
      return res.status(400).json({ message: 'Title must be under 100 characters' });
    }
    
    if (description.length > 200) {
      return res.status(400).json({ message: 'Description must be under 200 characters' });
    }

    // Check if both PDF and cover image are provided
    if (!req.files.pdf || !req.files.coverImage) {
      return res.status(400).json({ message: 'Both PDF file and cover image are required' });
    }

    const pdfFile = req.files.pdf;
    const coverImage = req.files.coverImage;
    
    // Check if file is a PDF
    if (pdfFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Please upload a PDF file (application/pdf MIME type)' });
    }
    
    // Check file extension
    const pdfExt = path.extname(pdfFile.name).toLowerCase();
    if (pdfExt !== '.pdf') {
      return res.status(400).json({ message: 'Please upload a file with .pdf extension' });
    }
    
    // Check PDF file size (limit to 20MB now to account for larger books)
    if (pdfFile.size > 20 * 1024 * 1024) {
      return res.status(400).json({ message: 'PDF file size should be less than 20MB' });
    }
    
    // Check if cover is an image
    if (!coverImage.mimetype.startsWith('image')) {
      return res.status(400).json({ message: 'Please upload an image file for the cover' });
    }
    
    // Check cover image file size (limit to 5MB)
    if (coverImage.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Cover image size should be less than 5MB' });
    }

    // No need for this variable anymore since we use folder parameter
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueId = Date.now();
    
    // Upload cover image to Cloudinary first (smaller file, less likely to timeout)
    let coverResult;
    try {
      coverResult = await cloudinary.uploader.upload(coverImage.tempFilePath, {
        folder: 'ebook_aura/covers',
        width: 500,
        height: 750,
        crop: 'fill',
        timeout: 120000 // 2 minute timeout for cover image
      });
      
      // Remove cover image from temp directory
      fs.unlinkSync(coverImage.tempFilePath);
    } catch (uploadError) {
      console.error('Error uploading cover image:', uploadError);
      return res.status(500).json({ 
        message: 'Error uploading cover image', 
        error: uploadError.message 
      });
    }
    
    // Upload PDF to Cloudinary with increased timeout
    let pdfResult;
    try {
      console.log(`Attempting to upload PDF: ${pdfFile.name}, Size: ${(pdfFile.size / (1024 * 1024)).toFixed(2)}MB, MIME: ${pdfFile.mimetype}`);
      
      // Generate a more readable public ID
      const timestamp = Date.now();
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      
      console.log(`Using public ID for PDF: ${sanitizedTitle}_${timestamp} in folder ebook_aura/pdfs`);
      
      // Upload the PDF as a raw file to Cloudinary
      pdfResult = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
        public_id: sanitizedTitle + '_' + timestamp,
        folder: 'ebook_aura/pdfs',
        resource_type: 'raw', // This is critical - raw files for PDF
        type: 'upload',
        tags: ['pdf', 'ebook'],
        use_filename: true,
        timeout: 300000 // 5 minute timeout for PDF upload
      });
      
      console.log(`PDF upload successful, URL: ${pdfResult.secure_url}`);
      console.log(`PDF public ID: ${pdfResult.public_id}`);
      
      // Remove PDF file from temp directory
      fs.unlinkSync(pdfFile.tempFilePath);
    } catch (uploadError) {
      // If PDF upload fails, we need to clean up the cover image that was already uploaded
      if (coverResult && coverResult.public_id) {
        await cloudinary.uploader.destroy(coverResult.public_id);
        console.log(`Deleted cover image ${coverResult.public_id} after PDF upload failure`);
      }
      
      console.error('Error uploading PDF:', uploadError);
      return res.status(500).json({ 
        message: 'Error uploading PDF file. Please try a smaller file or try again later.', 
        error: uploadError.message 
      });
    }
    
    // Store the direct raw URL for the PDF
    // We'll handle content-disposition in the PDF endpoint
    const pdfUrl = pdfResult.secure_url;
    
    // For debugging - log the PDF URL structure
    console.log('PDF URL saved to database:', pdfUrl);
    console.log('PDF ID saved to database:', pdfResult.public_id);
    
    // Create book document data
    const bookData = {
      title,
      author,
      description,
      coverImage: coverResult.secure_url,
      coverImageId: coverResult.public_id,
      pdfUrl: pdfUrl,
      pdfId: pdfResult.public_id,
      pageSize: parseInt(pageSize, 10),
      category,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      uploadedBy: req.user._id  // Make sure this is set correctly
    };
    
    console.log('Creating book with user ID:', req.user._id);
    console.log('Book data being saved:', { ...bookData, uploadedBy: req.user._id.toString() });
    
    // Create new book in database
    try {
      const book = await Book.create(bookData);
      
      console.log(`Book created successfully with ID: ${book._id}`);
      console.log(`PDF URL stored: ${book.pdfUrl}`);
      console.log(`PDF ID stored: ${book.pdfId}`);
      console.log(`Book uploaded by user: ${book.uploadedBy}`);
      
      res.status(201).json({
        success: true,
        message: 'Book uploaded successfully',
        book: {
          id: book._id,
          title: book.title,
          coverImage: book.coverImage,
          pdfUrl: book.pdfUrl,
          uploadedBy: book.uploadedBy
        }
      });
    } catch (dbError) {
      console.error('Error creating book in database:', dbError);
      
      // Clean up Cloudinary resources if book creation fails
      if (coverResult && coverResult.public_id) {
        await cloudinary.uploader.destroy(coverResult.public_id);
      }
      if (pdfResult && pdfResult.public_id) {
        await cloudinary.uploader.destroy(pdfResult.public_id, { resource_type: 'raw' });
      }
      
      res.status(500).json({ 
        message: 'Error saving book to database. Files were uploaded but could not be saved.',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error uploading book:', error);
    res.status(500).json({ 
      message: 'Error uploading book. Please try again later.',
      error: error.message 
    });
  }
};

// @desc    Delete a book and its associated files (Admin only)
// @route   DELETE /api/upload/book/:id
// @access  Private/Admin
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized. Admin access required' });
    }
    
    // Find the book
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Delete PDF from Cloudinary
    if (book.pdfId) {
      await cloudinary.uploader.destroy(book.pdfId, { resource_type: 'raw' });
    }
    
    // Delete cover image from Cloudinary
    if (book.coverImageId) {
      await cloudinary.uploader.destroy(book.coverImageId);
    }
    
    // Delete book from database
    await Book.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ 
      message: 'Error deleting book',
      error: error.message 
    });
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  uploadPdf,
  deleteBook
}; 