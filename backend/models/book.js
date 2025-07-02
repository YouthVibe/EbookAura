/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const mongoose = require('mongoose');

// Helper function to normalize MongoDB Extended JSON values
function normalizeMongoNumber(value) {
  if (!value) return value;
  
  // Handle Extended JSON format
  if (typeof value === 'object') {
    if ('$numberInt' in value) return Number(value.$numberInt);
    if ('$numberDouble' in value) return Number(value.$numberDouble);
    if ('$numberDecimal' in value) return Number(value.$numberDecimal);
    if ('$numberLong' in value) return Number(value.$numberLong);
  }
  
  // Handle string numbers
  if (typeof value === 'string') {
    return Number(value);
  }
  
  return value;
}

// Custom Schema Type for handling MongoDB Extended JSON numbers
class ExtendedNumber extends mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, 'ExtendedNumber');
  }

  cast(val) {
    const normalized = normalizeMongoNumber(val);
    if (Number.isNaN(normalized)) {
      throw new Error('ExtendedNumber: could not convert ' + JSON.stringify(val) + ' to number');
    }
    return normalized;
  }
}

mongoose.Schema.Types.ExtendedNumber = ExtendedNumber;

// Define the schema
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100 // Title should be under 100 characters
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 200 // Description should be under 200 characters
  },
  coverImage: {
    type: String,
    required: true
  },
  coverImageId: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  pdfId: {
    type: String,
    required: true
  },
  // New fields for custom URL PDF upload
  isCustomUrl: {
    type: Boolean,
    default: false
  },
  customURLPDF: {
    type: String,
    default: ''
  },
  // New field for premium PDF status
  isPremium: {
    type: Boolean,
    default: false
  },
  // Price in coins for premium books
  price: {
    type: ExtendedNumber,
    default: 0,
    get: v => Math.round(v)
  },
  pageSize: {
    type: ExtendedNumber,
    required: true,
    get: v => Math.round(v)
  },
  fileSizeMB: {
    type: ExtendedNumber,
    default: 0,
    get: v => Math.round(v)
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  averageRating: {
    type: ExtendedNumber,
    default: 0,
    get: v => Math.round(v)
  },
  views: {
    type: ExtendedNumber,
    default: 0,
    get: v => Math.round(v)
  },
  downloads: {
    type: ExtendedNumber,
    default: 0,
    get: v => Math.round(v)
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true }
});

// Add any hooks or virtuals if needed in the future
bookSchema.pre('save', function(next) {
  next();
});

// Create the model from the schema
const Book = mongoose.model('Book', bookSchema);

// Export the model
module.exports = Book;