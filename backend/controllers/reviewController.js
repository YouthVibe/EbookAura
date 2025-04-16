const Review = require('../models/Review');
const Book = require('../models/Book');

// @desc    Get all reviews for a specific book
// @route   GET /api/books/:bookId/reviews
// @access  Public
const getBookReviews = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    
    console.log(`Getting reviews for book ID: ${bookId}`);
    
    if (!bookId) {
      return res.status(404).json({ message: 'Book ID is required' });
    }
    
    const reviews = await Review.find({ book: bookId })
      .populate('user', 'username name profileImage')
      .sort({ createdAt: -1 });

    console.log(`Found ${reviews.length} reviews`);

    // Format the response to include necessary information
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.text,
      createdAt: review.createdAt,
      userName: review.user ? (review.user.name || review.user.username) : 'Anonymous',
      userImage: review.user ? review.user.profileImage : null
    }));

    res.status(200).json(formattedReviews);
  } catch (error) {
    console.error('Error fetching book reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get average rating for a specific book
// @route   GET /api/books/:bookId/rating
// @access  Public
const getBookRating = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    
    console.log(`Getting rating for book ID: ${bookId}`);
    
    if (!bookId) {
      return res.status(404).json({ message: 'Book ID is required' });
    }
    
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const reviews = await Review.find({ book: bookId });
    
    console.log(`Found ${reviews.length} reviews for rating calculation`);
    
    let averageRating = 0;
    let reviewCount = 0;
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
      reviewCount = reviews.length;
    }

    res.status(200).json({ 
      averageRating, 
      reviewCount,
      ratingDistribution: {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length
      }
    });
  } catch (error) {
    console.error('Error fetching book rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new review for a book
// @route   POST /api/books/:bookId/reviews
// @access  Private
const createBookReview = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;
    const { rating, comment = '' } = req.body;

    console.log(`Creating review for book ID: ${bookId} by user ID: ${userId}`);
    console.log(`Rating: ${rating}, Comment length: ${comment ? comment.length : 0}`);

    if (!bookId) {
      return res.status(404).json({ message: 'Book ID is required' });
    }

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Comment is optional, but if provided, must be under 200 characters
    if (comment && comment.length > 200) {
      return res.status(400).json({ message: 'Review text must be under 200 characters' });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user has already reviewed this book
    const existingReview = await Review.findOne({ user: userId, book: bookId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }

    // Create new review
    const review = new Review({
      user: userId,
      book: bookId,
      rating,
      text: comment
    });

    await review.save();
    console.log(`Review saved with ID: ${review._id}`);

    // Update book's average rating
    const allReviews = await Review.find({ book: bookId });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    book.averageRating = totalRating / allReviews.length;
    await book.save();
    console.log(`Updated book average rating to: ${book.averageRating}`);

    // Get user info to return
    const user = await require('../models/User').findById(userId).select('username name profileImage');
    
    // Return formatted review
    const formattedReview = {
      _id: review._id,
      rating: review.rating,
      comment: review.text,
      createdAt: review.createdAt,
      userName: user ? (user.name || user.username) : 'Anonymous',
      userImage: user ? user.profileImage : null
    };

    res.status(201).json(formattedReview);
  } catch (error) {
    console.error('Error creating book review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all reviews for a specific user
// @route   GET /api/reviews/user
// @access  Private
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a specific review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the review belongs to the user
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Update the book's average rating
    const book = await Book.findById(review.book);
    if (book) {
      const allReviews = await Review.find({ book: book._id });
      
      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        book.averageRating = totalRating / allReviews.length;
      } else {
        book.averageRating = 0;
      }
      
      await book.save();
    }

    // Use deleteOne() method which works in newer Mongoose versions
    // Fall back to remove() for backward compatibility
    if (typeof review.deleteOne === 'function') {
      await review.deleteOne();
    } else if (typeof review.remove === 'function') {
      await review.remove();
    } else {
      await Review.deleteOne({ _id: review._id });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete all reviews for a user
// @route   DELETE /api/reviews/user/all
// @access  Private
const deleteAllUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id });

    // Update books' average ratings
    for (const review of reviews) {
      const book = await Book.findById(review.book);
      if (book) {
        const remainingReviews = await Review.find({ 
          book: book._id,
          _id: { $ne: review._id }
        });
        
        if (remainingReviews.length > 0) {
          const totalRating = remainingReviews.reduce((sum, review) => sum + review.rating, 0);
          book.averageRating = totalRating / remainingReviews.length;
        } else {
          book.averageRating = 0;
        }
        
        await book.save();
      }
    }

    await Review.deleteMany({ user: req.user._id });

    res.status(200).json({ message: 'All reviews deleted successfully' });
  } catch (error) {
    console.error('Error deleting all reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserReviews,
  deleteReview,
  deleteAllUserReviews,
  getBookReviews,
  getBookRating,
  createBookReview
}; 