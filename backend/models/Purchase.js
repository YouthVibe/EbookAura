const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  // Store the book details at time of purchase
  bookDetails: {
    title: String,
    author: String,
    coverImage: String
  },
  // Transaction information
  transactionId: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  // User balance before and after
  balanceBefore: {
    type: Number
  },
  balanceAfter: {
    type: Number
  }
}, {
  timestamps: true
});

// Add a compound index to ensure each user can only purchase a book once
purchaseSchema.index({ user: 1, book: 1 }, { unique: true });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase; 