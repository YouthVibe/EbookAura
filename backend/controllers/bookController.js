const Book = require('../models/Book');
const asyncHandler = require('express-async-handler');

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
    
    // Fetch books with pagination - ensure isPremium is explicitly included
    const books = await Book.find(query)
      .sort(sort ? buildSortOptions(sort) : { createdAt: -1 })
      .select('title author description category tags views downloads createdAt coverImage pageSize fileSizeMB averageRating isCustomUrl customURLPDF isPremium price')
      .skip(skip)
      .limit(limitCapped);
    
    // Debug logging for premium books
    const premiumBooks = books.filter(book => book.isPremium);
    console.log(`Found ${premiumBooks.length} premium books out of ${books.length} total books`);
    
    // Log detailed info for each premium book
    premiumBooks.forEach(book => {
      console.log(`Premium book found: ${book.title}`);
      console.log(` - isPremium: ${book.isPremium} (type: ${typeof book.isPremium})`);
      console.log(` - price: ${book.price} (type: ${typeof book.price})`);
      console.log(` - _id: ${book._id} (type: ${typeof book._id})`);
    });
    
    // Log a sample book to verify isPremium is included
    if (books.length > 0) {
      console.log(`Sample book premium status: ${books[0].title} - isPremium: ${books[0].isPremium} (type: ${typeof books[0].isPremium})`);
      console.log(`Sample book data structure: ${JSON.stringify(books[0], null, 2).substring(0, 300)}...`);
      if (books[0].isPremium) {
        console.log(`Sample book price: ${books[0].price} coins (type: ${typeof books[0].price})`);
      }
    }
      
    // Transform book objects to ensure consistent formats
    const transformedBooks = books.map(book => {
      const bookObj = book.toObject();
      return {
        ...bookObj,
        isPremium: bookObj.isPremium === true, // Force boolean
        price: bookObj.price ? Number(bookObj.price) : 0 // Force number or default to 0
      };
    });
    
    // Send response with pagination metadata and ensure isPremium is properly passed
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
  const book = await Book.findById(req.params.id)
    .select('title author description category tags views downloads createdAt pdfUrl pdfId coverImage pageSize fileSizeMB averageRating isCustomUrl customURLPDF isPremium price');
    
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
  bookData.isPremium = book.isPremium === true;
  bookData.price = book.price ? Number(book.price) : 0;
  
  // Additional safeguards to ensure premium books are correctly identified
  // For premium books with price but no isPremium flag
  if (!bookData.isPremium && bookData.price > 0) {
    bookData.isPremium = true;
    console.log(`Setting isPremium=true for book with price ${bookData.price}`);
  }
  
  // Force these to be proper JavaScript primitive types
  bookData.views = Number(book.views);
  bookData.downloads = Number(book.downloads);
  bookData.averageRating = Number(book.averageRating || 0);
  bookData.pageSize = Number(book.pageSize || 0);
  bookData.fileSizeMB = Number(book.fileSizeMB || 0);
  
  // Debug output of processed book data with explicit type information
  console.log(`Processed book data for ${book.title}:`);
  console.log(`- isPremium = ${bookData.isPremium} (${typeof bookData.isPremium})`);
  console.log(`- price = ${bookData.price} (${typeof bookData.price})`);
  
  // Check if the user has purchased this book (if authenticated and book is premium)
  if (req.user && bookData.isPremium) {
    const hasAccess = req.user.purchasedBooks && req.user.purchasedBooks.some(
      purchasedId => purchasedId.toString() === book._id.toString()
    );
    bookData.userHasAccess = hasAccess;
    console.log(`User ${req.user._id} has access to premium book ${book._id}: ${hasAccess}`);
  } else {
    bookData.userHasAccess = !bookData.isPremium; // Non-premium books are always accessible
  }
  
  res.json(bookData);
});

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

module.exports = {
  getBooks,
  getCategories,
  getTags,
  getBook,
  incrementDownloads
}; 