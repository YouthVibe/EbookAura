/**
 * API Utilities for consistent API access across the application
 * This file centralizes API call functions and ensures they all use the configured API URL
 */

// Use the production API URL directly
const API_BASE_URL = 'https://ebookaura.onrender.com/api';
// Fallback options commented out
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Make a fetch request to the API with appropriate headers and error handling
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {Error} - Error with message from API or generic error message
 */
export async function fetchAPI(endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    // Set default headers
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add content-type header for requests with body
    if (options.body && !options.headers['Content-Type'] && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    
    // Check if this is a public book-related endpoint that doesn't need authentication
    const isPublicBookEndpoint = 
      endpoint.startsWith('/books') && 
      (options.method === 'GET' || !options.method) &&
      !endpoint.includes('/reviews') && 
      !endpoint.includes('/bookmarks');
    
    // Add auth headers if available from localStorage
    // For book detail endpoints, always include auth if available for consistent user access checks
    const isBookDetailEndpoint = endpoint.match(/^\/books\/[a-z0-9]+$/i);
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const apiKey = localStorage.getItem('apiKey');
      
      // Include auth for all non-public endpoints OR book detail endpoints
      // This ensures consistent auth state for book details
      if (token && (!isPublicBookEndpoint || isBookDetailEndpoint) && !options.headers['Authorization']) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (apiKey && !options.headers['X-API-Key']) {
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
    
    // Check if this is a book detail endpoint and ensure proper data handling
    if (endpoint.match(/^\/books\/[a-z0-9]+$/i) && 
        contentType && contentType.includes('application/json')) {
      try {
        const responseData = await response.json();
        
        // Extra processing for book details to ensure premium properties are correct
        if (responseData && typeof responseData === 'object') {
          // Ensure isPremium is a proper boolean
          if ('isPremium' in responseData) {
            responseData.isPremium = responseData.isPremium === true;
          }
          
          // Ensure price is a number
          if ('price' in responseData) {
            responseData.price = Number(responseData.price || 0);
          }
          
          // If there's a price but no isPremium flag, set isPremium to true
          if (!responseData.isPremium && responseData.price > 0) {
            responseData.isPremium = true;
            console.log('API Utils: Setting isPremium=true based on price > 0');
          }
          
          // Log the processed book data
          console.log('API Utils - Processed book details:', {
            title: responseData.title,
            isPremium: responseData.isPremium,
            price: responseData.price
          });
        }
        
        return responseData;
      } catch (parseError) {
        console.error('Error parsing book details:', parseError);
        throw parseError;
      }
    }
    
    // Regular handling for other endpoints
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