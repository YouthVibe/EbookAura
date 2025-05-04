const User = require('../models/User');
const Book = require('../models/Book');
const Review = require('../models/Review');
const Bookmark = require('../models/Bookmark');
const mongoose = require('mongoose');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Ban/Unban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
const toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow admins to ban other admins
    if (user.isAdmin) {
      return res.status(403).json({ message: 'Cannot ban admin users' });
    }
    
    // Toggle the banned status (add isBanned field if it doesn't exist)
    user.isBanned = !user.isBanned;
    
    await user.save();
    
    res.status(200).json({ 
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      userId: user._id,
      isBanned: user.isBanned
    });
  } catch (error) {
    console.error('Error toggling user ban status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow admins to delete other admins
    if (user.isAdmin) {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete user's reviews
      await Review.deleteMany({ user: userId }, { session });
      
      // Delete user's bookmarks
      await Bookmark.deleteMany({ user: userId }, { session });
      
      // Delete user
      await User.findByIdAndDelete(userId, { session });
      
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({ message: 'User deleted successfully', userId });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all books
// @route   GET /api/admin/books
// @access  Private/Admin
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find({})
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email', null, { strictPopulate: false });
    
    res.status(200).json(books);
  } catch (error) {
    console.error('Error getting all books:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a book
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
const deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    
    // Check if valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    
    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Track if there were any Cloudinary errors
    let cloudinaryErrors = [];
    
    // Delete the PDF file from Cloudinary if pdfId exists
    if (book.pdfId) {
      try {
        console.log(`Attempting to delete PDF file from Cloudinary: ${book.pdfId}`);
        const pdfDeletionResult = await cloudinary.uploader.destroy(book.pdfId, { resource_type: 'raw' });
        console.log(`Deleted PDF file from Cloudinary: ${book.pdfId}`, pdfDeletionResult);
      } catch (cloudinaryError) {
        console.error(`Error deleting PDF from Cloudinary: ${book.pdfId}`, cloudinaryError);
        cloudinaryErrors.push(`PDF (${book.pdfId}): ${cloudinaryError.message}`);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }
    
    // Delete the cover image from Cloudinary if coverImageId exists
    if (book.coverImageId) {
      try {
        console.log(`Attempting to delete cover image from Cloudinary: ${book.coverImageId}`);
        const coverDeletionResult = await cloudinary.uploader.destroy(book.coverImageId);
        console.log(`Deleted cover image from Cloudinary: ${book.coverImageId}`, coverDeletionResult);
      } catch (cloudinaryError) {
        console.error(`Error deleting cover image from Cloudinary: ${book.coverImageId}`, cloudinaryError);
        cloudinaryErrors.push(`Cover image (${book.coverImageId}): ${cloudinaryError.message}`);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }
    
    // Start a session for transaction to delete DB records
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete book's reviews
      await Review.deleteMany({ book: bookId }, { session });
      
      // Delete book's bookmarks
      await Bookmark.deleteMany({ book: bookId }, { session });
      
      // Delete book
      await Book.findByIdAndDelete(bookId, { session });
      
      await session.commitTransaction();
      session.endSession();
      
      // If there were Cloudinary errors, include in response but still return 200
      if (cloudinaryErrors.length > 0) {
        return res.status(200).json({ 
          message: 'Book deleted successfully from database, but there were issues deleting some Cloudinary resources. The admin should check Cloudinary for orphaned resources.',
          bookId,
          cloudinaryErrors
        });
      }
      
      res.status(200).json({ 
        message: 'Book deleted successfully including PDF and cover image',
        bookId 
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a book (Admin only)
// @route   PUT /api/admin/books/:id
// @access  Private/Admin
const updateBook = async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized. Admin access required' });
    }

    const { id } = req.params;
    
    // Find the book to update
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    console.log('Updating book:', book.title);
    
    // Extract the basic book data from the request body
    const { 
      title, 
      author, 
      description, 
      category, 
      pageSize, 
      tags, 
      isPremium, 
      price 
    } = req.body;
    
    // Prepare updated book data
    const updatedBookData = {
      // Keep the original data if not provided in the request
      title: title || book.title,
      author: author || book.author,
      description: description || book.description,
      category: category || book.category,
      pageSize: pageSize || book.pageSize,
      isPremium: isPremium === undefined ? book.isPremium : isPremium === 'true' || isPremium === true,
      price: isPremium === 'true' || isPremium === true ? (price || book.price || 0) : 0
    };
    
    // Handle tags - they might come as a string, array, or JSON string
    if (tags) {
      try {
        if (typeof tags === 'string') {
          // First try to parse as JSON
          try {
            updatedBookData.tags = JSON.parse(tags);
          } catch (e) {
            // If not valid JSON, split by comma
            updatedBookData.tags = tags.split(',').map(tag => tag.trim());
          }
        } else if (Array.isArray(tags)) {
          updatedBookData.tags = tags;
        }
      } catch (err) {
        console.error('Error processing tags:', err);
        // Fallback to original tags
        updatedBookData.tags = book.tags;
      }
    }
    
    // Check if files are being updated
    let pdfUpdated = false;
    let coverUpdated = false;
    
    // Handle PDF update if a new file is uploaded
    if (req.files && req.files.pdf) {
      try {
        console.log('Updating PDF file');
        
        // Upload the new PDF to Cloudinary
        const timestamp = Date.now();
        const sanitizedTitle = title ? title.replace(/[^a-zA-Z0-9]/g, '_') : book.title.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Upload the PDF as a raw file
        const pdfResult = await cloudinary.uploader.upload(req.files.pdf.tempFilePath, {
          public_id: sanitizedTitle + '_' + timestamp,
          folder: 'ebook_aura/pdfs',
          resource_type: 'raw',
          type: 'upload',
          tags: ['pdf', 'ebook'],
          use_filename: true,
          timeout: 900000 // 15 minute timeout for PDF upload
        });
        
        console.log('PDF updated successfully:', pdfResult.public_id);
        
        // Delete the old PDF file from Cloudinary if it exists
        if (book.pdfId) {
          try {
            await cloudinary.uploader.destroy(book.pdfId, { resource_type: 'raw' });
            console.log('Deleted old PDF:', book.pdfId);
          } catch (err) {
            console.error('Error deleting old PDF:', err);
            // Continue even if deletion fails
          }
        }
        
        // Remove temp file
        fs.unlinkSync(req.files.pdf.tempFilePath);
        
        // Update book data with new PDF info
        updatedBookData.pdfUrl = pdfResult.secure_url;
        updatedBookData.pdfId = pdfResult.public_id;
        pdfUpdated = true;
        
        // Calculate file size
        const fileSizeMB = (req.files.pdf.size / (1024 * 1024)).toFixed(2);
        updatedBookData.fileSizeMB = parseFloat(fileSizeMB);
      } catch (err) {
        console.error('Error uploading new PDF:', err);
        return res.status(500).json({ 
          message: 'Error uploading new PDF file',
          error: err.message
        });
      }
    }
    
    // Handle cover image update if a new file is uploaded
    if (req.files && req.files.cover) {
      try {
        console.log('Updating cover image');
        
        // Upload the new cover to Cloudinary
        const coverResult = await cloudinary.uploader.upload(req.files.cover.tempFilePath, {
          folder: 'ebook_aura/covers',
          width: 500,
          height: 750,
          crop: 'fill',
          timeout: 120000 // 2 minute timeout
        });
        
        console.log('Cover image updated successfully:', coverResult.public_id);
        
        // Delete the old cover image from Cloudinary if it exists
        if (book.coverImageId) {
          try {
            await cloudinary.uploader.destroy(book.coverImageId);
            console.log('Deleted old cover image:', book.coverImageId);
          } catch (err) {
            console.error('Error deleting old cover image:', err);
            // Continue even if deletion fails
          }
        }
        
        // Remove temp file
        fs.unlinkSync(req.files.cover.tempFilePath);
        
        // Update book data with new cover info
        updatedBookData.coverImage = coverResult.secure_url;
        updatedBookData.coverImageId = coverResult.public_id;
        coverUpdated = true;
      } catch (err) {
        console.error('Error uploading new cover image:', err);
        return res.status(500).json({ 
          message: 'Error uploading new cover image',
          error: err.message
        });
      }
    }
    
    // Update the book in the database
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      updatedBookData,
      { new: true, runValidators: true }
    );
    
    console.log('Book updated successfully');
    
    // Return the updated book
    res.status(200).json({
      message: 'Book updated successfully',
      book: updatedBook,
      pdfUpdated,
      coverUpdated
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ 
      message: 'Server error updating book',
      error: error.message
    });
  }
};

// @desc    Check for orphaned Cloudinary resources and clean them up
// @route   POST /api/admin/cleanup-cloudinary
// @access  Private/Admin
const cleanupCloudinaryResources = async (req, res) => {
  try {
    // Get all book records from the database to check against
    const books = await Book.find({});
    
    // Create sets of valid PDF and cover image IDs from the database
    const validPdfIds = new Set(books.map(book => book.pdfId).filter(Boolean));
    const validCoverIds = new Set(books.map(book => book.coverImageId).filter(Boolean));
    
    // Track deleted resources
    const deletedResources = {
      pdfs: [],
      covers: []
    };
    
    // Track errors
    const errors = [];

    try {
      // List all resources in the PDFs folder
      console.log('Checking for orphaned PDF resources in ebook_aura/pdfs folder');
      let pdfResources;
      
      try {
        // Try the resources_by_asset_folder method first
        pdfResources = await cloudinary.api.resources_by_asset_folder('ebook_aura/pdfs', {
          resource_type: 'raw',
          max_results: 500
        });
      } catch (assetFolderError) {
        console.error('Error using resources_by_asset_folder for PDFs, falling back to regular resources method:', assetFolderError);
        
        // Fall back to the regular resources method as a backup
        try {
          pdfResources = await cloudinary.api.resources({
            resource_type: 'raw',
            type: 'upload',
            prefix: 'ebook_aura/pdfs',
            max_results: 500
          });
        } catch (resourcesError) {
          throw new Error(`Failed to list PDF resources with both methods: ${resourcesError.message}`);
        }
      }
      
      // Delete orphaned PDF resources
      if (pdfResources && pdfResources.resources) {
        for (const resource of pdfResources.resources) {
          // If the resource is not in our valid IDs set, it's orphaned
          if (!validPdfIds.has(resource.public_id)) {
            try {
              console.log(`Deleting orphaned PDF resource: ${resource.public_id}`);
              await cloudinary.uploader.destroy(resource.public_id, { resource_type: 'raw' });
              deletedResources.pdfs.push(resource.public_id);
            } catch (error) {
              errors.push({
                type: 'pdf',
                id: resource.public_id,
                error: error.message
              });
              console.error(`Error deleting orphaned PDF resource: ${resource.public_id}`, error);
            }
          }
        }
      }
    } catch (error) {
      errors.push({
        type: 'pdf_listing',
        error: error.message
      });
      console.error('Error listing PDF resources from Cloudinary:', error);
    }
    
    try {
      // List all resources in the covers folder
      console.log('Checking for orphaned cover image resources in ebook_aura/covers folder');
      let coverResources;
      
      try {
        // Try the resources_by_asset_folder method first
        coverResources = await cloudinary.api.resources_by_asset_folder('ebook_aura/covers', {
          resource_type: 'image',
          max_results: 500
        });
      } catch (assetFolderError) {
        console.error('Error using resources_by_asset_folder for covers, falling back to regular resources method:', assetFolderError);
        
        // Fall back to the regular resources method as a backup
        try {
          coverResources = await cloudinary.api.resources({
            resource_type: 'image',
            type: 'upload',
            prefix: 'ebook_aura/covers',
            max_results: 500
          });
        } catch (resourcesError) {
          throw new Error(`Failed to list cover resources with both methods: ${resourcesError.message}`);
        }
      }
      
      // Delete orphaned cover resources
      if (coverResources && coverResources.resources) {
        for (const resource of coverResources.resources) {
          // If the resource is not in our valid IDs set, it's orphaned
          if (!validCoverIds.has(resource.public_id)) {
            try {
              console.log(`Deleting orphaned cover resource: ${resource.public_id}`);
              await cloudinary.uploader.destroy(resource.public_id);
              deletedResources.covers.push(resource.public_id);
            } catch (error) {
              errors.push({
                type: 'cover',
                id: resource.public_id,
                error: error.message
              });
              console.error(`Error deleting orphaned cover resource: ${resource.public_id}`, error);
            }
          }
        }
      }
    } catch (error) {
      errors.push({
        type: 'cover_listing',
        error: error.message
      });
      console.error('Error listing cover resources from Cloudinary:', error);
    }
    
    // Return results
    res.status(200).json({
      message: 'Cloudinary cleanup completed',
      deleted: deletedResources,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Error cleaning up Cloudinary resources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  toggleUserBan,
  deleteUser,
  getAllBooks,
  deleteBook,
  updateBook,
  cleanupCloudinaryResources
}; 