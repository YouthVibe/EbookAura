/**
 * Sitemap Submission Script
 * 
 * This script notifies search engines about your sitemap
 * to encourage faster indexing of your site content.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const LOG_FILE = path.join(__dirname, 'sitemap-submission-log.txt');

// Search Engine Ping URLs
const PING_URLS = [
  // Google
  `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  // Bing
  `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  // Yandex
  `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
];

// Log with timestamp and file
const logWithTime = (message) => {
  const now = new Date();
  const timestamp = now.toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  // Append to log file
  fs.appendFileSync(LOG_FILE, logMessage);
};

// Function to ping a URL
const pingSitemap = (pingUrl) => {
  return new Promise((resolve, reject) => {
    try {
      // Parse the URL to determine protocol
      const parsedUrl = new URL(pingUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      // Start the request
      const req = protocol.get(pingUrl, (res) => {
        let responseData = '';
        
        // Accumulate response data
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        // Process the complete response
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              url: pingUrl,
              statusCode: res.statusCode,
              message: `Successfully pinged: ${pingUrl}`
            });
          } else {
            resolve({
              success: false,
              url: pingUrl,
              statusCode: res.statusCode,
              message: `Failed to ping: ${pingUrl} (Status: ${res.statusCode})`
            });
          }
        });
      });
      
      // Handle request errors
      req.on('error', (error) => {
        resolve({
          success: false,
          url: pingUrl,
          message: `Error pinging: ${pingUrl} (${error.message})`
        });
      });
      
      // Set request timeout
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          url: pingUrl,
          message: `Timeout pinging: ${pingUrl}`
        });
      });
    } catch (error) {
      resolve({
        success: false,
        url: pingUrl,
        message: `Exception pinging: ${pingUrl} (${error.message})`
      });
    }
  });
};

// Main function to ping all search engines
const pingAllSearchEngines = async () => {
  logWithTime('==========================');
  logWithTime('Sitemap Submission Started');
  logWithTime('==========================');
  logWithTime(`Sitemap URL: ${SITEMAP_URL}`);
  
  const results = [];
  
  // Process each ping URL
  for (const pingUrl of PING_URLS) {
    logWithTime(`Pinging: ${pingUrl}`);
    const result = await pingSitemap(pingUrl);
    results.push(result);
    
    if (result.success) {
      logWithTime(`SUCCESS: ${result.message}`);
    } else {
      logWithTime(`FAILED: ${result.message}`);
    }
    
    // Small delay between pings to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Calculate statistics
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  // Log summary
  logWithTime('==========================');
  logWithTime('Sitemap Submission Summary');
  logWithTime('==========================');
  logWithTime(`Total pings: ${results.length}`);
  logWithTime(`Successful: ${successful}`);
  logWithTime(`Failed: ${failed}`);
  logWithTime('==========================');
  
  return {
    success: successful > 0,
    total: results.length,
    successful,
    failed,
    results
  };
};

// Run the script
pingAllSearchEngines()
  .then(summary => {
    if (summary.success) {
      logWithTime('Sitemap submission completed with some success.');
      process.exit(0);
    } else {
      logWithTime('Sitemap submission failed for all search engines.');
      process.exit(1);
    }
  })
  .catch(error => {
    logWithTime(`Unhandled error: ${error.message}`);
    process.exit(1);
  }); 