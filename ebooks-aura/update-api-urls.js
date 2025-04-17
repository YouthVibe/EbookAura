/**
 * Script to update API URLs in all files from localhost:5000 to production URL
 * Run with: node update-api-urls.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Production API URL
const PRODUCTION_API_URL = 'https://ebookaura.onrender.com/api';

// API Utils file content
const API_UTILS_CONTENT = `/**
 * API Utilities for consistent API access across the application
 * This file centralizes API call functions and ensures they all use the production API URL
 */

// Production API URL
const API_BASE_URL = '${PRODUCTION_API_URL}';

/**
 * Make a fetch request to the API with appropriate headers and error handling
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {Error} - Error with message from API or generic error message
 */
export async function fetchAPI(endpoint, options = {}) {
  try {
    const url = \`\${API_BASE_URL}\${endpoint}\`;
    
    // Set default headers
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add content-type header for requests with body
    if (options.body && !options.headers['Content-Type'] && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    
    // Add auth headers if available from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const apiKey = localStorage.getItem('apiKey');
      
      if (token && apiKey) {
        options.headers['Authorization'] = \`Bearer \${token}\`;
        options.headers['X-API-Key'] = apiKey;
      }
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || \`API request failed with status \${response.status}\`);
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Get data from an API endpoint
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function getAPI(endpoint, options = {}) {
  return fetchAPI(endpoint, { 
    method: 'GET',
    ...options 
  });
}

/**
 * Post data to an API endpoint
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} data - Data to send in request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function postAPI(endpoint, data, options = {}) {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  
  return fetchAPI(endpoint, {
    method: 'POST',
    body,
    ...options
  });
}

/**
 * Put data to an API endpoint
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} data - Data to send in request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function putAPI(endpoint, data, options = {}) {
  return fetchAPI(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  });
}

/**
 * Delete data from an API endpoint
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function deleteAPI(endpoint, options = {}) {
  return fetchAPI(endpoint, {
    method: 'DELETE',
    ...options
  });
}

export default {
  fetchAPI,
  getAPI,
  postAPI,
  putAPI,
  deleteAPI
};`;

// Paths
const srcDir = path.join(__dirname, 'src');
const apiUtilsDir = path.join(srcDir, 'app', 'api');
const apiUtilsPath = path.join(apiUtilsDir, 'apiUtils.js');

// Function to find all files containing localhost:5000
function findFilesWithLocalhost() {
  console.log('Finding files with localhost:5000...');
  
  try {
    // Try using grep if available
    try {
      const result = execSync(`grep -r "localhost:5000" ${srcDir} --include="*.js"`, { encoding: 'utf8' });
      const files = new Set();
      
      result.split('\n').forEach(line => {
        if (line) {
          const filePath = line.split(':')[0];
          files.add(filePath);
        }
      });
      
      return Array.from(files);
    } catch (error) {
      // If grep fails (like on Windows), fall back to manual search
      console.log('Grep not available, falling back to manual search...');
      return findFilesManually();
    }
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Manual file search (for Windows where grep may not be available)
function findFilesManually() {
  const results = [];
  
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        searchDirectory(filePath);
      } else if (stat.isFile() && file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('localhost:5000')) {
            results.push(filePath);
          }
        } catch (error) {
          console.error(`Error reading file ${filePath}:`, error);
        }
      }
    }
  }
  
  searchDirectory(srcDir);
  return results;
}

// Create API Utils file
function createApiUtilsFile() {
  console.log('Creating API utilities module...');
  
  if (!fs.existsSync(apiUtilsDir)) {
    fs.mkdirSync(apiUtilsDir, { recursive: true });
  }
  
  fs.writeFileSync(apiUtilsPath, API_UTILS_CONTENT);
  console.log(`Created API utilities at ${apiUtilsPath}`);
}

// Update a single file to use API utilities
function updateFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativePathToApiUtils = path.relative(path.dirname(filePath), apiUtilsDir)
      .replace(/\\/g, '/') // Convert Windows paths to forward slashes
      .replace(/^src\//, '../'); // Adjust relative path as needed
    
    // Check if file already imports apiUtils
    if (!content.includes('apiUtils')) {
      // Add import
      const importStatement = `import { getAPI, postAPI, putAPI, deleteAPI } from '${relativePathToApiUtils}/apiUtils';\n`;
      content = content.replace(/^("|')use client("|');?\n/, `$1use client$2;\n\n${importStatement}`);
      
      if (!content.includes('apiUtils')) {
        const importMatch = content.match(/^import .* from .*;\n/);
        if (importMatch) {
          content = content.replace(importMatch[0], `${importMatch[0]}${importStatement}`);
        } else {
          content = `${importStatement}\n${content}`;
        }
      }
    }
    
    // Replace localhost URL patterns with API utility calls
    
    // Simple GET requests
    content = content.replace(
      /const response = await fetch\(['"]http:\/\/localhost:5000\/api([^'"]*)['"]\);/g,
      'const data = await getAPI("$1");'
    );
    
    // GET requests with options
    content = content.replace(
      /const response = await fetch\(['"]http:\/\/localhost:5000\/api([^'"]*)['"](, \{[^}]*method: ['"]GET['"],[^}]*\})\);/g,
      'const data = await getAPI("$1");'
    );
    
    // POST requests
    content = content.replace(
      /const response = await fetch\(['"]http:\/\/localhost:5000\/api([^'"]*)['"](, \{[^}]*method: ['"]POST['"],[^}]*body: JSON\.stringify\(([^)]*)\)[^}]*\})\);/g,
      'const data = await postAPI("$1", $3);'
    );
    
    // Basic POST with headers extraction
    const postPattern = /const response = await fetch\(['"]http:\/\/localhost:5000\/api([^'"]*)['"], \{[^}]*method: ['"]POST['"][^}]*headers:[^{]*\{([^}]*)\}[^}]*body: JSON\.stringify\(([^)]*)\)[^}]*\}\);/g;
    content = content.replace(postPattern, 'const data = await postAPI("$1", $3);');
    
    // PUT requests
    content = content.replace(
      /const response = await fetch\(['"]http:\/\/localhost:5000\/api([^'"]*)['"](, \{[^}]*method: ['"]PUT['"],[^}]*body: JSON\.stringify\(([^)]*)\)[^}]*\})\);/g,
      'const data = await putAPI("$1", $3);'
    );
    
    // DELETE requests
    content = content.replace(
      /const response = await fetch\(['"]http:\/\/localhost:5000\/api([^'"]*)['"](, \{[^}]*method: ['"]DELETE['"],[^}]*\})\);/g,
      'const data = await deleteAPI("$1");'
    );
    
    // Clean up response processing
    content = content.replace(/const data = await response\.json\(\);/g, '');
    content = content.replace(/if \(!response\.ok\) \{[^}]*throw new Error\([^)]*\);[^}]*\}/g, '');
    content = content.replace(/if \(response\.ok\) \{/g, '');
    content = content.replace(/\} else \{[^}]*\}/g, '');
    
    // Remove any leftover response checks
    content = content.replace(/if \(!?response\.ok\) \{[^}]*\}/g, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
  }
}

// Main function
function main() {
  console.log('Starting API URL update process...');
  
  // Create API Utils file
  createApiUtilsFile();
  
  // Find files with localhost:5000
  const files = findFilesWithLocalhost();
  
  console.log(`Found ${files.length} files containing localhost:5000`);
  
  // Update each file
  for (const file of files) {
    updateFile(file);
  }
  
  console.log('\nDone! All files have been updated to use the production API URL.');
  console.log(`API utilities have been created at ${apiUtilsPath}`);
}

// Run the script
main(); 