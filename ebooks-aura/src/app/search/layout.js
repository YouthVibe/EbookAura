/**
 * Search page layout with metadata
 */

export const metadata = {
  title: 'Search Books - EbookAura',
  description: 'Search and browse our extensive library of ebooks by category, title, or keywords. Find your next great read from our collection of PDF books.',
  keywords: 'ebook search, free ebooks, book catalog, digital library, PDF books, online books, book finder',
  openGraph: {
    title: 'Search Our Book Collection - EbookAura',
    description: 'Discover your next great read from our extensive collection of ebooks. Search by title, author, or explore categories.',
    url: '/search',
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
    title: 'Search Books - EbookAura',
    description: 'Find your next great read from our extensive digital library. Browse by category or search for specific titles.',
    images: ['/images/search-page-og.svg'], // Using SVG directly - can be replaced with JPG later
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
    },
  },
};

export default function SearchLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
} 