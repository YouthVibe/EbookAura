/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Test script to verify model functionality
 * Run with: node utils/testModels.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for testing'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Test Book model functionality
async function testBookModel() {
  console.log('Testing Book model...');
  
  try {
    // Check if the Book model file exists
    const bookModelPath = path.join(__dirname, '../models/Book.js');
    if (fs.existsSync(bookModelPath)) {
      console.log(`Book.js model file exists at: ${bookModelPath}`);
      
      // Read the file content
      const content = fs.readFileSync(bookModelPath, 'utf8');
      console.log(`\nFile size: ${content.length} bytes`);
      console.log(`First 100 chars: ${content.substring(0, 100)}...`);
      console.log(`Last 100 chars: ...${content.substring(content.length - 100)}`);
    } else {
      console.error('❌ Book.js model file does not exist!');
    }
    
    // Try importing the model
    console.log('\nTrying to import the Book model...');
    try {
      // Force re-loading the module
      delete require.cache[require.resolve('../models/Book')];
      const Book = require('../models/Book');
      
      console.log('✅ Successfully imported Book model');
      console.log('Book type:', typeof Book);
      console.log('Book constructor?', typeof Book === 'function');
      console.log('Book instanceof?', Book instanceof Function);
      
      // Check for expected model properties
      const modelProps = ['modelName', 'schema', 'collection', 'create', 'find'];
      for (const prop of modelProps) {
        console.log(`Has '${prop}' property:`, Boolean(Book[prop]));
      }
      
      // Try using the Book model for basic operations
      if (typeof Book === 'function') {
        // Test creating a sample document
        console.log('\nTrying to create a Book instance...');
        try {
          const sampleBook = new Book({
            title: 'Test Book',
            author: 'Test Author',
            description: 'Test description',
            coverImage: 'http://example.com/cover.jpg',
            coverImageId: 'test_cover_123',
            pdfUrl: 'http://example.com/book.pdf',
            pdfId: 'test_pdf_123',
            pageSize: 100,
            category: 'Test',
            uploadedBy: new mongoose.Types.ObjectId()
          });
          
          console.log('✅ Successfully created Book instance');
          console.log('Book instance type:', typeof sampleBook);
          console.log('Is Mongoose Document?', sampleBook instanceof mongoose.Document);
          
          // Don't save it, we don't want to modify the database
        } catch (err) {
          console.error('❌ Failed to create Book instance:', err);
        }
      }
    } catch (err) {
      console.error('❌ Failed to import Book model:', err);
    }
    
    // Check if other models can be loaded
    console.log('\nChecking if other models can be loaded...');
    try {
      const User = require('../models/User');
      console.log('✅ Successfully imported User model');
    } catch (err) {
      console.error('❌ Failed to import User model:', err);
    }
    
    console.log('\nAll tests completed!');
  } catch (err) {
    console.error('Error testing Book model:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the tests
testBookModel(); 