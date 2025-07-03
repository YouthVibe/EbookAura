/**
 * Script to pre-fetch all book data for static generation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Get the list of book IDs
const STATIC_BOOKS = require('../../ebooks-aura/src/app/utils/STATIC_BOOKS').default;
const API_URL = 'https://ebookaura.onrender.com/api';
const OUTPUT_DIR = path.join(__dirname, '../src/app/utils/book-data');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to fetch book data
async function fetchBookData(bookId) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}/books/${bookId}`;
    console.log(`Fetching ${url}`);

    https.get(url, (res) => {
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
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Main function
async function main() {
  console.log(`Pre-fetching data for ${STATIC_BOOKS.length} books...`);
  
  for (let i = 0; i < STATIC_BOOKS.length; i++) {
    const bookId = STATIC_BOOKS[i];
    const outputFile = path.join(OUTPUT_DIR, `${bookId}.json`);

    try {
      // Skip if we already have this book's data
      if (fs.existsSync(outputFile)) {
        console.log(`Skipping ${bookId} (already fetched)`);
        continue;
      }

      const bookData = await fetchBookData(bookId);
      fs.writeFileSync(outputFile, JSON.stringify(bookData, null, 2));
      console.log(`[${i + 1}/${STATIC_BOOKS.length}] Saved data for ${bookId}`);

      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to fetch book ${bookId}:`, error.message);
    }
  }

  console.log('\nDone! Book data has been pre-fetched and saved.');
}

main().catch(console.error);
