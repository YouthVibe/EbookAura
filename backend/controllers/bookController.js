const Book = require('../models/Book');
const asyncHandler = require('express-async-handler');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = asyncHandler(async (req, res) => {
  const { category, tag, search, sort } = req.query;
  
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
  
  // Add search filter if provided
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Build sort options
  let sortOptions = {};
  if (sort) {
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
        sortOptions.createdAt = -1;
    }
  } else {
    sortOptions.createdAt = -1; // Default sort by newest
  }
  
  const books = await Book.find(query)
    .sort(sortOptions)
    .select('title author description category tags views downloads createdAt coverImage pageSize fileSizeMB averageRating');
    
  res.json(books);
});

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
    .select('title author description category tags views downloads createdAt pdfUrl pdfId coverImage pageSize fileSizeMB averageRating');
    
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  
  // Increment views
  book.views += 1;
  await book.save();
  
  res.json(book);
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