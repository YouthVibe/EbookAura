/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to generate a list of all book IDs directly from the MongoDB database
 * This is useful for static exports where we need to pre-render all book pages
 * 
 * Run this script with:
 * node scripts/generate-static-books.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');
const https = require('https');
const http = require('http');

// Load environment variables from both project root and current directory
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../../.env') }); // In case running from scripts dir directly

// Create readline interface for potential user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
let MONGODB_URI = process.env.MONGODB_URI;
// Fallbacks to check various environment variable formats
if (!MONGODB_URI) {
  MONGODB_URI = process.env.DB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
}

// API URL for fetching books as a fallback
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

// Known important book IDs that must be included
// Add any book IDs that are causing issues or are critical to the site
const CRITICAL_BOOK_IDS = [
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3',
  '6807c9d24fb1873f72080fb1',
  '681859bd560ce1fd792c2745', // Added the previously missing book ID
];

// Simple Book schema definition (only need _id field for our purposes)
const BookSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: String,
  author: String,
  // Other fields are not needed for this script
}, { collection: 'books' });

// Ensure we don't get a model re-compilation error
let Book;
try {
  Book = mongoose.model('Book');
} catch (e) {
  Book = mongoose.model('Book', BookSchema);
}

// Function to get MongoDB connection string, prompting if necessary
async function getMongoDBConnectionString() {
  if (MONGODB_URI) {
    return MONGODB_URI;
  }

  return new Promise((resolve) => {
    console.log('\n============================================');
    console.log('MongoDB connection string not found in environment variables.');
    console.log('Please enter your MongoDB connection string:');
    console.log('(It should look like: mongodb+srv://username:password@cluster.mongodb.net/database)');
    console.log('============================================\n');
    
    rl.question('MongoDB Connection String: ', (answer) => {
      if (!answer || answer.trim() === '') {
        console.log('Using default local MongoDB connection: mongodb://localhost:27017/ebookAura');
        resolve('mongodb://localhost:27017/ebookAura');
      } else {
        resolve(answer.trim());
      }
    });
  });
}

// Function to fetch all books directly from the database
async function fetchAllBookIdsFromDatabase(uri) {
  try {
    // Mask the connection string for logging (don't show password)
    const maskedUri = uri.includes('@') 
      ? uri.replace(/:([^@]*)@/, ':********@') 
      : uri;
    
    console.log(`Connecting to MongoDB at: ${maskedUri}`);
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout
    });
    
    console.log('Connected to MongoDB, fetching book IDs...');
    
    // Use a raw MongoDB query to ensure we get all documents
    const books = await mongoose.connection.db.collection('books').find({}, { projection: { _id: 1 } }).toArray();
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    // Extract the IDs
    return books.map(book => book._id.toString());
  } catch (error) {
    console.error('Database connection error:', error);
    // Ensure connection is closed even if there's an error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    throw error;
  }
}

// Function to fetch books from the API as a fallback
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
            reject(new Error(`API returned status code ${res.statusCode}`));
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
            reject(new Error('Unexpected API response format'));
            return;
          }
          
          resolve(bookIds);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
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
      console.log(`Added critical book ID that was missing from database: ${id}`);
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
  
  // Additional book IDs from the database
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
  
  // Log the first 5 IDs for verification
  console.log('Sample of book IDs included:');
  finalBookIds.slice(0, 5).forEach(id => console.log(`- ${id}`));
}

// Main function
async function main() {
  try {
    console.log('Running enhanced book ID collector...');
    let bookIds = [];
    
    // First attempt: Try to get IDs from MongoDB directly
    try {
      const uri = await getMongoDBConnectionString();
      const dbBookIds = await fetchAllBookIdsFromDatabase(uri);
      
      if (dbBookIds.length > 0) {
        console.log(`Found ${dbBookIds.length} books in the database`);
        bookIds = dbBookIds;
      } else {
        console.warn('Warning: No book IDs found in database. Will try API as fallback.');
      }
    } catch (dbError) {
      console.warn(`Warning: Failed to fetch books from database: ${dbError.message}`);
      console.warn('Will try API as fallback');
    }
    
    // Second attempt: If database fetch failed or returned no results, try the API
    if (bookIds.length === 0) {
      try {
        const apiBookIds = await fetchBookIdsFromAPI();
        if (apiBookIds.length > 0) {
          console.log(`Found ${apiBookIds.length} books from API`);
          bookIds = apiBookIds;
        }
      } catch (apiError) {
        console.warn(`Warning: Failed to fetch books from API: ${apiError.message}`);
      }
    }
    
    // Third fallback: If both database and API failed, use critical IDs
    if (bookIds.length === 0) {
      console.warn('Warning: Could not fetch books from database or API. Using critical IDs as fallback.');
      bookIds = [...CRITICAL_BOOK_IDS];
    }
    
    // Always generate the file, even if we only have critical IDs
    generateStaticBooksFile(bookIds);
    console.log(`Successfully created static book IDs file with ${bookIds.length} IDs`);
    console.log(`File location: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Always close the readline interface
    rl.close();
  }
}

// Run the script
main(); 