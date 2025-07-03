/**
 * Test script for verifying static generation setup
 */

import { getBookById, getAllBooks } from '../../ebooks-aura/src/app/utils/localBookData.js';
import { localAwareFetch } from '../../ebooks-aura/src/app/utils/fetchWrapper.js';

async function testStaticGeneration() {
  console.log('Testing static generation setup...\n');

  // Test 1: Check if books.json exists and can be read
  console.log('1. Testing local data access:');
  try {
    const allBooks = getAllBooks();
    console.log(`✓ Successfully read ${allBooks.length} books from books.json`);
  } catch (error) {
    console.error('✗ Failed to read books.json:', error);
    process.exit(1);
  }

  // Test 2: Check if we can get a specific book by ID
  console.log('\n2. Testing book retrieval by ID:');
  const testBookId = '681859bd560ce1fd792c2745';
  try {
    const book = getBookById(testBookId);
    if (book) {
      console.log(`✓ Successfully retrieved book: ${book.title}`);
    } else {
      console.error('✗ Book not found');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Failed to get book by ID:', error);
    process.exit(1);
  }

  // Test 3: Check if fetchWrapper works in static mode
  console.log('\n3. Testing fetchWrapper in static mode:');
  try {
    process.env.STATIC_EXPORT = 'true';
    const response = await localAwareFetch(`/api/books/${testBookId}`);
    const book = await response.json();
    if (book && book.title) {
      console.log('✓ Successfully fetched book through wrapper');
    } else {
      console.error('✗ Failed to get book through wrapper');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ fetchWrapper test failed:', error);
    process.exit(1);
  }

  console.log('\nAll tests passed! Static generation setup appears to be working correctly.');
}

testStaticGeneration().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
