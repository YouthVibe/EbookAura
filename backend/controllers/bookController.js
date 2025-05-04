/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const Book = require('../models/Book');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = asyncHandler(async (req, res) => {
  const { category, tag, search, sort, page = 1, limit = 10, premium } = req.query;
  
  // Convert pagination parameters to numbers
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const limitCapped = Math.min(limitNum, 50); // Cap at 50 items per page
  
  // Calculate skip value for pagination
  const skip = (pageNum - 1) * limitCapped;
  
  // Build query
  let query = {};
  
  // Add category filter if provided
  if (category) {
    query.category = category;
  }
  
  // Add tag filter if provided
  if (tag) {
    query.tags = tag;
  }
  
  // Add premium filter if provided
  if (premium === 'true') {
    query.isPremium = true;
    console.log('Filtering for premium books only');
  }
  
  // Add search filter if provided
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  try {
    // Get total count of matching books for pagination
    const totalBooks = await Book.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalBooks / limitCapped);
    
    // IMPORTANT FIX: Explicitly list ALL required fields including premium-related ones
    // This ensures they're always included even in production
    const books = await Book.find(query)
      .sort(sort ? buildSortOptions(sort) : { createdAt: -1 })
      .select('_id title author description category tags views downloads createdAt coverImage pageSize fileSizeMB averageRating isCustomUrl customURLPDF isPremium price')
      .skip(skip)
      .limit(limitCapped);
    
    // Create a more reliable transformed books array
    const transformedBooks = await Promise.all(books.map(async (book) => {
      // Start with basic book data
      const bookObj = book.toObject();
      
      // Use the direct premium check function for more reliability
      // This bypasses any serialization issues
      const bookId = book._id.toString();
      const isPremiumDirect = await checkIfBookIsPremium(bookId);
      
      // Only use direct check if it returned a non-null result
      const finalIsPremium = isPremiumDirect !== null 
        ? isPremiumDirect 
        : book.isPremium === true || typeof book.price === 'number' && book.price > 0;
      
      // Ensure price is a number
      const finalPrice = typeof book.price === 'number' ? book.price :
                        (finalIsPremium ? 25 : 0);
      
      // Return the enhanced book object with correct types
      return {
        ...bookObj,
        isPremium: finalIsPremium,
        price: finalPrice
      };
    }));
    
    // Debug logging for premium books
    const premiumBooks = transformedBooks.filter(book => book.isPremium);
    console.log(`Found ${premiumBooks.length} premium books out of ${transformedBooks.length} total books`);
    
    // Log detailed info for each premium book
    premiumBooks.forEach(book => {
      console.log(`Premium book found: ${book.title}`);
      console.log(` - isPremium: ${book.isPremium} (type: ${typeof book.isPremium})`);
      console.log(` - price: ${book.price} (type: ${typeof book.price})`);
      console.log(` - _id: ${book._id} (type: ${typeof book._id})`);
    });
    
    // Log a sample book to verify isPremium is included
    if (transformedBooks.length > 0) {
      console.log(`Sample book premium status: ${transformedBooks[0].title} - isPremium: ${transformedBooks[0].isPremium} (type: ${typeof transformedBooks[0].isPremium})`);
      console.log(`Sample book data structure: ${JSON.stringify(transformedBooks[0], null, 2).substring(0, 300)}...`);
      if (transformedBooks[0].isPremium) {
        console.log(`Sample book price: ${transformedBooks[0].price} coins (type: ${typeof transformedBooks[0].price})`);
      }
    }
    
    // Send response with pagination metadata
    res.json({
      books: transformedBooks,
      pagination: {
        page: pageNum,
        limit: limitCapped,
        totalBooks,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error in getBooks controller:', error);
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});

// Helper function to build sort options
function buildSortOptions(sort) {
  let sortOptions = {};
  
  switch (sort) {
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    case 'oldest':
      sortOptions.createdAt = 1;
      break;
    case 'title':
      sortOptions.title = 1;
      break;
    case 'popular':
      sortOptions.views = -1;
      break;
    case 'rating':
      sortOptions.averageRating = -1;
      break;
    default:
      sortOptions.createdAt = -1; // Default sort by newest
  }
  
  return sortOptions;
}

// @desc    Get book categories
// @route   GET /api/books/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.distinct('category');
  res.json(categories);
});

// @desc    Get book tags
// @route   GET /api/books/tags
// @access  Public
const getTags = asyncHandler(async (req, res) => {
  const tags = await Book.distinct('tags');
  res.json(tags);
});

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
const getBook = asyncHandler(async (req, res) => {
  // IMPORTANT FIX: Explicitly include all fields, especially isPremium and price
  const book = await Book.findById(req.params.id)
    .select('_id title author description category tags views downloads createdAt pdfUrl pdfId coverImage pageSize fileSizeMB averageRating isCustomUrl customURLPDF isPremium price');
    
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  
  // Increment views
  book.views += 1;
  await book.save();
  
  // Log for debugging custom URLs
  if (book.isCustomUrl) {
    console.log(`Serving book with custom URL: ${book.title} - Custom URL: ${book.customURLPDF}`);
  }
  
  // Convert book to JSON and ensure property types are consistent
  const bookData = book.toObject();
  
  // IMPORTANT: Force proper types for premium-related properties with redundant checks
  // This ensures these fields are properly converted from MongoDB types
  
  // Log raw data for debugging
  console.log(`Raw book data for ${book.title}:`);
  console.log(`- Raw isPremium = ${book.isPremium} (${typeof book.isPremium})`);
  console.log(`- Raw price = ${book.price} (${typeof book.price})`);
  
  // ENHANCED PRODUCTION FIX: More robust checks for premium status
  // Get the book ID as string for reference
  const bookId = book._id.toString();
  
  // Check if this book is known to be premium by looking up its ID directly
  const isPremiumBook = await checkIfBookIsPremium(bookId);
  
  // If we have conclusive information from the direct check, use it
  if (isPremiumBook !== null) {
    console.log(`Direct premium check for ${book.title}: isPremium=${isPremiumBook}`);
    bookData.isPremium = isPremiumBook;
    
    // If the book is premium but the database doesn't reflect it, update it
    if (isPremiumBook === true && book.isPremium !== true) {
      console.log(`Fixing premium status for book ${bookId} in database`);
      book.isPremium = true;
      await book.save();
    }
  } else {
    // Use multiple checks for premium status as backup
    // Try various ways to determine if the book is premium
    const isPremiumByFlag = book.isPremium === true;
    const isPremiumByPrice = typeof book.price === 'number' && book.price > 0;
    const isPremiumByString = String(book.isPremium).toLowerCase() === 'true';
    
    // Combine all checks
    bookData.isPremium = isPremiumByFlag || isPremiumByPrice || isPremiumByString;
  }
  
  // Force price to be a number regardless of MongoDB type
  bookData.price = typeof book.price === 'number' ? book.price : 
                  (bookData.isPremium ? 25 : 0);
  
  // Additional safeguards to ensure premium books have prices
  if (bookData.isPremium && (!bookData.price || bookData.price <= 0)) {
    bookData.price = 25; // Default price for premium books
    console.log(`Setting default price=25 for premium book without price`);
    
    // Also update the database for consistency
    book.price = 25;
    await book.save();
    console.log(`Updated database record for book ${book._id} to set price=25`);
  }
  
  // Check user authentication for purchase status
  // If authenticated, check if the user has purchased this book or has pro access
  if (req.user && req.user._id) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);
      
      if (user) {
        // ENHANCEMENT: Check if user has an active subscription in the Subscription collection
        // Import the Subscription model if it exists
        let Subscription;
        try {
          Subscription = mongoose.model('Subscription');
        } catch (err) {
          try {
            Subscription = require('../models/Subscription');
          } catch (modelErr) {
            console.log('Subscription model not available, using only User model for subscription checks');
          }
        }
        
        let hasActiveSubscription = false;
        
        // Check subscription in Subscription collection if model is available
        if (Subscription) {
          console.log(`Checking subscription status in Subscription collection for user ${userId}`);
          
          const subscription = await Subscription.findOne({
            user: userId,
            status: 'active'
          }).sort({ endDate: -1 }); // Get most recent active subscription
          
          if (subscription) {
            const now = new Date();
            if (new Date(subscription.endDate) > now) {
              // Subscription is active
              hasActiveSubscription = true;
              console.log(`Found active subscription in Subscription collection for user ${userId}, expires: ${subscription.endDate}`);
              
              // Update planActive in User model if needed
              if (!user.planActive) {
                console.log(`Updating planActive=true in User model for user ${userId}`);
                user.planActive = true;
                user.planType = subscription.plan.toString().includes('pro') ? 'pro' : 'basic';
                user.planExpiresAt = subscription.endDate;
                await user.save();
              }
            } else {
              // Subscription has expired, update its status
              console.log(`Subscription has expired for user ${userId}, updating status`);
              subscription.status = 'expired';
              await subscription.save();
              
              // Update User model if needed
              if (user.planActive) {
                console.log(`Updating planActive=false in User model for user ${userId} due to expired subscription`);
                user.planActive = false;
                await user.save();
              }
            }
          } else {
            console.log(`No active subscription found in Subscription collection for user ${userId}`);
            
            // Check if user has planExpiresAt set with valid expiration
            if (user.planExpiresAt) {
              const now = new Date();
              if (new Date(user.planExpiresAt) > now) {
                // Legacy expiration date is still valid
                hasActiveSubscription = user.planActive;
                console.log(`Using legacy planExpiresAt check for user ${userId}, active: ${hasActiveSubscription}`);
              } else if (user.planActive) {
                // Expired but planActive is true - update it
                console.log(`Legacy planExpiresAt has expired for user ${userId}, updating planActive=false`);
                user.planActive = false;
                await user.save();
              }
            } else if (user.planActive) {
              // No expiration date but planActive is true - assume it's invalid
              console.log(`No planExpiresAt found but planActive=true for user ${userId}, updating planActive=false`);
              user.planActive = false;
              await user.save();
            }
          }
        } else {
          // Fallback to just checking User model if Subscription model is not available
          hasActiveSubscription = user.planActive === true;
          
          // Also check if the planExpiresAt is valid
          if (hasActiveSubscription && user.planExpiresAt) {
            const now = new Date();
            if (new Date(user.planExpiresAt) < now) {
              // Plan has expired, update the user record
              console.log(`User ${userId} has expired plan, updating planActive=false`);
              user.planActive = false;
              hasActiveSubscription = false;
              await user.save();
            }
          }
        }
        
        // Check if the book ID exists in the user's purchased books array
        const hasPurchased = user.purchasedBooks && user.purchasedBooks.some(id => 
          id.toString() === book._id.toString()
        );
        
        // User has Pro plan access if planActive is true (from our checks above)
        // or it's set in the request by the checkProPlanBookAccess middleware
        const hasProAccess = req.user.hasProAccess === true || hasActiveSubscription;
        
        // User has access if they purchased the book OR they have Pro plan access
        bookData.userHasAccess = hasPurchased || hasProAccess;
        
        // Add the subscription status to the response
        bookData.hasSubscription = hasActiveSubscription;
        
        if (hasProAccess && !hasPurchased) {
          console.log(`User ${userId} granted access to premium book ${book._id} through Pro plan`);
        } else {
          console.log(`User ${userId} has ${hasPurchased ? 'purchased' : 'not purchased'} book ${book._id}`);
        }
      }
    } catch (err) {
      console.error('Error checking user purchase status:', err);
      // Don't let this error block the response
      bookData.userHasAccess = false;
      bookData.hasSubscription = false;
    }
  } else {
    // No authenticated user
    bookData.userHasAccess = false;
    bookData.hasSubscription = false;
  }
  
  // Log transformed book data for debugging
  console.log(`Transformed book data for ${book.title}:`);
  console.log(`- isPremium = ${bookData.isPremium} (${typeof bookData.isPremium})`);
  console.log(`- price = ${bookData.price} (${typeof bookData.price})`);
  console.log(`- userHasAccess = ${bookData.userHasAccess}`);
  console.log(`- hasSubscription = ${bookData.hasSubscription}`);
  
  res.json(bookData);
});

