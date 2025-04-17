/**
 * Book page - Server Component
 * This component handles static site generation parameters
 * and delegates rendering to the client component
 */

import BookPageClient from './BookClientWrapper';

// Server Component - simple pass-through to client component
export default function BookPage({ params }) {
  // Simply pass the ID from params to client component
  return <BookPageClient id={params.id} />;
}

// Generate static paths at build time for static export
export async function generateStaticParams() {
  try {
    console.log('Generating static book pages...');
    
    // Get the API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ebookaura.onrender.com/api';
    
    // Fetch books
    const response = await fetch(`${apiUrl}/books`);
    
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
      { id: '650f5a5c5e5b4a50015c5e5b4' },
      { id: '650f5a5c5e5b4a50015c5e5b5' }
    ];
  }
} 