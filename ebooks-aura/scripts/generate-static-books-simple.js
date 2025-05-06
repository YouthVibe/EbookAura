/**
 * Simplified script to generate a list of all book IDs
 * This version doesn't require MongoDB connection and directly uses the API or hardcoded IDs
 * 
 * Run this script with:
 * node scripts/generate-static-books-simple.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// API URL for fetching books
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ebookaura.onrender.com/api';

// Define the output file location with multiple fallbacks to ensure it works
const outputPaths = [
  path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js'),
  path.join(__dirname, '../src/utils/STATIC_BOOKS.js'),
  path.join(__dirname, '../utils/STATIC_BOOKS.js')
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

// Critical book IDs that MUST be included
const CRITICAL_BOOK_IDS = [
  '681859bd560ce1fd792c2745', // The problematic ID that was missing
  '6807c9d24fb1873f72080fb1',
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3',
  // Add any other critical IDs here
];

// Function to fetch books from the API
async function fetchBookIdsFromAPI() {
  return new Promise((resolve, reject) => {
    console.log(`Fetching books from API: ${API_URL}/books?limit=500`);
    
    // Determine if we need http or https
    const httpModule = API_URL.startsWith('https') ? https : http;
    
    const req = httpModule.get(`${API_URL}/books?limit=500`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.warn(`API returned status code ${res.statusCode}`);
            resolve([]); // Return empty array, we'll use critical IDs as fallback
            return;
          }
          
          const parsedData = JSON.parse(data);
          let bookIds = [];
          
          // Handle different API response formats
          if (Array.isArray(parsedData)) {
            bookIds = parsedData.map(book => String(book._id || book.id));
            console.log(`Found ${bookIds.length} books in API response (array format)`);
          } else if (parsedData.books && Array.isArray(parsedData.books)) {
            bookIds = parsedData.books.map(book => String(book._id || book.id));
            console.log(`Found ${bookIds.length} books in API response (object format)`);
          } else {
            console.warn('Unexpected API response format');
            resolve([]); // Return empty array, we'll use critical IDs as fallback
            return;
          }
          
          resolve(bookIds);
        } catch (error) {
          console.warn(`Error parsing API response: ${error.message}`);
          resolve([]); // Return empty array, we'll use critical IDs as fallback
        }
      });
    });
    
    req.on('error', (error) => {
      console.warn(`API request error: ${error.message}`);
      resolve([]); // Return empty array, we'll use critical IDs as fallback
    });
    
    // Set timeout for the request
    req.setTimeout(10000, () => {
      console.warn('API request timed out');
      req.abort();
      resolve([]); // Return empty array, we'll use critical IDs as fallback
    });
    
    req.end();
  });
}

// Function to generate the STATIC_BOOKS.js file
function generateStaticBooksFile(bookIds) {
  // Ensure all critical book IDs are included
  const uniqueBookIds = new Set(bookIds);
  
  // Add any missing critical IDs
  CRITICAL_BOOK_IDS.forEach(id => {
    if (!uniqueBookIds.has(id)) {
      uniqueBookIds.add(id);
      console.log(`Added critical book ID: ${id}`);
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
  
  // Additional book IDs from the API or other sources
${finalBookIds.filter(id => !CRITICAL_BOOK_IDS.includes(id)).map(id => `  '${id}',`).join('\n')}
];

export default STATIC_BOOKS;`;

  // Ensure the directory exists
  const dirname = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
    console.log(`Created directory: ${dirname}`);
  }

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`Generated STATIC_BOOKS.js with ${finalBookIds.length} book IDs`);
  
  // Log the critical IDs for verification
  console.log('Critical book IDs included:');
  CRITICAL_BOOK_IDS.forEach(id => console.log(`- ${id}`));
}

// Main function
async function main() {
  try {
    console.log('Running simplified book ID collector...');
    let bookIds = [];
    
    // Try to get book IDs from the API
    try {
      const apiBookIds = await fetchBookIdsFromAPI();
      if (apiBookIds.length > 0) {
        console.log(`Found ${apiBookIds.length} books from API`);
        bookIds = apiBookIds;
      } else {
        console.warn('No book IDs found from API. Using critical IDs only.');
      }
    } catch (apiError) {
      console.warn(`Failed to fetch books from API: ${apiError.message}`);
    }
    
    // If API failed, use critical IDs only
    if (bookIds.length === 0) {
      console.warn('Using critical IDs only as fallback.');
      bookIds = [...CRITICAL_BOOK_IDS];
    }
    
    // Always generate the file, even if we only have critical IDs
    generateStaticBooksFile(bookIds);
    console.log(`Successfully created static book IDs file at: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 