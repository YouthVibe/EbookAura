/**
 * Book page - Server Component
 * This component handles static site generation parameters
 * and delegates rendering to the client component
 */

import { Suspense } from 'react';
import { default as DynamicImport } from 'next/dynamic';
import BookPageClient from './BookClientWrapper';
import STATIC_BOOKS from '../../utils/STATIC_BOOKS';
import Script from 'next/script';

// Configure rendering for this page to be dynamic
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fetch book details for metadata
    const response = await fetch(`${apiUrl}/books/${id}`, {
      cache: 'no-store', // Don't cache for dynamic data
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
      } catch (e) {
        // Ignore JSON parse error for error response
      }
      return defaultMetadata;
    }
    
    let book = await response.json();

    // Normalize MongoDB Extended JSON values recursively
    const normalizeMongoValue = (value) => {
      if (!value) return value;
      
      if (typeof value === 'object') {
        if ('$numberInt' in value) return parseInt(value['$numberInt']);
        if ('$numberDouble' in value) return parseFloat(value['$numberDouble']);
        if ('$numberDecimal' in value) return parseFloat(value['$numberDecimal']);
        if ('$date' in value) return new Date(value['$date']);
        
        if (Array.isArray(value)) {
          return value.map(item => normalizeMongoValue(item));
        }
        
        const normalized = {};
        for (const [key, val] of Object.entries(value)) {
          normalized[key] = normalizeMongoValue(val);
        }
        return normalized;
      }
      
      return value;
    };

    // Normalize the entire book object recursively
    book = normalizeMongoValue(book);

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
      keywords: `${book.title}, ${book.author}, ${book.categories?.join(', ') || ''}, PDF, ebook, free book, read online, download pdf, ebookaura`,
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

// Get structured data for a book
async function getBookStructuredData(params) {
  try {
    // Ensure params is resolved before accessing
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? String(resolvedParams.id) : null;
    if (!id || id === 'not-found') {
      return null;
    }

    // Get the API URL with localhost fallback
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fetch book details
    const response = await fetch(`${apiUrl}/books/${id}`, {
      cache: 'no-store', // Don't cache for dynamic data
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
      } catch (e) {
        // Ignore JSON parse error for error response
      }
      return null;
    }
    
    let book = await response.json();

    // Normalize MongoDB Extended JSON values recursively
    const normalizeMongoValue = (value) => {
      if (!value) return value;
      
      if (typeof value === 'object') {
        if ('$numberInt' in value) return parseInt(value['$numberInt']);
        if ('$numberDouble' in value) return parseFloat(value['$numberDouble']);
        if ('$numberDecimal' in value) return parseFloat(value['$numberDecimal']);
        if ('$date' in value) return new Date(value['$date']);
        
        if (Array.isArray(value)) {
          return value.map(item => normalizeMongoValue(item));
        }
        
        const normalized = {};
        for (const [key, val] of Object.entries(value)) {
          normalized[key] = normalizeMongoValue(val);
        }
        return normalized;
      }
      
      return value;
    };

    // Normalize the entire book object recursively
    book = normalizeMongoValue(book);

    // Get the book cover URL (ensure it's an absolute URL)
    const coverUrl = book.coverImage && book.coverImage.startsWith('http')
      ? book.coverImage
      : `${siteUrl}${book.coverImage && book.coverImage.startsWith('/') ? '' : '/'}${book.coverImage || '/images/default-cover.jpg'}`;

    // Format publication date if available
    const publicationDate = book.publicationDate ? new Date(book.publicationDate).toISOString().split('T')[0] : undefined;

    // Build structured data for search engines
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Book",
      "name": book.title,
      "author": {
        "@type": "Person",
        "name": book.author || "Unknown Author"
      },
      "url": `${siteUrl}/books/${id}`,
      "workExample": {
        "@type": "Book",
        "bookFormat": "http://schema.org/EBook",
        "potentialAction": {
          "@type": "ReadAction",
          "target": `${siteUrl}/books/${id}`
        }
      },
      "image": coverUrl,
      "description": book.description || `Read ${book.title} by ${book.author} online at EbookAura.`
    };

    // Add optional fields if available
    if (book.isbn) structuredData.isbn = book.isbn;
    if (publicationDate) structuredData.datePublished = publicationDate;
    if (book.publisher) structuredData.publisher = { "@type": "Organization", "name": book.publisher };
    if (book.pageCount) structuredData.numberOfPages = book.pageCount;
    if (book.language) structuredData.inLanguage = book.language;
    if (book.categories && book.categories.length) structuredData.genre = book.categories[0];
    if (book.averageRating) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": book.averageRating,
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": book.ratingCount || 1
      };
    }

    // Add offers data for free book
    structuredData.offers = {
      "@type": "Offer",
      "availability": "http://schema.org/InStock",
      "price": book.price || "0",
      "priceCurrency": "USD",
      "url": `${siteUrl}/books/${id}`
    };

    return structuredData;
  } catch (error) {
    console.error('Error generating book structured data:', error);
    return null;
  }
}

// Server Component with dynamic rendering
export default async function BookPage({ params }) {
  // Ensure params is resolved before passing to getBookStructuredData
  const resolvedParams = await Promise.resolve(params);
  const structuredData = await getBookStructuredData(resolvedParams);
  
  return (
    <>
      {/* Add structured data for search engines */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      
      <Suspense fallback={<div className="loading">Loading book...</div>}>
        <BookPageClient params={params} />
      </Suspense>
    </>
  );
}

// Remove generateStaticParams since we're using dynamic rendering