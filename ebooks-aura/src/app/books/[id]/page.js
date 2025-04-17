// This is a server component that generates static paths
import { API_ENDPOINTS } from '../../utils/config';

// This function is required for static exports
// It tells Next.js which paths to pre-render for [id]
export async function generateStaticParams() {
  // For static builds, we'll use a predefined list of book IDs
  // You can replace this with an API call to get all book IDs if needed during build time
  
  // Attempt to fetch book IDs from the API during build time
  try {
    console.log('Attempting to fetch book IDs for static generation...');
    
    // This is a server-side function, so we can make direct fetch requests
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://ebookaura.onrender.com/api'}/books`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract book IDs from the response
    const bookIds = [];
    
    // Handle different response formats
    if (Array.isArray(data)) {
      // If the response is an array of books
      bookIds.push(...data.map(book => ({ id: book._id || book.id })));
    } else if (data.books && Array.isArray(data.books)) {
      // If the response has a books array property
      bookIds.push(...data.books.map(book => ({ id: book._id || book.id })));
    }
    
    console.log(`Generated static params for ${bookIds.length} book pages`);
    return bookIds;
  } catch (error) {
    console.error('Error generating static params for books:', error);
    
    // Fallback to some sample IDs if the API call fails
    // This ensures we at least have some pages generated
    return [
      { id: '60f5a5c5e5b4a50015c5e5b4' },  // Sample ID 1
      { id: '60f5a5c5e5b4a50015c5e5b5' },  // Sample ID 2
      { id: '60f5a5c5e5b4a50015c5e5b6' }   // Sample ID 3
    ];
  }
}

// Import the client component for the book page content
import BookPageClient from './BookPageClient';

// Server component that renders the client component
export default function BookPage({ params }) {
  // The params object contains the route parameters (id in this case)
  return <BookPageClient id={params.id} />;
} 