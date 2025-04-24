'use client';

/**
 * Client component wrapper for BookPageClient
 * This handles any client-side logic before rendering the main component
 */

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../context/AuthContext';

// Dynamically import the BookPageClient component to avoid PDF.js related SSR issues
const BookPageClient = dynamic(() => import('./BookPageClient'), {
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
        } else {
          throw new Error('Could not extract valid book ID from path');
        }
      } catch (err) {
        console.error('Error determining book ID:', err);
        setError('Could not determine which book to display');
      } finally {
        setIsLoading(false);
      }
    };

    determineBookId();
  }, [serverParams, clientParams, pathname, router]);

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
        display: "none" // Hide debug information
      }}>
        <h3>Debug Information</h3>
        <p><strong>Current Path:</strong> {pathname}</p>
        <p><strong>Server Params ID:</strong> {serverParams?.id || 'none'}</p>
        <p><strong>Client Params ID:</strong> {clientParams?.id || 'none'}</p>
        <p><strong>Extracted Book ID:</strong> {bookId || 'none'}</p>
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
        display: "none" // Hide debug information
      }}>
        <h3>Debug Information</h3>
        <p><strong>Current Path:</strong> {pathname}</p>
        <p><strong>Server Params ID:</strong> {serverParams?.id || 'none'}</p>
        <p><strong>Client Params ID:</strong> {clientParams?.id || 'none'}</p>
        <p><strong>Extracted Book ID:</strong> {bookId || 'none'}</p>
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
          onClick={() => {
            const newId = prompt("Enter a valid book ID to try:");
            if (newId) {
              router.push(`/books/${newId}`);
            }
          }} 
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Try Another ID
        </button>
      </div>
    </div>;
  }

  // Render the BookPageClient component with the book ID
  return <BookPageClient id={bookId} />;
} 