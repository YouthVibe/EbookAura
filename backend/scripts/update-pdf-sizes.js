/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to update existing books with file size information
 * Run with node scripts/update-pdf-sizes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Book = require('../models/Book');

// Constants
const MONGO_URI = process.env.MONGO_URI;
const DEFAULT_BATCH_SIZE = 10; // Process 10 books at a time

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

/**
 * Fetch PDF file size via HEAD request
 * @param {string} url - PDF URL
 * @returns {Promise<number>} - File size in MB
 */
async function fetchPdfSizeFromUrl(url) {
  try {
    // Ensure URL ends with .pdf
    if (!url.endsWith('.pdf')) {
      url = `${url}.pdf`;
    }

    console.log(`Fetching size for: ${url}`);
    const response = await axios.head(url);
    
    if (response.headers['content-length']) {
      const sizeInBytes = parseInt(response.headers['content-length'], 10);
      const sizeInMB = parseFloat((sizeInBytes / (1024 * 1024)).toFixed(2));
      return sizeInMB;
    } else {
      console.warn(`No content-length header found for ${url}`);
      
      // Try to get the file via GET and check the size
      console.log(`Trying GET request for: ${url}`);
      const getResponse = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout
      });
      
      const sizeInBytes = getResponse.data.length;
      const sizeInMB = parseFloat((sizeInBytes / (1024 * 1024)).toFixed(2));
      return sizeInMB;
    }
  } catch (error) {
    console.error(`Error fetching PDF size for ${url}:`, error.message);
    return 0; // Default to 0 if we can't determine size
  }
}

/**
 * Update PDF sizes for a batch of books
 * @param {Array} books - Array of book documents
 */
async function updatePdfSizes(books) {
  console.log(`Processing ${books.length} books...`);
  
  for (const book of books) {
    try {
      // Skip if already has file size
      if (book.fileSizeMB && book.fileSizeMB > 0) {
        console.log(`Book ${book._id} already has file size: ${book.fileSizeMB} MB`);
        continue;
      }
      
      console.log(`Updating file size for book: ${book.title} (${book._id})`);
      
      // Get file size
      const fileSizeMB = await fetchPdfSizeFromUrl(book.pdfUrl);
      
      if (fileSizeMB > 0) {
        // Update book with file size
        book.fileSizeMB = fileSizeMB;
        await book.save();
        console.log(`Updated ${book.title} with file size: ${fileSizeMB} MB`);
      } else {
        console.warn(`Could not determine file size for book: ${book.title}`);
      }
    } catch (err) {
      console.error(`Error updating book ${book._id}:`, err.message);
    }
  }
}

/**
 * Main function to update all books with missing file sizes
 */
async function updateAllPdfSizes() {
  try {
    // Get total count
    const totalBooks = await Book.countDocuments({ $or: [{ fileSizeMB: { $exists: false } }, { fileSizeMB: 0 }] });
    console.log(`Found ${totalBooks} books that need file size updates`);
    
    if (totalBooks === 0) {
      console.log('No books need updating');
      process.exit(0);
    }
    
    // Process in batches
    const batchSize = DEFAULT_BATCH_SIZE;
    let processedCount = 0;
    
    // Continue in batches until all processed
    while (processedCount < totalBooks) {
      const books = await Book.find({ $or: [{ fileSizeMB: { $exists: false } }, { fileSizeMB: 0 }] })
        .limit(batchSize);
      
      await updatePdfSizes(books);
      
      processedCount += books.length;
      console.log(`Progress: ${processedCount}/${totalBooks} books processed`);
    }
    
    console.log('All books updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error in update process:', error);
    process.exit(1);
  }
}

// IIFE to allow async/await at the top level
(async () => {
  console.log('=== PDF File Size Update Script ===');
  console.log('Updating books with missing file size information...');
  
  try {
    await updateAllPdfSizes();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
})(); 