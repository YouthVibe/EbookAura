/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * This file contains paths for admin routes that need to be statically generated
 * Generated on: 2025-05-03T17:13:34.600Z
 * 
 * These paths will be used with generateStaticParams() in admin route components
 * to ensure they can be exported statically while still enforcing authentication
 * at runtime.
 */

// Book IDs for admin edit pages
export const ADMIN_BOOK_IDS = [
  '6807be6cf05cdd8f4bdf933c',
  '6803d0c8cd7950184b1e8cf3',
  '6807c9d24fb1873f72080fb1',
];

// Admin routes that should be pre-rendered
export const ADMIN_PATHS = {
  // Main admin page
  main: '/',
  
  // Book management paths
  books: {
    list: '/books',
    new: '/books/new',
    // Edit paths will be constructed dynamically using ADMIN_BOOK_IDS
  },
  
  // User management paths
  users: {
    list: '/users',
  }
};

/**
 * Helper function to generate all admin book edit paths
 * @returns {Array<{id: string}>} - Array of params objects for dynamic routes
 */
export function getAdminBookEditParams() {
  return ADMIN_BOOK_IDS.map(id => ({
    id
  }));
}