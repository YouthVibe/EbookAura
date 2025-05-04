import { getAPI, postAPI, deleteAPI } from './apiUtils';
import { API_ENDPOINTS } from '../utils/config';
import { getAuthToken } from '../utils/auth';

/**
 * API utility functions for API key management
 */

/**
 * Get the current API key for the logged in user
 * Returns the (masked) API key if one exists
 * @returns {Promise<Object>} Response containing the API key information
 */
export const getCurrentApiKey = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to access API keys');
    }

    const response = await getAPI(API_ENDPOINTS.API_KEYS.CURRENT, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response;
  } catch (error) {
    console.error('Error fetching current API key:', error);
    throw error;
  }
};

/**
 * Generate a new API key for the logged in user
 * If an API key already exists, it will be replaced
 * @returns {Promise<Object>} Response containing the new API key
 */
export const generateApiKey = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to generate API key');
    }

    const response = await postAPI(API_ENDPOINTS.API_KEYS.GENERATE, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response;
  } catch (error) {
    console.error('Error generating API key:', error);
    throw error;
  }
};

/**
 * Revoke the current API key for the logged in user
 * @returns {Promise<Object>} Response confirming the key was revoked
 */
export const revokeApiKey = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to revoke API key');
    }

    const response = await deleteAPI(API_ENDPOINTS.API_KEYS.REVOKE, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response;
  } catch (error) {
    console.error('Error revoking API key:', error);
    throw error;
  }
};

/**
 * Verify an API key without being logged in
 * Useful for client-side verification of API keys
 * @param {string} apiKey - The API key to verify
 * @returns {Promise<Object>} Response containing verification status and user info
 */
export const verifyApiKey = async (apiKey) => {
  try {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const response = await postAPI(API_ENDPOINTS.API_KEYS.VERIFY, { apiKey });
    return response;
  } catch (error) {
    console.error('Error verifying API key:', error);
    throw error;
  }
};

/**
 * Check if a PDF is accessible with an API key
 * This adds the API key to the headers when downloading a PDF
 * @param {string} apiKey - The API key to use
 * @param {string} bookId - The ID of the book to access
 * @param {boolean} isDownload - Whether this is a download (true) or view (false) request
 * @returns {string} URL with appropriate query parameters and headers
 */
export const getPdfUrlWithApiKey = (apiKey, bookId, isDownload = false) => {
  if (!apiKey || !bookId) {
    throw new Error('API key and book ID are required');
  }

  const baseUrl = API_ENDPOINTS.BOOKS.PDF(bookId);
  const downloadParam = isDownload ? 'download=true' : '';
  const countedParam = 'counted=false'; // Let the server count this download
  
  const queryString = [downloadParam, countedParam].filter(Boolean).join('&');
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  // Return the full URL and headers to use
  return {
    url,
    headers: {
      'X-API-Key': apiKey
    }
  };
};

/**
 * Utility to create a blob URL for accessing a PDF with an API key
 * This can be used in an iframe src attribute or for downloads
 * @param {string} apiKey - The API key to use
 * @param {string} bookId - The ID of the book to access
 * @param {boolean} isDownload - Whether this is a download (true) or view (false) request
 * @returns {Promise<string>} A blob URL that can be used directly in an iframe or for downloads
 */
export const createPdfBlobUrlWithApiKey = async (apiKey, bookId, isDownload = false) => {
  try {
    if (!apiKey || !bookId) {
      throw new Error('API key and book ID are required');
    }

    const { url, headers } = getPdfUrlWithApiKey(apiKey, bookId, isDownload);
    
    // Fetch the PDF with the API key in the headers
    const response = await fetch(url, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch PDF: ${response.status}`);
    }
    
    // Create a blob URL from the response
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    return blobUrl;
  } catch (error) {
    console.error('Error creating PDF blob URL with API key:', error);
    throw error;
  }
}; 