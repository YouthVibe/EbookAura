/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Simple test script to verify public search functionality
 * 
 * Run this script with Node.js to test if anonymous users can search for books
 */

const fetch = require('node-fetch');

// Configure API URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testAnonymousSearch() {
  console.log('Testing search functionality without authentication...');
  
  try {
    // Attempt to search books without authentication
    const searchResponse = await fetch(`${API_URL}/books?search=programming`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed with status ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData && searchData.books && Array.isArray(searchData.books)) {
      console.log('✅ Anonymous search successful!');
      console.log(`Found ${searchData.books.length} books in the search results`);
      
      // Print a sample of books found
      if (searchData.books.length > 0) {
        console.log('\nSample books:');
        searchData.books.slice(0, 3).forEach((book, index) => {
          console.log(`${index + 1}. ${book.title} by ${book.author || 'Unknown'}`);
        });
      }
    } else {
      console.log('⚠️ Search returned unexpected data format:', searchData);
    }
    
    console.log('\nTesting PDF access for first book (if available)...');
    
    if (searchData.books && searchData.books.length > 0) {
      const firstBook = searchData.books[0];
      
      // Test PDF access
      const pdfResponse = await fetch(`${API_URL}/books/${firstBook._id}/pdf`, {
        method: 'GET'
      });
      
      if (pdfResponse.ok || pdfResponse.status === 302) {
        console.log(`✅ Anonymous PDF access successful! Status: ${pdfResponse.status}`);
      } else {
        console.log(`❌ PDF access failed with status ${pdfResponse.status}`);
      }
    } else {
      console.log('⚠️ No books available to test PDF access');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAnonymousSearch(); 