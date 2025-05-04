/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
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
    
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coins`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to get coin balance');
      }
      return res.json();
    });
  } catch (error) {
    console.error('Error getting user coins:', error);
    throw error;
  }
};

// Update session time
export const updateSessionTime = async (sessionDuration) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coins/update-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionDuration })
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to update session time');
      }
      return res.json();
    });
  } catch (error) {
    console.error('Error updating session time:', error);
    throw error;
  }
};

// Get user's session time stats
export const getSessionStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coins/session-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to get session status');
      }
      return res.json();
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    throw error;
  }
};

// Claim activity reward coins
export const claimActivityRewardCoins = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coins/activity-reward`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.message || 'Failed to claim activity reward');
        });
      }
      return res.json();
    });
  } catch (error) {
    console.error('Error claiming activity reward coins:', error);
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
    
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coins/daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.message || 'Failed to claim daily coins');
        });
      }
      return res.json();
    });
  } catch (error) {
    console.error('Error claiming daily coins:', error);
    throw error;
  }
};

// Check daily coins status
export const checkDailyCoinsStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coins/daily-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to check daily coins status');
      }
      return res.json();
    });
  } catch (error) {
    console.error('Error checking daily coins status:', error);
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
    
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coins/ad-reward`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to claim ad reward coins');
      }
      return res.json();
    });
  } catch (error) {
    console.error('Error claiming ad reward coins:', error);
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