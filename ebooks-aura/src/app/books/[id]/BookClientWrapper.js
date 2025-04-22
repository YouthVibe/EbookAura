'use client';

/**
 * Client component wrapper for BookPageClient
 * This handles any client-side logic before rendering the main component
 */

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

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
        const idFromPath = pathParts[pathParts.length - 1];
        
        // Remove trailing slash if present
        const cleanId = idFromPath.endsWith('/') 
          ? idFromPath.substring(0, idFromPath.length - 1) 
          : idFromPath;
        
        if (cleanId && cleanId !== '' && cleanId !== 'not-found') {
          console.log('Using ID extracted from path:', cleanId);
          setBookId(cleanId);
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
    return <div className="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button 
        onClick={() => router.back()} 
        className="back-button"
      >
        Go Back
      </button>
    </div>;
  }

  // Only render the BookPageClient if we have a valid ID
  if (!bookId || bookId === 'not-found') {
    return <div className="error-container">
      <h2>Book Not Found</h2>
      <p>The requested book could not be found.</p>
      <button 
        onClick={() => router.push('/search')} 
        className="back-button"
      >
        Browse Books
      </button>
    </div>;
  }

  return <BookPageClient id={bookId} />;
} 