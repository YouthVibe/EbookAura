/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * API functions for subscription operations
 */
import { getAPI, postAPI, putAPI, patchAPI, shouldMakeApiCall, cacheApiCallResult } from './apiUtils';
import { API_ENDPOINTS } from '../utils/config';

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  PLANS: 60 * 60 * 1000, // 1 hour for subscription plans
  CURRENT: 5 * 60 * 1000, // 5 minutes for current subscription
  HISTORY: 10 * 60 * 1000 // 10 minutes for subscription history
};

// Get available subscription plans
export const getSubscriptionPlans = async (forceFresh = false) => {
  try {
    // Check if we should make the API call or use cached data
    const cacheKey = 'subscription_plans';
    const { shouldMakeCall, cachedData } = shouldMakeApiCall(
      cacheKey, 
      CACHE_DURATIONS.PLANS,
      forceFresh
    );
    
    // Return cached data if available and still valid
    if (!shouldMakeCall && cachedData) {
      return cachedData;
    }
    
    // Make the API call
    const response = await getAPI('/subscriptions/plans');
    
    // Handle both response formats (plans field or data field)
    if (response) {
      const plans = response.plans || response.data || [];
      const result = {
        ...response,
        plans
      };
      
      // Cache the result
      cacheApiCallResult(cacheKey, result);
      
      return result;
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Get current user's subscription
export const getCurrentSubscription = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No authentication token found for subscription check');
      return { success: false, hasSubscription: false, message: 'Not authenticated' };
    }
    
    console.log('Checking current subscription status from server...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Log response status to help with debugging
    console.log(`Subscription status API response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Subscription status API response:', data);
    
    if (response.ok) {
      // Make sure we have consistent property names (both hasSubscription and active)
      if (data.hasSubscription === undefined && data.active !== undefined) {
        data.hasSubscription = data.active;
      } else if (data.active === undefined && data.hasSubscription !== undefined) {
        data.active = data.hasSubscription;
      }
      
      // Cache the subscription status with timestamp
      try {
        localStorage.setItem('subscriptionStatus', JSON.stringify({
          hasSubscription: data.hasSubscription,
          active: data.hasSubscription, // Duplicate for API consistency
          planType: data.planType,
          expiresAt: data.expiresAt,
          timestamp: new Date().toISOString()
        }));
        console.log('Subscription status cached successfully');
      } catch (cacheError) {
        console.warn('Failed to cache subscription status:', cacheError);
      }
      
      // Log the result
      if (data.success && data.hasSubscription) {
        console.log(`User has an active subscription (${data.planType || 'unknown'} plan), expires: ${data.expiresAt || 'unknown'}`);
      } else {
        console.log('User does not have an active subscription');
      }
      
      return data;
    } else {
      console.error('Subscription check failed with error:', data.message);
      throw new Error(data.message || 'Failed to check subscription status');
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    
    // Try to get cached subscription status as fallback
    try {
      const cachedStatus = localStorage.getItem('subscriptionStatus');
      if (cachedStatus) {
        const parsedStatus = JSON.parse(cachedStatus);
        const cacheTime = new Date(parsedStatus.timestamp);
        const now = new Date();
        
        // Use cache if it's less than 5 minutes old
        if ((now - cacheTime) < 5 * 60 * 1000) {
          console.log('Using cached subscription status from', 
                     new Date(parsedStatus.timestamp).toLocaleTimeString());
          console.log('Cached subscription value:', parsedStatus.hasSubscription ? 'Active' : 'Inactive');
          
          return {
            success: true,
            hasSubscription: parsedStatus.hasSubscription,
            active: parsedStatus.hasSubscription, // Add alias for consistency
            planType: parsedStatus.planType,
            expiresAt: parsedStatus.expiresAt,
            fromCache: true
          };
        } else {
          console.log('Cached subscription data is too old:', 
                     Math.round((now - cacheTime) / 60000), 'minutes old');
        }
      } else {
        console.log('No cached subscription data found');
      }
    } catch (cacheError) {
      console.error('Error reading cached subscription status:', cacheError);
    }
    
    // Return default response if cache fails
    return { 
      success: false, 
      hasSubscription: false,
      active: false,
      error: error.message || 'Failed to check subscription status'
    };
  }
};

// Get user's subscription history
export const getSubscriptionHistory = async (forceFresh = false) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Check if we should make the API call or use cached data
    const cacheKey = 'subscription_history';
    const { shouldMakeCall, cachedData } = shouldMakeApiCall(
      cacheKey, 
      CACHE_DURATIONS.HISTORY,
      forceFresh
    );
    
    // Return cached data if available and still valid
    if (!shouldMakeCall && cachedData) {
      return cachedData;
    }
    
    // Make the API call
    const response = await getAPI('/subscriptions/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Cache the result
    cacheApiCallResult(cacheKey, response);
    
    return response;
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    throw error;
  }
};

// Toggle auto-renew for subscription
export const toggleAutoRenew = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await putAPI('/subscriptions/auto-renew', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Invalidate current subscription cache since it changed
    cacheApiCallResult('current_subscription', null);
    
    return response;
  } catch (error) {
    console.error('Error toggling auto-renew:', error);
    throw error;
  }
};

// Purchase a subscription
export const purchaseSubscription = async (data) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    console.log('Purchasing subscription with data:', data);
    
    // Add better validation before making API call
    if (!data.planId) {
      throw new Error('Plan ID is required');
    }
    
    if (!data.paymentMethod) {
      data.paymentMethod = 'coins'; // Default to coins if not specified
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    console.log(`Subscription purchase API response status: ${response.status}`);
    
    const responseData = await response.json();
    console.log('Subscription purchase API response:', responseData);
    
    if (!response.ok) {
      // Throw specific error message from API
      throw new Error(responseData.message || 'Failed to purchase subscription');
    }
    
    // Invalidate current subscription and history caches
    try {
      localStorage.removeItem('subscriptionStatus');
      console.log('Cleared subscription cache after purchase');
    } catch (cacheError) {
      console.warn('Failed to clear subscription cache:', cacheError);
    }
    
    return responseData;
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    throw error;
  }
};

// Update subscription (toggle auto-renew)
export const updateSubscription = async (subscriptionId, data) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await patchAPI(`/subscriptions/${subscriptionId}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Invalidate current subscription and history caches
    cacheApiCallResult('current_subscription', null);
    cacheApiCallResult('subscription_history', null);
    
    return response;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

/*
 * IMPORTANT: Subscription cancellation is disabled
 * Subscriptions cannot be canceled once purchased and are non-refundable
 */
// Update the commented-out function to explicitly return an error when called
export const cancelSubscription = async (subscriptionId, cancelReason) => {
  // Return an error response that matches the server response
  return Promise.reject({
    success: false,
    message: 'Subscription cancellation is not allowed. Subscriptions are non-refundable once purchased.'
  });
};

// Check subscription status using API key
export const checkSubscriptionWithApiKey = async (apiKey) => {
  try {
    if (!apiKey) {
      console.error('checkSubscriptionWithApiKey called without an API key');
      throw new Error('API key is required');
    }
    
    console.log(`Checking subscription status with API key: ${apiKey.substring(0, 5)}...`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/check-api`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    // Log response status to help with debugging
    console.log(`Subscription check API response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Subscription check API response:', data);
    
    if (response.ok) {
      // Add convenient active property for consistent access pattern
      if (data.hasSubscription === undefined && data.active !== undefined) {
        data.hasSubscription = data.active;
      }
      
      if (data.success && data.hasSubscription) {
        console.log('API key has valid subscription - granting access');
      } else {
        console.log('API key does not have an active subscription');
      }
      
      return data;
    } else {
      console.error('Subscription check failed with error:', data.message);
      throw new Error(data.message || 'Failed to check subscription status');
    }
  } catch (error) {
    console.error('Error checking subscription with API key:', error);
    return { 
      success: false, 
      hasSubscription: false,
      active: false,
      error: error.message || 'Failed to check subscription status'
    };
  }
};

export default {
  getCurrentSubscription,
  checkSubscriptionWithApiKey
}; 