/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Test Search and Home Page Metadata Implementation
 * This script helps verify if metadata tags are correctly implemented on the search and home pages
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SEARCH_OUTPUT_FILE = path.join(__dirname, 'search-metadata-test-results.json');
const HOME_OUTPUT_FILE = path.join(__dirname, 'home-metadata-test-results.json');

// Log with timestamp
const logWithTime = (message) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
};

// Function to fetch and extract metadata from a page
async function testPageMetadata(pagePath, outputFile, pageName) {
  logWithTime(`Testing ${pageName} metadata`);
  logWithTime(`Fetching page from: ${BASE_URL}${pagePath}`);
  
  try {
    // Fetch the page
    const response = await fetch(`${BASE_URL}${pagePath}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${pageName}: ${response.status} ${response.statusText}`);
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
    
    // Get robots tags
    const robotsTags = {};
    $('meta[name^="robots"]').each((i, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      robotsTags[name] = content;
    });
    
    // Prepare results
    const results = {
      url: `${BASE_URL}${pagePath}`,
      title,
      metaTags,
      openGraph: ogTags,
      twitterCard: twitterTags,
      robots: robotsTags,
      timestamp: new Date().toISOString()
    };
    
    // Save results to file
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    logWithTime(`Results saved to: ${outputFile}`);
    
    // Print summary
    logWithTime(`=== ${pageName} Metadata Test Results ===`);
    logWithTime(`Title: ${title}`);
    logWithTime(`OG Title: ${ogTags['og:title'] || 'Not found'}`);
    logWithTime(`OG Description: ${ogTags['og:description'] || 'Not found'}`);
    logWithTime(`OG Image: ${ogTags['og:image'] || 'Not found'}`);
    logWithTime(`Twitter Card: ${twitterTags['twitter:card'] || 'Not found'}`);
    
    return results;
  } catch (error) {
    logWithTime(`Error: ${error.message}`);
    throw error;
  }
}

// Function to test search page metadata
async function testSearchMetadata() {
  return testPageMetadata('/search', SEARCH_OUTPUT_FILE, 'Search Page');
}

// Function to test home page metadata
async function testHomeMetadata() {
  return testPageMetadata('/', HOME_OUTPUT_FILE, 'Home Page');
}

// Run the tests
(async () => {
  try {
    await testSearchMetadata();
    await testHomeMetadata();
    logWithTime('All tests completed successfully.');
  } catch (error) {
    logWithTime(`Tests failed: ${error.message}`);
    process.exit(1);
  }
})(); 