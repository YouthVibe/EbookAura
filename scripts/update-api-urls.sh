#!/bin/bash

echo "Creating a file list with all files containing localhost:5000"
files=$(grep -r "localhost:5000" ./ebooks-aura/src --include="*.js" | cut -d: -f1 | sort | uniq)

echo "Files to update:"
echo "$files"

echo -e "\nCreating API utilities module if it doesn't exist..."
mkdir -p ./ebooks-aura/src/app/api

# Check if utils file already exists
if [ ! -f ./ebooks-aura/src/app/api/apiUtils.js ]; then
  cat > ./ebooks-aura/src/app/api/apiUtils.js << 'EOL'
/**
 * API Utilities for consistent API access across the application
 * This file centralizes API call functions and ensures they all use the production API URL
 */

// Production API URL
const API_BASE_URL = 'https://ebookaura.onrender.com/api';

/**
 * Make a fetch request to the API with appropriate headers and error handling
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {Error} - Error with message from API or generic error message
 */
export async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
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
        options.headers['Authorization'] = `Bearer ${token}`;
        options.headers['X-API-Key'] = apiKey;
      }
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `API request failed with status ${response.status}`);
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
};
EOL
  echo "Created API utilities module"
fi

echo -e "\nUpdating files to use API utilities..."
for file in $files; do
  echo "Processing $file"
  
  # Get file content
  content=$(cat "$file")
  
  # Check if file already imports apiUtils
  if ! grep -q "import.*apiUtils" "$file"; then
    # Add import
    content=$(echo "$content" | sed '1,10 s/import/import { getAPI, postAPI, putAPI, deleteAPI } from '"'"'..\/api\/apiUtils'"'"';\nimport/1')
  fi
  
  # Replace fetch calls with API utility calls
  # GET requests
  content=$(echo "$content" | sed 's/const response = await fetch('"'"'http:\/\/localhost:5000\/api\([^'"'"']*\)'"'"', {[^}]*method: '"'"'GET'"'"'[^}]*});/const data = await getAPI("\1");/g')
  content=$(echo "$content" | sed 's/const response = await fetch('"'"'http:\/\/localhost:5000\/api\([^'"'"']*\)'"'"');/const data = await getAPI("\1");/g')
  
  # POST requests
  content=$(echo "$content" | sed 's/const response = await fetch('"'"'http:\/\/localhost:5000\/api\([^'"'"']*\)'"'"', {[^}]*method: '"'"'POST'"'"'[^}]*body: JSON.stringify(\([^)]*\))[^}]*});/const data = await postAPI("\1", \2);/g')
  
  # PUT requests
  content=$(echo "$content" | sed 's/const response = await fetch('"'"'http:\/\/localhost:5000\/api\([^'"'"']*\)'"'"', {[^}]*method: '"'"'PUT'"'"'[^}]*body: JSON.stringify(\([^)]*\))[^}]*});/const data = await putAPI("\1", \2);/g')
  
  # DELETE requests
  content=$(echo "$content" | sed 's/const response = await fetch('"'"'http:\/\/localhost:5000\/api\([^'"'"']*\)'"'"', {[^}]*method: '"'"'DELETE'"'"'[^}]*});/const data = await deleteAPI("\1");/g')
  
  # Remove response.json() and response.ok checks
  content=$(echo "$content" | sed '/const data = await response.json();/d')
  content=$(echo "$content" | sed '/if (!response.ok) {/,/}/d')
  content=$(echo "$content" | sed '/if (response.ok) {/d')
  content=$(echo "$content" | sed '/} else {/d')
  
  # Write updated content back to file
  echo "$content" > "$file"
  
  echo "Updated $file"
done

echo -e "\nDone! All files have been updated to use the production API URL." 