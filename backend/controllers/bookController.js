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
      .select('title author description category tags views downloads createdAt coverImage pageSize fileSizeMB averageRating isCustomUrl customURLPDF isPremium')
      .skip(skip)
      .limit(limitCapped);
    
    // Log a sample book to verify isPremium is included
    if (books.length > 0) {
      console.log(`Sample book premium status: ${books[0].title} - isPremium: ${books[0].isPremium}`);
    }
      
    // Send response with pagination metadata and ensure isPremium is properly passed
    res.json({
      books: books.map(book => ({
        ...book.toObject(),
        isPremium: book.isPremium || false // Explicitly set isPremium if undefined
      })),
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
    .select('title author description category tags views downloads createdAt pdfUrl pdfId coverImage pageSize fileSizeMB averageRating isCustomUrl customURLPDF isPremium');
    
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
  
  // Log premium status
  console.log(`Book premium status: ${book.title}, isPremium: ${book.isPremium}`);
  
  // Convert book to JSON and ensure isPremium is properly set
  const bookData = book.toObject();
  bookData.isPremium = book.isPremium === true;
  
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