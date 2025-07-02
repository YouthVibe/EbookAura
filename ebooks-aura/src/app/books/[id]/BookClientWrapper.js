'use client';

/**
 * Client component wrapper for BookPageClient
 * This handles any client-side logic before rendering the main component
 */

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../context/AuthContext';

// Dynamically import the BookPageClient component with improved loading
const BookPageClient = dynamic(() => import('./BookPageClient').catch(err => {
  console.error('Error loading BookPageClient:', err);
  return () => (
    <div className="error-container">
      <h2>Error Loading Book Component</h2>
      <p>There was a problem loading the book viewer. Please try refreshing the page.</p>
    </div>
  );
}), {
  ssr: false,
  loading: () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading book information...</p>
    </div>
  )
});

/**
 * BookClientWrapper - Client Component
 * This component handles extracting the book ID from different sources:
 * 1. Server-provided params 
 * 2. Client-side params (useParams)
 * 3. URL path parsing as fallback
 */
export default function BookClientWrapper({ params: serverParams }) {
  // State for the book ID and loading status
  const [bookId, setBookId] = useState(serverParams?.id || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [debugInfo, setDebugInfo] = useState({});
  
  // Client-side navigation params
  const clientParams = useParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // Get auth context
  const { user, isLoggedIn } = useAuth();
  
  // Debug auth state
  useEffect(() => {
    // Keep the console log for developers but not visible to users
    console.log('BookClientWrapper - Auth State:', { 
      isLoggedIn, 
      user: user ? 'exists' : 'null',
      userId: user?.id,
      coins: user?.coins
    });
    
    // Get and store API URL for debugging
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || '/api');
    console.log('API URL from env:', process.env.NEXT_PUBLIC_API_URL);
    
    // Check if static export mode is enabled
    console.log('Static export:', process.env.STATIC_EXPORT);
    
    // Add to debug info
    setDebugInfo(prev => ({
      ...prev,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
      staticExport: process.env.STATIC_EXPORT,
      isServerSide: typeof window === 'undefined',
    }));
  }, [user, isLoggedIn]);

  useEffect(() => {
    // Function to extract book ID from different sources
    const determineBookId = () => {
      // Try to get ID from server params first (SSR/SSG)
      if (serverParams?.id) {
        // Skip the not-found ID for actual book rendering
        if (serverParams.id === 'not-found') {
          console.error('Not-found ID detected, showing error UI');
          setError('Book not found. Please try searching for another book.');
          setIsLoading(false);
          return;
        }
        
        console.log('Using server-provided ID:', serverParams.id);
        setBookId(serverParams.id);
        setIsLoading(false);
        setDebugInfo(prev => ({ ...prev, idSource: 'server', id: serverParams.id }));
        return;
      }
      
      // Then try client params (CSR)
      if (clientParams?.id) {
        // Skip the not-found ID for actual book rendering
        if (clientParams.id === 'not-found') {
          console.error('Not-found ID detected, showing error UI');
          setError('Book not found. Please try searching for another book.');
          setIsLoading(false);
          return;
        }
        
        console.log('Using client params ID:', clientParams.id);
        setBookId(clientParams.id);
        setIsLoading(false);
        setDebugInfo(prev => ({ ...prev, idSource: 'client', id: clientParams.id }));
        return;
      }
      
      // Fallback: try to extract from URL path
      try {
        const pathParts = pathname.split('/');
        // Find the first non-empty string after 'books' in the path
        let idFromPath = '';
        
        // Loop through parts to find the book ID
        for (let i = 0; i < pathParts.length; i++) {
          if (pathParts[i] === 'books' && i + 1 < pathParts.length) {
            idFromPath = pathParts[i + 1];
            break;
          }
        }
        
        console.log('Path parts:', pathParts);
        console.log('Raw ID from path:', idFromPath);
        
        // Remove trailing slash if present
        const cleanId = idFromPath?.endsWith('/') 
          ? idFromPath.substring(0, idFromPath.length - 1) 
          : idFromPath;
        
        // Remove any query parameters
        const finalId = cleanId?.split('?')[0];
        
        console.log('Clean ID after processing:', finalId);
        
        if (finalId && finalId !== '' && finalId !== 'not-found' && finalId !== 'undefined') {
          console.log('Using ID extracted from path:', finalId);
          setBookId(finalId);
          setDebugInfo(prev => ({ ...prev, idSource: 'path', id: finalId }));
        } else {
          throw new Error('Could not extract valid book ID from path');
        }
      } catch (err) {
        console.error('Error determining book ID:', err);
        setError('Could not determine which book to display');
        setDebugInfo(prev => ({ ...prev, error: err.message }));
      } finally {
        setIsLoading(false);
      }
    };

    determineBookId();
  }, [serverParams, clientParams, pathname, router]);

  // Effect to test API connectivity
  useEffect(() => {
    if (bookId) {
      const testApiEndpoint = async () => {
        try {
          const endpoint = `/books/${bookId}`;
          const apiUrlToUse = process.env.NEXT_PUBLIC_API_URL || '/api';
          const fullUrl = apiUrlToUse + endpoint;
          
          console.log(`Testing API connectivity to: ${fullUrl}`);
          
          // Make a simple fetch request to test connectivity
          const response = await fetch(fullUrl);
          const status = response.status;
          
          console.log(`API connectivity test result: ${status} (${response.statusText})`);
          
          setDebugInfo(prev => ({ 
            ...prev, 
            apiTest: { 
              endpoint: fullUrl,
              status,
              timestamp: new Date().toISOString()
            } 
          }));
          
          if (!response.ok) {
            setDebugInfo(prev => ({ 
              ...prev, 
              apiError: `API returned status ${status} - ${response.statusText}`
            }));
          }
        } catch (error) {
          console.error('API connectivity test failed:', error);
          setDebugInfo(prev => ({ 
            ...prev, 
            apiError: error.message
          }));
        }
      };
      
      testApiEndpoint();
    }
  }, [bookId]);

  if (isLoading) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading book information...</p>
    </div>;
  }

  if (error) {
    return <div className="error-container" style={{
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ color: "#dc3545" }}>Error</h2>
      <p>{error}</p>
      
      <div style={{ 
        margin: "20px 0",
        padding: "10px",
        backgroundColor: "#e9ecef",
        borderRadius: "4px",
        fontSize: "14px",
        display: "block" // Show debug information
      }}>
        <h3>Debug Information</h3>
        <p><strong>Current Path:</strong> {pathname}</p>
        <p><strong>Server Params ID:</strong> {serverParams?.id || 'none'}</p>
        <p><strong>Client Params ID:</strong> {clientParams?.id || 'none'}</p>
        <p><strong>Extracted Book ID:</strong> {bookId || 'none'}</p>
        <p><strong>API URL:</strong> {apiUrl}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        <p><strong>Static Export:</strong> {process.env.STATIC_EXPORT || 'not set'}</p>
        <p><strong>API Test:</strong> {JSON.stringify(debugInfo.apiTest || {})}</p>
        <p><strong>API Error:</strong> {debugInfo.apiError || 'none'}</p>
      </div>
      
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          onClick={() => router.back()} 
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Go Back
        </button>
        <button 
          onClick={() => router.push('/search')} 
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Browse Books
        </button>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Reload Page
        </button>
      </div>
    </div>;
  }

  // Only render the BookPageClient if we have a valid ID
  if (!bookId || bookId === 'not-found') {
    return <div className="error-container" style={{
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ color: "#dc3545" }}>Book Not Found</h2>
      <p>The requested book could not be found or the ID is invalid.</p>
      
      <div style={{ 
        margin: "20px 0",
        padding: "10px",
        backgroundColor: "#e9ecef",
        borderRadius: "4px",
        fontSize: "14px",
        display: "block" // Show debug information
      }}>
        <h3>Debug Information</h3>
        <p><strong>Current Path:</strong> {pathname}</p>
        <p><strong>Server Params ID:</strong> {serverParams?.id || 'none'}</p>
        <p><strong>Client Params ID:</strong> {clientParams?.id || 'none'}</p>
        <p><strong>Extracted Book ID:</strong> {bookId || 'none'}</p>
        <p><strong>API URL:</strong> {apiUrl}</p>
      </div>
      
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          onClick={() => router.back()} 
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Go Back
        </button>
        <button 
          onClick={() => router.push('/search')} 
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Browse Books
        </button>
      </div>
    </div>;
  }

  // Render normal book page with additional debug info
  return (
    <>
      <BookPageClient id={bookId} />
      
      {/* Debug button - only in development */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          zIndex: 1000,
          backgroundColor: '#f8f9fa',
          padding: '5px 10px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '12px'
        }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Info</summary>
            <div style={{ maxWidth: '400px', overflowX: 'auto' }}>
              <p><strong>Book ID:</strong> {bookId}</p>
              <p><strong>API URL:</strong> {apiUrl}</p>
              <p><strong>API Test:</strong> {JSON.stringify(debugInfo.apiTest || {})}</p>
              <p><strong>API Error:</strong> {debugInfo.apiError || 'none'}</p>
              <p><strong>ID Source:</strong> {debugInfo.idSource}</p>
              <p><strong>Static Export:</strong> {process.env.STATIC_EXPORT || 'not set'}</p>
            </div>
          </details>
        </div>
      )}
    </>
  );
} 