'use client';

/**
 * Client component wrapper for BookPageClient
 * This handles any client-side logic before rendering the main component
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BookPageClient from './BookPageClient';

export default function BookClientWrapper({ id: serverSideId }) {
  // Use client-side params hook as a fallback
  const params = useParams();
  const [bookId, setBookId] = useState(serverSideId);
  
  // Extract ID from URL if not provided by server
  useEffect(() => {
    if (!bookId && params?.id) {
      console.log('Using ID from client params:', params.id);
      setBookId(params.id);
    } else if (!bookId && typeof window !== 'undefined') {
      // Last resort fallback: get ID from URL path
      const pathParts = window.location.pathname.split('/');
      const pathId = pathParts[pathParts.length - 1];
      
      if (pathId) {
        console.log('Using ID from URL path:', pathId);
        setBookId(pathId);
      }
    }
  }, [bookId, params]);
  
  return <BookPageClient id={bookId} />;
} 