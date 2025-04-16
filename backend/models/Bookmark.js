const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Book'
  }
}, {
  timestamps: true
});

// Ensure a user can only bookmark a book once
bookmarkSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema); 