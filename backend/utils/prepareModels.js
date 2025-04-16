/**
 * Utility script to prepare model files for deployment
 * This script ensures the Book model is available regardless of case sensitivity
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Preparing model files for deployment...');

const modelsDir = path.join(__dirname, '../models');
const bookUppercasePath = path.join(modelsDir, 'Book.js');
const bookLowercasePath = path.join(modelsDir, 'book.js');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  console.log('Creating models directory...');
  fs.mkdirSync(modelsDir, { recursive: true });
}

// The Book model content
const bookModelContent = `const mongoose = require('mongoose');

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
  pageSize: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create a model from the schema
const Book = mongoose.model('Book', bookSchema);

// Export the model
module.exports = Book;`;

// First, check if Book.js exists
if (fs.existsSync(bookUppercasePath)) {
  console.log('✅ Book.js found!');
} 
// If not, check if book.js exists
else if (fs.existsSync(bookLowercasePath)) {
  console.log('Found book.js (lowercase), creating Book.js (uppercase)...');
  try {
    // Copy lowercase file to uppercase
    fs.copyFileSync(bookLowercasePath, bookUppercasePath);
    console.log('✅ Successfully created Book.js from book.js');
  } catch (error) {
    console.error('❌ Error copying book.js to Book.js:', error);
    
    // If copy fails, create Book.js directly
    try {
      console.log('Attempting to create Book.js directly...');
      fs.writeFileSync(bookUppercasePath, bookModelContent, 'utf8');
      console.log('✅ Successfully created Book.js from template');
    } catch (writeError) {
      console.error('❌ Critical error creating Book.js:', writeError);
    }
  }
} 
// If neither exists, create both
else {
  console.log('Neither Book.js nor book.js exists. Creating Book.js...');
  try {
    fs.writeFileSync(bookUppercasePath, bookModelContent, 'utf8');
    console.log('✅ Successfully created Book.js');
  } catch (error) {
    console.error('❌ Error creating Book.js:', error);
  }
}

console.log('✨ Model preparation complete!'); 