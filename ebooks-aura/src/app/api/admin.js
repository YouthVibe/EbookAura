/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * API functions for admin operations
 */
import { getAPI, putAPI, deleteAPI, postAPI } from './apiUtils';

// Get all users
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('Authentication required');
    }
    
    return await getAPI('/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Ban/unban a user
export const toggleUserBan = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('Authentication required');
    }
    
    return await putAPI(`/admin/users/${userId}/ban`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    console.error('Error toggling user ban status:', error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('Authentication required');
    }
    
    return await deleteAPI(`/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get all books
export const getAllBooks = async () => {
  try {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('Authentication required');
    }
    
    return await getAPI('/admin/books', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

// Delete a book
export const deleteBook = async (bookId) => {
  try {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('Authentication required');
    }
    
    // This API call will delete the book record, PDF file and cover image from Cloudinary, as well as all associated reviews and bookmarks
    return await deleteAPI(`/admin/books/${bookId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

// Clean up orphaned Cloudinary resources
export const cleanupCloudinaryResources = async () => {
  try {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('Authentication required');
    }
    
    return await postAPI('/admin/cleanup-cloudinary', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    console.error('Error cleaning up Cloudinary resources:', error);
    throw error;
  }
};

// Update a book
export const updateBook = async (bookId, formData, providedToken = null) => {
  try {
    const token = providedToken || localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('Authentication required');
    }
    
    return await putAPI(`/admin/books/${bookId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
}; 