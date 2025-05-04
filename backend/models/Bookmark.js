/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
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

// Create the model and export it
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark; 