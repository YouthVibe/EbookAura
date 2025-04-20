/**
 * Script to update a specific book with given information
 * Run with node scripts/update-specific-book.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

// Constants
const MONGO_URI = process.env.MONGO_URI;
const BOOK_ID = '6804b6d03fe6058b5b3dd4a8';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Book data from JSON
const bookData = {
  "_id": {"$oid": "6804b6d03fe6058b5b3dd4a8"},
  "title": "Class 12 HSC Chemistry 2025-26",
  "author": "Maharashtra State Bureau of Textbook Production and Curriculum Research, Pune.",
  "description": "The Maharashtra State Bureau of Textbook Production\r\nand Curriculum Research reserves all rights relating to\r\nthe book.",
  "coverImage": "https://res.cloudinary.com/dn0r4gcig/image/upload/v1745082517/ebook_aura/covers/e8eummvkxmezad7rx3tu.jpg",
  "coverImageId": "ebook_aura/covers/e8eummvkxmezad7rx3tu",
  "pdfUrl": "https://res.cloudinary.com/dn0r4gcig/raw/upload/v1745082524/ebook_aura/pdfs/Class_12_HSC_Chemistry_2025_26_1745082517152",
  "pdfId": "ebook_aura/pdfs/Class_12_HSC_Chemistry_2025_26_1745082517152",
  "pageSize": {"$numberInt": "362"},
  "category": "Chemistry",
  "tags": ["Chemistry", "HSC", "Class 12 HSC"],
  "averageRating": {"$numberInt": "5"},
  "views": {"$numberInt": "18"},
  "downloads": {"$numberInt": "0"},
  "uploadedBy": {"$oid": "67fe90c67420afcf47105e32"},
  "createdAt": {"$date": {"$numberLong": "1745082524046"}},
  "updatedAt": {"$date": {"$numberLong": "1745083621576"}},
  "__v": {"$numberInt": "0"}
};

/**
 * Calculate file size in MB from file URL
 * @param {string} url - File URL
 * @returns {Promise<number>} - Size in MB
 */
async function estimateFileSize(url) {
  try {
    // You can implement actual file size calculation here
    // For now, we'll use a static value based on page count
    // This is just an estimation - 0.5MB per page is a rough estimate
    const pageCount = 362; // From the data
    const estimatedSize = parseFloat((pageCount * 0.05).toFixed(2)); // Rough estimate
    return estimatedSize;
  } catch (error) {
    console.error('Error estimating file size:', error);
    return 15; // Fallback size estimate for a 362-page document
  }
}

/**
 * Update the specific book with the given ID
 */
async function updateSpecificBook() {
  try {
    // Find the book
    const book = await Book.findById(BOOK_ID);
    
    if (!book) {
      console.error(`Book with ID ${BOOK_ID} not found`);
      process.exit(1);
    }
    
    console.log(`Updating book: ${book.title}`);
    
    // Estimate file size if not present
    let fileSizeMB = book.fileSizeMB;
    if (!fileSizeMB || fileSizeMB === 0) {
      fileSizeMB = await estimateFileSize(book.pdfUrl);
      console.log(`Estimated file size: ${fileSizeMB} MB`);
    }
    
    // Update the book
    book.pageSize = parseInt(bookData.pageSize.$numberInt, 10);
    book.fileSizeMB = fileSizeMB;
    
    // Save the updated book
    await book.save();
    
    console.log(`Book updated successfully. Pages: ${book.pageSize}, Size: ${book.fileSizeMB}MB`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating book:', error);
    process.exit(1);
  }
}

// Run the update function
(async () => {
  console.log(`=== Updating Specific Book (ID: ${BOOK_ID}) ===`);
  
  try {
    await updateSpecificBook();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
})(); 