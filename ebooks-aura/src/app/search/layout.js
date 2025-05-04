/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Search page layout with metadata
 */

export const metadata = {
  title: 'Search PDF Books - EbookAura | Free Books Collection',
  description: 'Search and browse our extensive library of free PDF books by category, title, or author. Find and download your next great read from our collection of ebooks at EbookAura.',
  keywords: 'search books, free pdf books, ebook search, pdf download, book finder, free ebooks, ebookaura, ebook collection, pdf reader, book search, download books, read online, free pdf download, search pdf books, ebookaura.onrender.com',
  openGraph: {
    title: 'Search Our Free PDF Book Collection - EbookAura',
    description: 'Discover your next great read from our extensive collection of free PDF books. Search by title, author, or explore categories at EbookAura.',
    url: 'https://ebookaura.onrender.com/search',
    siteName: 'EbookAura',
    images: [
      {
        url: '/images/search-page-og.svg', // Using SVG directly - can be replaced with JPG later
        width: 1200,
        height: 630,
        alt: 'EbookAura - Digital Book Library Search',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search PDF Books - EbookAura | Free Books Collection',
    description: 'Find your next great read from our extensive digital library. Browse by category or search for specific titles and authors at EbookAura.',
    images: ['/images/search-page-og.svg'], // Using SVG directly - can be replaced with JPG later
    site: '@EbookAura',
    creator: '@EbookAura',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://ebookaura.onrender.com/search',
  },
  category: 'Books & Literature',
  creator: 'EbookAura',
  publisher: 'EbookAura',
};

export default function SearchLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
} 