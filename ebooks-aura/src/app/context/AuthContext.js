'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  // Only run on client-side
  useEffect(() => {
    setMounted(true);
    // Check for stored user info
    const userInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    if (userInfo && token) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('Failed to parse user info:', error);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('apiKey');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData) => {
    // Store user data without the token
    const { token, ...userDataWithoutToken } = userData;
    setUser(userDataWithoutToken);
    
    // Store data in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(userDataWithoutToken));
      localStorage.setItem('token', token);
      
      // Generate and store API key if not exists
      let apiKey = localStorage.getItem('apiKey');
      if (!apiKey) {
        apiKey = generateApiKey();
        localStorage.setItem('apiKey', apiKey);
      }
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

  // Return a loading state during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, loading: true, login, logout, getToken, getApiKey }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken, getApiKey }}>
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