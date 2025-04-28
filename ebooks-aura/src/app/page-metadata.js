/**
 * Main page (Home) metadata configuration
 * This file defines the metadata for the main landing page of EbookAura
 */

export const mainPageMetadata = {
  title: 'EbookAura - Your Digital Library Companion',
  description: 'Discover, read, and download thousands of ebooks in our extensive digital library. Browse by category or search for your next great read.',
  keywords: 'ebooks, digital library, free books, pdf books, online reading, book download, ebook platform, ebookaura',
  openGraph: {
    title: 'EbookAura Digital Library',
    description: 'Your gateway to thousands of digital books. Browse our collection, read online, or download for offline reading.',
    url: '/',
    siteName: 'EbookAura',
    images: [
      {
        url: '/images/home-page-og.svg',
        width: 1200,
        height: 630,
        alt: 'EbookAura - Digital Library Homepage',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EbookAura Digital Library',
    description: 'Your gateway to thousands of digital books. Browse our collection, read online, or download for offline reading.',
    images: ['/images/home-page-og.svg'],
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
  verification: {
    google: 'google-site-verification-code', // Replace with your actual verification code if available
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
    },
  },
}; 