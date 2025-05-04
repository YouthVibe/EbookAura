/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const Bookmark = require('../models/Bookmark');
const Book = require('../models/Book');

// @desc    Get all bookmarks for a user
// @route   GET /api/users/bookmarks
// @access  Private
const getUserBookmarks = async (req, res) => {
  try {
    // Find bookmarks and populate with book data
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'book',
        select: 'title author description coverImage category views downloads averageRating'
      })
      .sort({ createdAt: -1 });

    // Format the response 
    const books = bookmarks.map(bookmark => bookmark.book);
    
    // Also send just the IDs for easy checking
    const bookmarkIds = bookmarks.map(bookmark => bookmark.book._id);

    res.status(200).json({
      success: true,
      count: bookmarks.length,
      books,
      bookmarks: bookmarkIds
    });
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Add or remove a bookmark
// @route   POST /api/users/bookmarks
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Book ID is required' 
      });
    }

    // Check if the book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }

    // Check if the bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      book: bookId
    });

    // If bookmark exists, remove it; otherwise, create it
    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      res.status(200).json({ 
        success: true, 
        message: 'Bookmark removed successfully',
        isBookmarked: false,
        bookId
      });
    } else {
      const newBookmark = new Bookmark({
        user: req.user._id,
        book: bookId
      });
      await newBookmark.save();
      res.status(201).json({ 
        success: true, 
        message: 'Book bookmarked successfully',
        isBookmarked: true,
        bookId
      });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Delete a bookmark by book ID
// @route   DELETE /api/users/bookmarks
// @access  Private
const deleteBookmark = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Book ID is required' 
      });
    }

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      book: bookId
    });

    if (!bookmark) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bookmark not found' 
      });
    }

    await Bookmark.findByIdAndDelete(bookmark._id);

    res.status(200).json({ 
      success: true, 
      message: 'Bookmark deleted successfully',
      bookId
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Delete all bookmarks for a user
// @route   DELETE /api/users/bookmarks/all
// @access  Private
const deleteAllUserBookmarks = async (req, res) => {
  try {
    await Bookmark.deleteMany({ user: req.user._id });

    res.status(200).json({ 
      success: true, 
      message: 'All bookmarks deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting all bookmarks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  getUserBookmarks,
  toggleBookmark,
  deleteBookmark,
  deleteAllUserBookmarks
}; 