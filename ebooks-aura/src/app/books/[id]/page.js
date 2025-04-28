/**
 * Book page - Server Component
 * This component handles static site generation parameters
 * and delegates rendering to the client component
 */

import { Suspense } from 'react';
import { default as DynamicImport } from 'next/dynamic';
import BookPageClient from './BookClientWrapper';
import STATIC_BOOKS from '../../utils/STATIC_BOOKS';

// Configure rendering for this page - using 'auto' instead of 'force-dynamic' for static exports
// export const dynamic = 'force-dynamic';

// For static exports, we cannot use dynamicParams
// export const dynamicParams = true;

// Set revalidation time for static pages (in seconds)
export const revalidate = 3600;

// Define default metadata for the book page (used internally only)
const defaultMetadata = {
  title: 'Book Details - EbookAura',
  description: 'View book details, read and download PDFs',
};

// Dynamic metadata generation for social media previews
export async function generateMetadata(props) {
  // Properly await the params object before accessing properties
  const params = await Promise.resolve(props.params);

  try {
    const id = params?.id;
    if (!id || id === 'not-found') {
      return defaultMetadata;
    }

    // Get the API URL with localhost fallback
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ebooks-aura.com';
    
    // Fetch book details for metadata
    const response = await fetch(`${apiUrl}/books/${id}`, {
      next: { revalidate: 3600 }, // Revalidate cache every hour
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch book: ${response.status}`);
    }
    
    const book = await response.json();

    // Format the file size
    const formatFileSize = (sizeInBytes) => {
      if (!sizeInBytes) return 'Unknown size';
      
      const kb = sizeInBytes / 1024;
      if (kb < 1024) {
        return `${Math.round(kb * 10) / 10} KB`;
      }
      const mb = kb / 1024;
      return `${Math.round(mb * 10) / 10} MB`;
    };

    // Get the book cover URL (ensure it's an absolute URL)
    const coverUrl = book.coverImage && book.coverImage.startsWith('http')
      ? book.coverImage
      : `${siteUrl}${book.coverImage && book.coverImage.startsWith('/') ? '' : '/'}${book.coverImage || '/images/default-cover.jpg'}`;

    // Create description with book details
    const description = `${book.title || 'Book'} by ${book.author || 'Unknown Author'}. ${book.description ? book.description.substring(0, 150) + '...' : ''} Format: PDF, Size: ${formatFileSize(book.fileSize)}, Rating: ${book.averageRating ? book.averageRating.toFixed(1) + '/5' : 'Not rated'}`;

    return {
      title: `${book.title || 'Book'} by ${book.author || 'Unknown Author'} - EbookAura`,
      description,
      openGraph: {
        title: `${book.title || 'Book'} by ${book.author || 'Unknown Author'}`,
        description,
        url: `${siteUrl}/books/${id}`,
        siteName: 'EbookAura',
        images: [
          {
            url: coverUrl,
            width: 600,
            height: 900,
            alt: `Cover of ${book.title || 'book'}`,
          },
        ],
        locale: 'en_US',
        type: 'book',
        book: {
          authors: [book.author || 'Unknown Author'],
          isbn: book.isbn || '',
          releaseDate: book.publicationDate || '',
        },
      },
      twitter: {
        card: 'summary_large_image',
        title: `${book.title || 'Book'} by ${book.author || 'Unknown Author'}`,
        description,
        images: [coverUrl],
      },
      other: {
        'book:author': book.author || 'Unknown Author',
        'book:isbn': book.isbn || '',
        'book:page_count': book.pageCount || '',
        'book:release_date': book.publicationDate || '',
        'og:price:amount': book.price || '0',
        'og:price:currency': 'Coins',
      },
    };
  } catch (error) {
    console.error('Error generating book metadata:', error);
    return defaultMetadata;
  }
}

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    console.log(`Using API URL: ${apiUrl}`);
    
    // Create a map to track all the IDs we're including
    const bookIdMap = new Map();
    
    // Add all static books first to ensure they're included even if API fails
    for (const staticId of STATIC_BOOKS) {
      bookIdMap.set(staticId, { id: staticId, source: 'static' });
    }
    
    console.log(`Added ${STATIC_BOOKS.length} books from STATIC_BOOKS list`);
    
    try {
      // Fetch books
      console.log(`Fetching books from API: ${apiUrl}/books?limit=200`);
      const response = await fetch(`${apiUrl}/books?limit=200`, {
        next: { revalidate: 3600 }, // Revalidate cache every hour
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        data.forEach(book => {
          const id = String(book._id || book.id);
          bookIdMap.set(id, { id, source: 'api-array' });
        });
        console.log(`Added ${data.length} books from API (array format)`);
      } else if (data.books && Array.isArray(data.books)) {
        data.books.forEach(book => {
          const id = String(book._id || book.id);
          bookIdMap.set(id, { id, source: 'api-object' });
        });
        console.log(`Added ${data.books.length} books from API (object format)`);
      }
    } catch (apiError) {
      console.error(`Error fetching books from API: ${apiError.message}`);
      console.log('Continuing with static books only');
    }
    
    // Add a specific book ID that was causing errors
    const problematicId = '6807c9d24fb1873f72080fb1';
    if (!bookIdMap.has(problematicId)) {
      console.log(`Adding previously problematic book ID: ${problematicId}`);
      bookIdMap.set(problematicId, { id: problematicId, source: 'manual-fix' });
    }
    
    // Always include a catch-all "not-found" page that will show a proper error UI
    bookIdMap.set('not-found', { id: 'not-found', source: 'catch-all' });
    
    // Convert map to array of params objects
    const bookIds = Array.from(bookIdMap.values()).map(entry => ({ id: entry.id }));
    
    console.log(`Generated static params for ${bookIds.length} book pages`);
    // Log a few examples to verify
    if (bookIds.length > 0) {
      console.log(`Example IDs: ${bookIds.slice(0, 3).map(b => b.id).join(', ')}${bookIds.length > 3 ? '...' : ''}`);
    }
    
    return bookIds;
  } catch (error) {
    console.error('Error generating static book paths:', error);
    
    // Create a comprehensive fallback that includes all possible IDs we know about
    const fallbackIds = [
      ...STATIC_BOOKS,
      '6807c9d24fb1873f72080fb1' // Explicitly add the problematic ID
    ].map(id => ({ id }));
    
    // Add not-found for the catch-all case
    fallbackIds.push({ id: 'not-found' });
    
    console.log(`Fallback: Generated ${fallbackIds.length} static params`);
    return fallbackIds;
  }
} 