/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Book'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: false,
    default: '',
    maxlength: 200
  }
}, {
  timestamps: true
});

// Ensure a user can only review a book once
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

// Create the model and export it
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review; 