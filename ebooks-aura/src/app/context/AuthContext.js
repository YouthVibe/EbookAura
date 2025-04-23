'use client';

import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAPI, postAPI } from '../api/apiUtils';

// Create context
const AuthContext = createContext();

// Generate a random API key if needed
const generateApiKey = () => {
  return 'ak_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  // Track token validation status
  const validatingTokenRef = useRef(false);
  const tokenValidatedRef = useRef(false);

  // Only run on client-side
  useEffect(() => {
    setMounted(true);
    
    const initializeAuth = async () => {
      try {
        // Check for stored user info
        const userInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        const apiKey = localStorage.getItem('apiKey');
        
        if (userInfo && token) {
          try {
            // Set user from localStorage immediately to prevent flashing logged-out state
            setUser(JSON.parse(userInfo));
            
            // Validate token with the server, but don't block rendering
            if (!validatingTokenRef.current && !tokenValidatedRef.current) {
              validatingTokenRef.current = true;
              
              try {
                await getAPI('/auth/check', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                // Token is valid
                tokenValidatedRef.current = true;
              } catch (error) {
                console.error('Token validation failed:', error);
                
                // On production, retry once before logging out
                if (window.location.hostname !== 'localhost') {
                  try {
                    console.log('Retrying token validation...');
                    
                    // Wait a moment before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    await getAPI('/auth/check', {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    
                    // Retry succeeded
                    tokenValidatedRef.current = true;
                  } catch (retryError) {
                    console.error('Token validation retry failed:', retryError);
                    logout();
                  }
                } else {
                  logout();
                }
              } finally {
                validatingTokenRef.current = false;
              }
            }
          } catch (parseError) {
            console.error('Failed to parse user info:', parseError);
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            localStorage.removeItem('apiKey');
          }
        }
      } finally {
        // Always mark as done loading
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = (userData) => {
    console.log('Processing login data');
    
    if (!userData) {
      console.error('No user data received for login');
      return;
    }
    
    try {
      // Check if we have a token
      if (!userData.token) {
        console.error('No token in login data');
        return;
      }
      
      // Store user data without the token
      const { token, ...userDataWithoutToken } = userData;
      
      console.log('Setting user data:', userDataWithoutToken);
      setUser(userDataWithoutToken);
      
      // Store data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify(userDataWithoutToken));
        localStorage.setItem('token', token);
        
        // Generate and store API key if not exists
        let apiKey = localStorage.getItem('apiKey');
        if (!apiKey) {
          console.log('Generating new API key');
          apiKey = generateApiKey();
          localStorage.setItem('apiKey', apiKey);
        }
        
        console.log('Authentication data stored in localStorage');
      }
    } catch (error) {
      console.error('Error processing login:', error);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      // Don't remove API key on logout for better UX across sessions
    }
    router.push('/login');
  };

  // Get the stored token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Get the API key
  const getApiKey = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('apiKey');
    }
    return null;
  };

  // Update user coins
  const updateUserCoins = (newCoinAmount) => {
    if (user) {
      const updatedUser = { ...user, coins: newCoinAmount };
      setUser(updatedUser);
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      }
    }
  };

  // Return a loading state during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, isLoggedIn: false, loading: true, login, logout, getToken, getApiKey, updateUserCoins }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, logout, getToken, getApiKey, updateUserCoins }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 