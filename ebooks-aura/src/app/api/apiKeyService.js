/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * API Key Service
 * Provides functions for managing API keys
 */
import { getAPI, postAPI, putAPI, deleteAPI } from './apiUtils';

/**
 * Get all API keys for the current user
 * @returns {Promise<Array>} - List of API keys
 */
export async function getUserApiKeys() {
  try {
    const response = await getAPI('/api-keys');
    return response.apiKeys;
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
}

/**
 * Create a new API key
 * @param {string} name - Name for the API key
 * @param {Object} permissions - Object containing permission settings
 * @returns {Promise<Object>} - The created API key
 */
export async function createApiKey(name, permissions = {}) {
  try {
    const response = await postAPI('/api-keys', { name, permissions });
    return response.apiKey;
  } catch (error) {
    console.error('Error creating API key:', error);
    // Create a more user-friendly error message
    if (error.message && error.message.includes('maximum limit')) {
      throw new Error('You have reached the maximum of 5 API keys. Please delete an existing key before creating a new one.');
    } else if (error.message && error.message.includes('required')) {
      throw new Error('API key name is required. Please provide a name for your key.');
    } else {
      throw new Error(error.message || 'Failed to create API key. Please try again later.');
    }
  }
}

/**
 * Get a specific API key
 * @param {string} id - API key ID
 * @returns {Promise<Object>} - API key details
 */
export async function getApiKey(id) {
  try {
    const response = await getAPI(`/api-keys/${id}`);
    return response.apiKey;
  } catch (error) {
    console.error(`Error fetching API key ${id}:`, error);
    throw error;
  }
}

/**
 * Update an API key
 * @param {string} id - API key ID
 * @param {string} name - New name for the API key
 * @param {Object} permissions - Updated permissions
 * @returns {Promise<Object>} - Updated API key
 */
export async function updateApiKey(id, name, permissions) {
  try {
    const data = {};
    if (name) data.name = name;
    if (permissions) data.permissions = permissions;
    
    const response = await putAPI(`/api-keys/${id}`, data);
    return response.apiKey;
  } catch (error) {
    console.error(`Error updating API key ${id}:`, error);
    throw error;
  }
}

/**
 * Revoke an API key
 * @param {string} id - API key ID
 * @returns {Promise<Object>} - The revoked API key
 */
export async function revokeApiKey(id) {
  try {
    const response = await putAPI(`/api-keys/${id}/revoke`, {});
    return response.apiKey;
  } catch (error) {
    console.error(`Error revoking API key ${id}:`, error);
    throw error;
  }
}

/**
 * Activate an API key
 * @param {string} id - API key ID
 * @returns {Promise<Object>} - The activated API key
 */
export async function activateApiKey(id) {
  try {
    const response = await putAPI(`/api-keys/${id}/activate`, {});
    return response.apiKey;
  } catch (error) {
    console.error(`Error activating API key ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an API key
 * @param {string} id - API key ID
 * @returns {Promise<Object>} - Response with deletion confirmation
 */
export async function deleteApiKey(id) {
  try {
    const response = await deleteAPI(`/api-keys/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting API key ${id}:`, error);
    throw error;
  }
}

export default {
  getUserApiKeys,
  createApiKey,
  getApiKey,
  updateApiKey,
  revokeApiKey,
  activateApiKey,
  deleteApiKey
}; 