const mongoose = require('mongoose');

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
  pageSize: {
    type: Number,
    required: true
  },
  fileSizeMB: {
    type: Number,
    default: 0 // Default to 0 if not provided
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

// Create the model from the schema
const Book = mongoose.model('Book', bookSchema);

// Export the model
module.exports = Book;