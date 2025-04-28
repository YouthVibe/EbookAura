/**
 * API functions for subscription operations
 */
import { getAPI, postAPI, putAPI, patchAPI, shouldMakeApiCall, cacheApiCallResult } from './apiUtils';

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
export const getCurrentSubscription = async (forceFresh = false) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Check if we should make the API call or use cached data
    const cacheKey = 'current_subscription';
    const { shouldMakeCall, cachedData } = shouldMakeApiCall(
      cacheKey, 
      CACHE_DURATIONS.CURRENT,
      forceFresh
    );
    
    // Return cached data if available and still valid
    if (!shouldMakeCall && cachedData) {
      return cachedData;
    }
    
    // Make the API call
    const response = await getAPI('/subscriptions/current', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Cache the result
    cacheApiCallResult(cacheKey, response);
    
    return response;
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    throw error;
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