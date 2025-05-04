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
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Cache the subscription status with timestamp
      try {
        localStorage.setItem('subscriptionStatus', JSON.stringify({
          hasSubscription: data.hasSubscription,
          planType: data.planType,
          expiresAt: data.expiresAt,
          timestamp: new Date().toISOString()
        }));
      } catch (cacheError) {
        console.warn('Failed to cache subscription status:', cacheError);
      }
      
      return data;
    } else {
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
          console.log('Using cached subscription status');
          return {
            success: true,
            hasSubscription: parsedStatus.hasSubscription,
            planType: parsedStatus.planType,
            expiresAt: parsedStatus.expiresAt,
            fromCache: true
          };
        }
      }
    } catch (cacheError) {
      console.error('Error reading cached subscription status:', cacheError);
    }
    
    // Return default response if cache fails
    return { 
      success: false, 
      hasSubscription: false, 
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
    
    const response = await postAPI('/subscriptions', data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Invalidate current subscription and history caches
    cacheApiCallResult('current_subscription', null);
    cacheApiCallResult('subscription_history', null);
    
    return response;
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
      throw new Error('API key is required');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/check-api`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to check subscription status');
    }
  } catch (error) {
    console.error('Error checking subscription with API key:', error);
    return { 
      success: false, 
      hasSubscription: false, 
      error: error.message || 'Failed to check subscription status'
    };
  }
};

export default {
  getCurrentSubscription,
  checkSubscriptionWithApiKey
}; 