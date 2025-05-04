import { getAPI, postAPI, putAPI, deleteAPI } from '../api/apiUtils';

/**
 * Configuration file for API endpoints and other global settings
 * This file centralizes configuration to ensure consistency across the application
 */

// API base URL with environment fallback to production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    ME: `${API_BASE_URL}/auth/me`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: (token) => `${API_BASE_URL}/auth/reset-password/${token}`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  },
  
  // Book endpoints - Most are public and don't require authentication
  BOOKS: {
    // Public endpoints - no authentication required
    ALL: `${API_BASE_URL}/books`,
    CATEGORIES: `${API_BASE_URL}/books/categories`,
    TAGS: `${API_BASE_URL}/books/tags`,
    DETAILS: (id) => `${API_BASE_URL}/books/${id}`,
    PDF: (id) => `${API_BASE_URL}/books/pdf/${id}`,
    PDF_CONTENT: (id) => `${API_BASE_URL}/books/pdf/${id}`,
    DOWNLOAD: (id) => `${API_BASE_URL}/books/${id}/download`,
    REVIEWS: (id) => `${API_BASE_URL}/books/${id}/reviews`,
    RATING: (id) => `${API_BASE_URL}/books/${id}/rating`,
    // Private endpoints - require authentication
    ADD_REVIEW: (id) => `${API_BASE_URL}/books/${id}/reviews`,
  },
  
  // Upload endpoints - all require authentication
  UPLOAD: {
    FILE: `${API_BASE_URL}/upload`,
    PDF: `${API_BASE_URL}/upload/pdf`,
    DELETE_FILE: (publicId) => `${API_BASE_URL}/upload/${publicId}`,
    DELETE_BOOK: (id) => `${API_BASE_URL}/upload/book/${id}`,
  },
  
  // User endpoints - all require authentication
  USER: {
    PROFILE: `${API_BASE_URL}/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
    UPDATE_IMAGE: `${API_BASE_URL}/users/profile/image`,
    BOOKMARKS: `${API_BASE_URL}/users/bookmarks`,
  },
  
  // Subscription endpoints
  SUBSCRIPTIONS: {
    CURRENT: `${API_BASE_URL}/subscriptions/current`,
    CHECK: `${API_BASE_URL}/subscriptions/check`,
    CHECK_API: `${API_BASE_URL}/subscriptions/check-api`,
    ACTIVATE: `${API_BASE_URL}/subscriptions/activate`,
    DEACTIVATE: `${API_BASE_URL}/subscriptions/deactivate`
  },
  
  // API Keys endpoints
  API_KEYS: {
    GENERATE: `${API_BASE_URL}/api-keys/generate`,
    CURRENT: `${API_BASE_URL}/api-keys/current`,
    REVOKE: `${API_BASE_URL}/api-keys/revoke`,
    VERIFY: `${API_BASE_URL}/api-keys/verify`
  },
};

// App settings
export const APP_CONFIG = {
  APP_NAME: 'EbookAura',
  PAGE_SIZE: 12, // Default number of items per page
  SUPPORTED_FILE_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENTS: ['application/pdf'],
  },
  MAX_FILE_SIZES: {
    PROFILE_IMAGE: 2 * 1024 * 1024, // 2MB
    COVER_IMAGE: 5 * 1024 * 1024,   // 5MB
    PDF: 20 * 1024 * 1024,          // 20MB
  },
  // Public vs Private endpoints for frontend reference
  PUBLIC_ENDPOINTS: [
    '/books',
    '/books/categories',
    '/books/tags',
    '/books/',
    '/books/pdf/:id',
    '/books/:id/download',
    '/books/:id/reviews',
    '/books/:id/rating',
  ]
};

// Export default config object that includes all configurations
const config = {
  API_BASE_URL,
  API_ENDPOINTS,
  APP_CONFIG,
};

export default config; 
