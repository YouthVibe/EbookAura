/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Authentication utilities for client-side usage
 */

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The authentication token or null if not available
 */
export const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error accessing token from localStorage:', error);
    return null;
  }
};

/**
 * Check if the user is logged in by presence of token
 * @returns {boolean} True if user is logged in, false otherwise
 */
export const isUserLoggedIn = () => {
  return !!getAuthToken();
};

/**
 * Get the API key from localStorage
 * @returns {string|null} The API key or null if not available
 */
export const getApiKey = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('apiKey');
  } catch (error) {
    console.error('Error accessing API key from localStorage:', error);
    return null;
  }
}; 