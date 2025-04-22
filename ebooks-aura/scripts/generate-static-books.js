/**
 * Script to generate a list of all book IDs from the API
 * This is useful for static exports where we need to pre-render all book pages
 * 
 * Run this script with:
 * node scripts/generate-static-books.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const OUTPUT_FILE = path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js');

// Known important book IDs that must be included
// Add any book IDs that are causing issues or are critical to the site
const CRITICAL_BOOK_IDS = [
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3',
  '6807c9d24fb1873f72080fb1', // Added the missing book ID
];

// Function to fetch all books from the API
async function fetchAllBooks() {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}/books?limit=500`; // Fetch up to 500 books
    console.log(`Fetching books from: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`API returned status code ${res.statusCode}`));
          }
          
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });
  });
}

// Function to extract book IDs from the API response
function extractBookIds(data) {
  let bookIds = [];
  
  if (Array.isArray(data)) {
    bookIds = data.map(book => String(book._id || book.id));
  } else if (data.books && Array.isArray(data.books)) {
    bookIds = data.books.map(book => String(book._id || book.id));
  }
  
  return bookIds;
}

// Function to generate the STATIC_BOOKS.js file
function generateStaticBooksFile(bookIds) {
  // Ensure all critical book IDs are included
  const uniqueBookIds = new Set(bookIds);
  
  // Add any missing critical IDs
  CRITICAL_BOOK_IDS.forEach(id => {
    if (!uniqueBookIds.has(id)) {
      uniqueBookIds.add(id);
      console.log(`Added critical book ID that was missing from API: ${id}`);
    }
  });
  
  // Convert back to array
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
  
  // Additional book IDs from the API
${finalBookIds.filter(id => !CRITICAL_BOOK_IDS.includes(id)).map(id => `  '${id}',`).join('\n')}
];

export default STATIC_BOOKS;`;

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`Generated STATIC_BOOKS.js with ${finalBookIds.length} book IDs`);
}

// Main function
async function main() {
  try {
    console.log('Fetching books from the API...');
    let bookIds = [];
    
    try {
      const data = await fetchAllBooks();
      bookIds = extractBookIds(data);
      
      if (bookIds.length === 0) {
        console.warn('Warning: No book IDs found from API. Using critical IDs as fallback.');
        bookIds = [...CRITICAL_BOOK_IDS];
      } else {
        console.log(`Found ${bookIds.length} books from API`);
      }
    } catch (apiError) {
      console.warn(`Warning: Failed to fetch books from API: ${apiError.message}`);
      console.warn('Using critical IDs as fallback');
      bookIds = [...CRITICAL_BOOK_IDS];
    }
    
    // Always generate the file, even if we only have critical IDs
    generateStaticBooksFile(bookIds);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 