// Helper function to directly check if a book is premium by ID
// This bypasses any serialization issues by making a direct DB query
const checkIfBookIsPremium = async (bookId) => {
  try {
    // Use a lean query to get raw data and avoid any conversion issues
    const premiumCheck = await Book.findById(bookId)
      .select('isPremium price')
      .lean();
    
    if (!premiumCheck) return null;
    
    // Check both properties to determine premium status
    if (premiumCheck.isPremium === true) return true;
    if (typeof premiumCheck.price === 'number' && premiumCheck.price > 0) return true;
    
    // If we have conclusive evidence it's not premium
    return false;
  } catch (err) {
    console.error(`Error in direct premium check for book ${bookId}:`, err);
    return null; // Return null to indicate the check failed
  }
};

// @desc    Increment book downloads
// @route   POST /api/books/:id/download
// @access  Public
const incrementDownloads = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  
  // Only increment if this is from the download button
  // The PDF endpoint will also handle incrementing if accessed directly
  const alreadyIncremented = req.query.counted === 'true';
  
  if (!alreadyIncremented) {
    book.downloads += 1;
    await book.save();
  }
  
  res.json({ message: 'Download count incremented', downloads: book.downloads });
});

// Function to serve the PDF file for a book
exports.servePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const isDownload = req.query.download === 'true';
    const isCounted = req.query.counted === 'true';
    
    console.log(`PDF request - Book ID: ${id}, Download: ${isDownload}, Counted: ${isCounted}`);
    
    // Find the book
    const book = await Book.findById(id);
    
    if (!book) {
      console.log(`Book not found with ID: ${id}`);
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if this is a premium book
    const isPremium = book.isPremium || book.premiumOnly || book.isExclusive;
    
    console.log(`Serving PDF for book: ${book.title}, Premium: ${isPremium}, Download: ${isDownload}`);

    // Only check authentication and subscription if this is a premium book AND it's a download request
    // Viewing is allowed for everyone
    if (isPremium && isDownload) {
      console.log('Premium book download requested, checking authentication');
      
      // Check if user is authenticated via API key (set by apiKeyAuth middleware)
      if (req.apiKeyAuthenticated && req.user) {
        console.log(`User authenticated via API key: ${req.user.email}`);
        
        // Check subscription status (set by apiKeyAuth middleware)
        if (!req.hasSubscription) {
          console.log(`User ${req.user.email} does not have an active subscription`);
          return res.status(403).json({
            message: 'Active subscription required to download premium content',
            isPremium: true,
            requiresSubscription: true
          });
        }
        
        console.log(`Subscription verified for API key user: ${req.user.email}`);
      }
      // If not authenticated via API key, check for JWT token
      else {
        // Check for authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.log('No authentication token provided for premium download');
          return res.status(401).json({
            message: 'Authentication required to download premium content',
            isPremium: true,
            requiresSubscription: true
          });
        }
        
        try {
          // Extract and verify the token
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Find the user
          const user = await User.findById(decoded.id);
          
          if (!user) {
            console.log(`User not found for token ID: ${decoded.id}`);
            return res.status(401).json({
              message: 'User not found',
              isPremium: true,
              requiresSubscription: true
            });
          }
          
          // Check if user has an active subscription
          if (!user.planActive) {
            console.log(`User ${user.email} does not have an active subscription`);
            return res.status(403).json({
              message: 'Active subscription required to download premium content',
              isPremium: true,
              requiresSubscription: true
            });
          }
          
          // Check if plan is active but expired
          if (user.planExpiresAt) {
            const now = new Date();
            if (new Date(user.planExpiresAt) < now) {
              console.log(`User ${user.email} subscription has expired`);
              // Update the user record
              user.planActive = false;
              await user.save();
              
              return res.status(403).json({
                message: 'Your subscription has expired',
                isPremium: true,
                requiresSubscription: true
              });
            }
          }
          
          // FIXED: Remove the pro plan check - Allow any active subscription to download premium content
          // The following check was preventing users with basic plans from downloading premium content
          // if (user.planType !== 'pro') {
          //   console.log(`User ${user.email} does not have Pro plan access`);
          //   return res.status(403).json({
          //     message: 'Pro plan subscription required for this content',
          //     isPremium: true,
          //     requiresSubscription: true,
          //     requiresProPlan: true
          //   });
          // }
          
          console.log(`Subscription verified for user: ${user.email} with plan type: ${user.planType}`);
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          return res.status(401).json({
            message: 'Invalid or expired authentication token',
            isPremium: true,
            requiresSubscription: true
          });
        }
      }
    }
    
    // Increment download count if this is a direct access (not already counted)
    // and it's a download request
    if (isDownload && !isCounted) {
      console.log(`Incrementing download count for book: ${book.title}`);
      book.downloads = (book.downloads || 0) + 1;
      await book.save();
    }
    
    // Determine the PDF URL
    let pdfUrl = book.customURLPDF;
    if (!pdfUrl && book.pdfUrl) {
      pdfUrl = book.pdfUrl;
    }
    
    if (!pdfUrl) {
      console.log(`No PDF URL found for book: ${book.title}`);
      return res.status(404).json({ message: 'PDF not available for this book' });
    }
    
    console.log(`Serving PDF from URL: ${pdfUrl}`);
    
    // Set the appropriate headers for either viewing or downloading
    res.setHeader('Content-Type', 'application/pdf');
    
    if (isDownload) {
      // Create a sanitized filename from the book title
      const sanitizedTitle = book.title.replace(/[^a-zA-Z0-9]/g, '_');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    
    // Check if the PDF URL is remote or local
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      // For remote URLs, proxy the request
      try {
        const pdfResponse = await axios.get(pdfUrl, { responseType: 'stream' });
        pdfResponse.data.pipe(res);
      } catch (proxyError) {
        console.error(`Error proxying PDF from ${pdfUrl}:`, proxyError);
        return res.status(500).json({ message: 'Error retrieving PDF from remote server' });
      }
    } else {
      // For local files, stream from the filesystem
      try {
        // Ensure the path is resolved to prevent directory traversal attacks
        const pdfPath = path.resolve(__dirname, '..', pdfUrl.replace(/^\//, ''));
        
        // Check if the file exists
        if (!fs.existsSync(pdfPath)) {
          console.error(`PDF file not found at path: ${pdfPath}`);
          return res.status(404).json({ message: 'PDF file not found on server' });
        }
        
        const fileStream = fs.createReadStream(pdfPath);
        fileStream.pipe(res);
      } catch (fsError) {
        console.error('Error streaming PDF from filesystem:', fsError);
        return res.status(500).json({ message: 'Error reading PDF file from server' });
      }
    }
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ message: 'Error serving PDF file' });
  }
};

