/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to generate a list of all book IDs directly from the local MongoDB database
 * This is useful for static exports where we need to pre-render all book pages
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017/test';

// Define the output file location
const outputPaths = [
  path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js'),
  path.join(__dirname, '../src/utils/STATIC_BOOKS.js'),
  path.join(__dirname, '../utils/STATIC_BOOKS.js')
];

// Known critical book IDs
const CRITICAL_BOOK_IDS = [
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3',
  '6807c9d24fb1873f72080fb1',
  '681859bd560ce1fd792c2745',
];

// Function to check which path is valid in the project structure
function getValidOutputPath() {
  // Check the src/app/utils directory first (Next.js 13+ App Router)
  if (fs.existsSync(path.dirname(outputPaths[0]))) {
    return outputPaths[0];
  }
  
  // Check the src/utils directory next (Next.js Pages Router)
  if (fs.existsSync(path.dirname(outputPaths[1]))) {
    return outputPaths[1];
  }
  
  // Fallback to utils in the root directory
  return outputPaths[2];
}

const OUTPUT_FILE = getValidOutputPath();

// Function to generate the STATIC_BOOKS.js file
function generateStaticBooksFile(bookIds) {
  const uniqueBookIds = new Set(bookIds);
  
  // Add any missing critical IDs
  CRITICAL_BOOK_IDS.forEach(id => {
    if (!uniqueBookIds.has(id)) {
      uniqueBookIds.add(id);
      console.log(`Added critical book ID that was missing from database: ${id}`);
    }
  });
  
  const finalBookIds = Array.from(uniqueBookIds);
  
  const fileContent = `/**
 * This file contains a list of all book IDs for static generation
 * Generated on: ${new Date().toISOString()}
 * Total books: ${finalBookIds.length}
 * 
 * For static exports, we must pre-render ALL book pages that users might access
 */

const STATIC_BOOKS = [
  // Critical book IDs that must always be included
${CRITICAL_BOOK_IDS.map(id => `  '${id}',  // Critical book ID`).join('\n')}
  
  // Additional book IDs from the database
${finalBookIds.filter(id => !CRITICAL_BOOK_IDS.includes(id)).map(id => `  '${id}',`).join('\n')}
];

export default STATIC_BOOKS;`;

  const dirname = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
    console.log(`Created directory: ${dirname}`);
  }

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`Generated STATIC_BOOKS.js with ${finalBookIds.length} book IDs`);
  console.log(`File location: ${OUTPUT_FILE}`);
  
  // Log the first 5 IDs for verification
  console.log('\nSample of book IDs included:');
  finalBookIds.slice(0, 5).forEach(id => console.log(`- ${id}`));
}

// Main function
async function main() {
  try {
    console.log('Connecting to local MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB, fetching book IDs...');
    
    const books = await mongoose.connection.db.collection('books').find({}, { projection: { _id: 1 } }).toArray();
    
    if (books.length === 0) {
      console.warn('Warning: No books found in database. Using critical IDs as fallback.');
      generateStaticBooksFile(CRITICAL_BOOK_IDS);
    } else {
      console.log(`Found ${books.length} books in the database`);
      const bookIds = books.map(book => book._id.toString());
      generateStaticBooksFile(bookIds);
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
