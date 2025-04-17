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
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
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
    
    // Check content type header to determine how to parse the response
    const contentType = response.headers.get('content-type');
    
    // If not OK response, handle error appropriately
    if (!response.ok) {
      console.error(`API Error (${response.status}): ${response.statusText}`);
      
      if (contentType && contentType.includes('application/json')) {
        // Parse as JSON if the content type is JSON
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      } else {
        // Handle HTML or other non-JSON responses
        const text = await response.text();
        console.error('Non-JSON error response:', text.substring(0, 150) + '...');
        
        // Try to extract a meaningful error message from HTML
        let errorMessage = `API request failed with status ${response.status}`;
        if (text.includes('<title>') && text.includes('</title>')) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            errorMessage = `Server Error: ${titleMatch[1]}`;
          }
        }
        
        throw new Error(errorMessage);
      }
    }
    
    // Handle successful response based on content type
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      console.warn('Response is not JSON. Content-Type:', contentType);
      const text = await response.text();
      
      // Try to parse as JSON anyway in case the content type header is wrong
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('API response was not valid JSON');
      }
    }
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