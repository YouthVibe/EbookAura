/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Test Open Graph Metadata Implementation
 * This script helps verify if Open Graph tags are correctly implemented
 * on book detail pages
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_BOOK_ID = process.argv[2]; // Pass book ID as command line argument
const OUTPUT_FILE = path.join(__dirname, 'og-metadata-test-results.json');

// Log with timestamp
const logWithTime = (message) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
};

// Function to fetch and extract metadata from a page
async function testOgMetadata(bookId) {
  if (!bookId) {
    throw new Error('Please provide a book ID as a command line argument');
  }

  logWithTime(`Testing Open Graph metadata for book ID: ${bookId}`);
  logWithTime(`Fetching page from: ${BASE_URL}/books/${bookId}`);
  
  try {
    // Fetch the book page
    const response = await fetch(`${BASE_URL}/books/${bookId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch book page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    logWithTime(`Successfully fetched page (${html.length} bytes)`);
    
    // Use cheerio to parse HTML and extract meta tags
    const $ = cheerio.load(html);
    
    // Get all meta tags
    const metaTags = {};
    $('meta').each((i, el) => {
      const property = $(el).attr('property') || $(el).attr('name') || $(el).attr('itemprop');
      const content = $(el).attr('content');
      
      if (property && content) {
        metaTags[property] = content;
      }
    });
    
    // Get title
    const title = $('title').text();
    
    // Get Open Graph specific tags
    const ogTags = {};
    $('meta[property^="og:"]').each((i, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      ogTags[property] = content;
    });
    
    // Get Twitter card tags
    const twitterTags = {};
    $('meta[name^="twitter:"]').each((i, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      twitterTags[name] = content;
    });
    
    // Get book-specific tags
    const bookTags = {};
    $('meta[property^="book:"]').each((i, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      bookTags[property] = content;
    });
    
    // Prepare results
    const results = {
      url: `${BASE_URL}/books/${bookId}`,
      title,
      metaTags,
      openGraph: ogTags,
      twitterCard: twitterTags,
      bookMetadata: bookTags,
      timestamp: new Date().toISOString()
    };
    
    // Save results to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    logWithTime(`Results saved to: ${OUTPUT_FILE}`);
    
    // Print summary
    logWithTime('=== Open Graph Metadata Test Results ===');
    logWithTime(`Title: ${title}`);
    logWithTime(`OG Title: ${ogTags['og:title'] || 'Not found'}`);
    logWithTime(`OG Description: ${ogTags['og:description'] || 'Not found'}`);
    logWithTime(`OG Image: ${ogTags['og:image'] || 'Not found'}`);
    logWithTime(`Twitter Card: ${twitterTags['twitter:card'] || 'Not found'}`);
    logWithTime(`Book Author: ${bookTags['book:author'] || 'Not found'}`);
    
    return results;
  } catch (error) {
    logWithTime(`Error: ${error.message}`);
    throw error;
  }
}

// Run the test
(async () => {
  try {
    await testOgMetadata(TEST_BOOK_ID);
    logWithTime('Test completed successfully.');
  } catch (error) {
    logWithTime(`Test failed: ${error.message}`);
    process.exit(1);
  }
})(); 