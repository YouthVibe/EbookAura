const User = require('../models/User');
const Book = require('../models/Book');
const Review = require('../models/Review');
const Bookmark = require('../models/Bookmark');
const mongoose = require('mongoose');

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
    
    // Start a session for transaction
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
      
      res.status(200).json({ message: 'Book deleted successfully', bookId });
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

module.exports = {
  getAllUsers,
  toggleUserBan,
  deleteUser,
  getAllBooks,
  deleteBook
}; 