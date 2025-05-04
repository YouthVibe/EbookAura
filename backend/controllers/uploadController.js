/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
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

    // Extract form data
    const { 
      title, 
      author, 
      description, 
      pageSize = 0,
      category = 'General',
      tags = '',
      isPremium = 'false',
      price = 0,
      isCustomUrl = 'false',
      fileSizeMB = 0
    } = req.body;
    
    const bookIsPremium = isPremium === 'true';
    const bookPrice = parseInt(price, 10) || 0;
    const customUrlFileSize = parseFloat(fileSizeMB) || 0;
    
    // Validate required fields
    if (!title || !author || !description || !category || !pageSize) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate title length
    if (title.length > 100) {
      return res.status(400).json({ message: 'Title must be under 100 characters' });
    }

    // Validate description length
    if (description.length > 200) {
      return res.status(400).json({ message: 'Description must be under 200 characters' });
    }
    
    // Validate premium book price
    if (bookIsPremium && bookPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid number greater than or equal to 0' });
    }
    
    // Validate field lengths
    if (title.length > 100) {
      return res.status(400).json({ message: 'Title must be under 100 characters' });
    }
    
    if (description.length > 200) {
      return res.status(400).json({ message: 'Description must be under 200 characters' });
    }

    // Handle the custom URL case
    if (isCustomUrl === 'true' && req.body.pdfUrl) {
      const pdfUrl = req.body.pdfUrl;
      console.log('Using custom PDF URL:', pdfUrl);
      
      // Check if the URL is valid - accept any URL format
      try {
        new URL(pdfUrl);
        // We'll accept any valid URL format, not just PDFs
        console.log('URL format is valid');
      } catch (error) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }
      
      // Check if file size was provided for custom URL
      if (customUrlFileSize <= 0) {
        return res.status(400).json({ message: 'Please provide a valid file size greater than 0' });
      }
      
      console.log(`Custom URL PDF file size: ${customUrlFileSize} MB`);
      
      // Still need to check if cover image is provided
      if (!req.files || !req.files.coverImage) {
        return res.status(400).json({ message: 'Cover image is required' });
      }
      
      const coverImage = req.files.coverImage;
      
      // Check if cover is an image
      if (!coverImage.mimetype.startsWith('image')) {
        return res.status(400).json({ message: 'Please upload an image file for the cover' });
      }
      
      // Check cover image file size (limit to 5MB)
      if (coverImage.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Cover image size should be less than 5MB' });
      }
      
      // Upload cover image to Cloudinary
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
      
      // Generate a unique identifier for the PDF
      const timestamp = Date.now();
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      const pdfId = `custom_url_${sanitizedTitle}_${timestamp}`;
      
      // Create a new book document for the custom URL PDF
      const newBook = new Book({
        title,
        author,
        description,
        coverImage: coverResult.secure_url,
        coverImageId: coverResult.public_id,
        pdfUrl: pdfUrl,
        pdfId: pdfId,
        isCustomUrl: true,
        customURLPDF: '', // No longer storing duplicate URL
        isPremium: bookIsPremium,
        price: bookPrice, // Add price field for premium books
        pageSize: parseInt(pageSize, 10),
        fileSizeMB: customUrlFileSize,
        category,
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: req.user._id
      });
      
      console.log('Creating book with custom URL and user ID:', req.user._id);
      console.log('Book data being saved:', { 
        ...newBook._doc, 
        uploadedBy: req.user._id.toString(),
        isPremium: bookIsPremium,
        price: bookPrice
      });
      
      // Create new book in database
      try {
        const book = await newBook.save();
        
        console.log(`Book created successfully with ID: ${book._id}`);
        console.log(`Custom PDF URL stored: ${book.pdfUrl}`);
        console.log(`Book uploaded by user: ${book.uploadedBy}`);
        
        res.status(201).json({
          success: true,
          message: 'Book uploaded successfully',
          book: {
            id: book._id,
            title: book.title,
            coverImage: book.coverImage,
            pdfUrl: book.pdfUrl,
            isCustomUrl: book.isCustomUrl,
            uploadedBy: book.uploadedBy
          }
        });
      } catch (dbError) {
        console.error('Error creating book in database:', dbError);
        
        // Clean up Cloudinary resources if book creation fails
        if (coverResult && coverResult.public_id) {
          await cloudinary.uploader.destroy(coverResult.public_id);
        }
        
        res.status(500).json({ 
          message: 'Error saving book to database. Files were uploaded but could not be saved.',
          error: dbError.message
        });
      }
    } else {
      // Handle the regular file upload case
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded' });
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
      
      // Calculate PDF file size in MB
      const fileSizeMB = parseFloat((pdfFile.size / (1024 * 1024)).toFixed(2));
      
      console.log(`PDF file size: ${fileSizeMB} MB`);
      
      // Check file extension
      const pdfExt = path.extname(pdfFile.name).toLowerCase();
      if (pdfExt !== '.pdf') {
        return res.status(400).json({ message: 'Please upload a file with .pdf extension' });
      }
      
      // Check PDF file size (limit to 300MB now to account for larger books)
      if (pdfFile.size > 300 * 1024 * 1024) {
        return res.status(400).json({ message: 'PDF file size should be less than 300MB' });
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
        console.log(`Attempting to upload PDF: ${pdfFile.name}, Size: ${fileSizeMB}MB, MIME: ${pdfFile.mimetype}`);
        
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
          timeout: 900000 // 15 minute timeout for PDF upload to handle files up to 300MB
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
      
      // Create a new book document with the uploaded files
      const newBook = new Book({
        title,
        author,
        description,
        coverImage: coverResult.secure_url,
        coverImageId: coverResult.public_id,
        pdfUrl: pdfUrl,
        pdfId: pdfResult.public_id,
        isCustomUrl: false, // This is a regular file upload
        customURLPDF: '', // No custom URL
        isPremium: bookIsPremium, // Add premium status
        price: bookPrice, // Add the price for premium books
        pageSize: parseInt(pageSize, 10),
        fileSizeMB: fileSizeMB, // Save the calculated file size
        category,
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: req.user._id
      });
      
      console.log('Creating book with user ID:', req.user._id);
      console.log('Book data being saved:', { 
        ...newBook._doc, 
        uploadedBy: req.user._id.toString(),
        isPremium: bookIsPremium,
        price: bookPrice
      });
      
      // Create new book in database
      try {
        const book = await newBook.save();
        
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