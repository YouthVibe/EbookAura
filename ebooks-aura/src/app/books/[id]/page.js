/**
 * Book page - Server Component
 * This component handles static site generation parameters
 * and delegates rendering to the client component
 */

import { Suspense } from 'react';
import { default as DynamicImport } from 'next/dynamic';
import BookPageClient from './BookClientWrapper';

// Configure rendering for this page - using 'auto' instead of 'force-dynamic' for static exports
// Comment out the dynamic setting to allow static generation
// export const dynamic = 'force-dynamic';

// Set revalidation time for static pages (in seconds)
export const revalidate = 3600; // Revalidate every hour

// Server Component using proper params handling for Next.js 13+
export default function BookPage({ params }) {
  return (
    <Suspense fallback={<div className="loading">Loading book...</div>}>
      <BookPageClient params={params} />
    </Suspense>
  );
}

// Generate static paths at build time for static export
export async function generateStaticParams() {
  try {
    console.log('Generating static book pages...');
    
    // Get the API URL with localhost fallback
    const apiUrl = 'https://ebookaura.onrender.com/api';
    
    // Fetch books
    const response = await fetch(`${apiUrl}/books`, {
      next: { revalidate: 3600 } // Revalidate cache every hour
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }
    
    const data = await response.json();
    let bookIds = [];
    
    // Handle different response formats
    if (Array.isArray(data)) {
      bookIds = data.map(book => ({ id: String(book._id || book.id) }));
    } else if (data.books && Array.isArray(data.books)) {
      bookIds = data.books.map(book => ({ id: String(book._id || book.id) }));
    }
    
    console.log(`Generated static params for ${bookIds.length} book pages`);
    return bookIds;
  } catch (error) {
    console.error('Error generating static book paths:', error);
    // Return at least some IDs for static generation
    return [
      { id: '6803d0c8cd7950184b1e8cf3' }
    ];
  }
} 