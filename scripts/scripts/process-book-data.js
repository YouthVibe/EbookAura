/**
 * Script to generate book data from local books.json
 */

const fs = require('fs');
const path = require('path');

// Critical book IDs that must be included
const CRITICAL_BOOK_IDS = [
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3',
  '6807c9d24fb1873f72080fb1',
  '681859bd560ce1fd792c2745',
];

// Paths configuration
const INPUT_FILE = path.join(__dirname, '../books.json');
const OUTPUT_DIR = path.join(__dirname, '../src/app/utils/book-data');
const STATIC_BOOKS_PATH = path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js');

// Ensure output directories exist
const dirs = [
  path.dirname(STATIC_BOOKS_PATH),
  OUTPUT_DIR
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Main function
async function main() {
  try {
    console.log('Reading local books.json data...');
    const booksData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    console.log(`Processing ${booksData.length} books...`);
    let processedCount = 0;

    // Create a set of unique book IDs
    const uniqueBookIds = new Set([
      ...CRITICAL_BOOK_IDS, // Add critical IDs first
      ...booksData.filter(book => book._id).map(book => book._id)
    ]);

    // Convert to array and sort
    const bookIds = Array.from(uniqueBookIds).sort();

    const staticBooksContent = `/**
 * This file contains a list of all book IDs for static generation
 * Generated on: ${new Date().toISOString()}
 * Total books: ${bookIds.length}
 * 
 * For static exports, we must pre-render ALL book pages that users might access
 */

const STATIC_BOOKS = [
  // Critical book IDs that must always be included
${CRITICAL_BOOK_IDS.map(id => `  '${id}',  // Critical book ID`).join('\n')}

  // Additional book IDs from local JSON data
${bookIds.filter(id => !CRITICAL_BOOK_IDS.includes(id)).map(id => `  '${id}',`).join('\n')}
];

export default STATIC_BOOKS;`;

    // Save STATIC_BOOKS.js
    fs.writeFileSync(STATIC_BOOKS_PATH, staticBooksContent);
    console.log(`Generated STATIC_BOOKS.js with ${bookIds.length} book IDs`);

    // Create book-data directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Process each book
    for (const book of booksData) {
      if (!book._id) continue; // Skip incomplete entries

      const outputFile = path.join(OUTPUT_DIR, `${book._id}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(book, null, 2));
      processedCount++;

      // Log progress every 50 books
      if (processedCount % 50 === 0 || processedCount === booksData.length) {
        console.log(`Processed ${processedCount}/${booksData.length} books`);
      }
    }

    // Verify that all critical book IDs are present
    const missingCriticalIds = CRITICAL_BOOK_IDS.filter(id => !uniqueBookIds.has(id));
    if (missingCriticalIds.length > 0) {
      console.warn('\nWarning: Some critical book IDs are missing from books.json:');
      missingCriticalIds.forEach(id => console.warn(`- ${id}`));
    }

    console.log('\nDone! Book data has been processed and saved.');
    console.log(`Total books processed: ${processedCount}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
    console.log(`Static books file: ${STATIC_BOOKS_PATH}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

// Run the script
main().catch(console.error);
