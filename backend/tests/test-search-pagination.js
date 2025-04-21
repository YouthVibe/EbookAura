/**
 * Test script to verify pagination functionality
 * Run this script with Node.js to test if pagination works correctly
 */

const fetch = require('node-fetch');

// Configure API URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testSearchPagination() {
  console.log('Testing search pagination functionality...');
  
  // Test multiple pages
  try {
    // Page 1
    console.log('\n--- Fetching Page 1 (10 items) ---');
    const response1 = await fetch(`${API_URL}/books?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response1.ok) {
      throw new Error(`Failed to fetch page 1: ${response1.status}`);
    }
    
    const data1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    
    if (data1.pagination) {
      console.log(`Page: ${data1.pagination.page}/${data1.pagination.totalPages}`);
      console.log(`Total books: ${data1.pagination.totalBooks}`);
      console.log(`Items on this page: ${data1.books.length}`);
      console.log(`Has next page: ${data1.pagination.hasNextPage}`);
    } else {
      console.log(`Books returned: ${data1.books ? data1.books.length : 'Unknown'}`);
    }
    
    // Only try page 2 if there are enough books
    if (data1.pagination && data1.pagination.hasNextPage) {
      // Page 2
      console.log('\n--- Fetching Page 2 (10 items) ---');
      const response2 = await fetch(`${API_URL}/books?page=2&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response2.ok) {
        throw new Error(`Failed to fetch page 2: ${response2.status}`);
      }
      
      const data2 = await response2.json();
      console.log(`Status: ${response2.status}`);
      
      if (data2.pagination) {
        console.log(`Page: ${data2.pagination.page}/${data2.pagination.totalPages}`);
        console.log(`Total books: ${data2.pagination.totalBooks}`);
        console.log(`Items on this page: ${data2.books.length}`);
        console.log(`Has next page: ${data2.pagination.hasNextPage}`);
        
        // Verify we got different books
        if (data1.books && data1.books.length > 0 && data2.books && data2.books.length > 0) {
          const firstBookPage1 = data1.books[0]._id;
          const firstBookPage2 = data2.books[0]._id;
          
          if (firstBookPage1 !== firstBookPage2) {
            console.log('\n✅ Test passed: Different books returned on different pages');
          } else {
            console.log('\n❌ Test failed: Same books returned on different pages');
          }
        }
      } else {
        console.log(`Books returned: ${data2.books ? data2.books.length : 'Unknown'}`);
      }
    } else {
      console.log('\n⚠️ Not enough books to test pagination to page 2');
    }
    
    // Test with search query
    console.log('\n--- Testing Search Query ---');
    const searchQuery = 'a'; // Simple search that should match many titles
    const searchResponse = await fetch(`${API_URL}/books?search=${searchQuery}&page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`Search for '${searchQuery}' returned ${searchData.books ? searchData.books.length : 0} books`);
    
    if (searchData.pagination) {
      console.log(`Page: ${searchData.pagination.page}/${searchData.pagination.totalPages}`);
      console.log(`Total matching books: ${searchData.pagination.totalBooks}`);
    }
    
    console.log('\n✅ Pagination test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSearchPagination().catch(console.error); 