// Function to serve PDF content directly
exports.servePdfContent = async (req, res) => {
  try {
    // Redirect to the main servePdf function with the same parameters
    return exports.servePdf(req, res);
  } catch (error) {
    console.error('Error serving PDF content:', error);
    res.status(500).json({ message: 'Error serving PDF content' });
  }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private/Admin
const createBook = asyncHandler(async (req, res) => {
  try {
    const { 
      title, 
      author, 
      description, 
      category, 
      tags, 
      pdfUrl, 
      pdfId, 
      coverImage,
      pageSize,
      fileSizeMB,
      isPremium,
      price,
      isCustomUrl,
      customURLPDF
    } = req.body;

    // Validation - required fields
    if (!title || !author || !description || !category) {
      res.status(400);
      throw new Error('Please add all required fields: title, author, description, category');
    }

    // Create the book with provided data
    const book = await Book.create({
      title,
      author,
      description,
      category,
      tags: tags || [],
      pdfUrl,
      pdfId,
      coverImage,
      pageSize: pageSize || 0,
      fileSizeMB: fileSizeMB || 0,
      isPremium: isPremium || false,
      price: price || 0,
      isCustomUrl: isCustomUrl || false,
      customURLPDF: customURLPDF || '',
      views: 0,
      downloads: 0
    });

    if (book) {
      res.status(201).json({
        success: true,
        book
      });
    } else {
      res.status(400);
      throw new Error('Invalid book data');
    }
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating book', 
      error: error.message 
    });
  }
});

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin
const updateBook = asyncHandler(async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Update book with new data
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      book: updatedBook
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating book', 
      error: error.message 
    });
  }
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
const deleteBook = asyncHandler(async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting book', 
      error: error.message 
    });
  }
});

module.exports = {
  getBooks,
  getCategories,
  getTags,
  getBook,
  incrementDownloads,
  servePdf: exports.servePdf,
  servePdfContent: exports.servePdfContent,
  createBook,
  updateBook,
  deleteBook
}; 