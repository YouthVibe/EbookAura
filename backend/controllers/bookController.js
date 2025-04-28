const Book = require('../models/Book');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

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
        // Check if the book ID exists in the user's purchased books array
        const hasPurchased = user.purchasedBooks && user.purchasedBooks.some(id => 
          id.toString() === book._id.toString()
        );
        
        // Check if user has Pro plan access (set by the checkProPlanBookAccess middleware)
        const hasProAccess = req.user.hasProAccess === true;
        
        // User has access if they purchased the book OR they have Pro plan access
        bookData.userHasAccess = hasPurchased || hasProAccess;
        
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
    }
  } else {
    // No authenticated user
    bookData.userHasAccess = false;
  }
  
  // Log transformed book data for debugging
  console.log(`Transformed book data for ${book.title}:`);
  console.log(`- isPremium = ${bookData.isPremium} (${typeof bookData.isPremium})`);
  console.log(`- price = ${bookData.price} (${typeof bookData.price})`);
  console.log(`- userHasAccess = ${bookData.userHasAccess}`);
  
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

module.exports = {
  getBooks,
  getCategories,
  getTags,
  getBook,
  incrementDownloads
}; 