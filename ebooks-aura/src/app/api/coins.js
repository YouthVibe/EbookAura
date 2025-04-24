/**
 * API functions for coin operations
 */
import { getAPI, postAPI } from './apiUtils';

// Get user's coin balance
export const getUserCoins = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await getAPI('/coins', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error fetching coins:', error);
    throw error;
  }
};

// Check if daily coins have been claimed already
export const checkDailyCoinsStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await getAPI('/coins/daily-status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error checking daily coins status:', error);
    throw error;
  }
};

// Claim daily coins
export const claimDailyCoins = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await postAPI('/coins/daily', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error claiming daily coins:', error);
    throw error;
  }
};

// Claim ad reward coins
export const claimAdRewardCoins = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await postAPI('/coins/ad-reward', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error claiming ad reward coins:', error);
    throw error;
  }
};

// Purchase a premium book with coins
export const purchaseBook = async (bookId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await postAPI(`/coins/purchase/${bookId}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error purchasing book:', error);
    throw error;
  }
};

// Check if user has purchased a book
export const checkBookPurchase = async (bookId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await getAPI(`/users/check-purchase/${bookId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error checking book purchase:', error);
    throw error;
  }
}; 