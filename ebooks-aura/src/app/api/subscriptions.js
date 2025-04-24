/**
 * API functions for subscription operations
 */
import { getAPI, postAPI, putAPI, patchAPI } from './apiUtils';

// Get available subscription plans
export const getSubscriptionPlans = async () => {
  try {
    const response = await getAPI('/subscriptions/plans');
    
    // Handle both response formats (plans field or data field)
    if (response) {
      const plans = response.plans || response.data || [];
      return {
        ...response,
        plans
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Get user's current subscription
export const getCurrentSubscription = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await getAPI('/subscriptions/current', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // If the API returns hasSubscription: false, handle it gracefully
    if (response && response.hasSubscription === false) {
      return { 
        hasSubscription: false, 
        subscription: null,
        message: response.message || 'No active subscription found'
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    throw error;
  }
};

// Get user's subscription history
export const getSubscriptionHistory = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await getAPI('/subscriptions/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Handle both response formats (subscriptions field or data field)
    if (response) {
      const subscriptions = response.subscriptions || response.data || [];
      return {
        ...response,
        subscriptions
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching subscription history:', error);
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
    
    return await postAPI('/subscriptions', data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
    
    return await patchAPI(`/subscriptions/${subscriptionId}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId, reason) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await postAPI(`/subscriptions/${subscriptionId}/cancel`, { cancelReason: reason }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}; 