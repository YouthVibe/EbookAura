/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Main page (Home) metadata configuration
 * This file defines the metadata for the main landing page of EbookAura
 */

export const mainPageMetadata = {
  title: 'EbookAura - Free PDF Books Library | Read and Download',
  description: 'Discover, read and download thousands of free PDF books at EbookAura. Our digital library offers a vast collection of ebooks in PDF format that you can access instantly.',
  keywords: 'free pdf books, ebooks download, digital library, free ebooks, pdf download, online reading, ebookaura, ebook platform, ebook reader, pdf reader, free books online, download books, read online, digital books, free pdf download, book collection, online books, ebookaura.onrender.com',
  openGraph: {
    title: 'EbookAura - Your Ultimate PDF Books Library',
    description: 'Access thousands of free PDF books at EbookAura. Browse our extensive collection, read online, or download for offline reading. No registration needed for many titles.',
    url: 'https://ebookaura.onrender.com/',
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
    title: 'EbookAura - Free PDF Books Library',
    description: 'Access thousands of free PDF books. Browse our collection, read online, or download for offline reading at EbookAura.',
    images: ['/images/home-page-og.svg'],
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
  verification: {
    google: 'REPLACE_WITH_YOUR_VERIFICATION_CODE', // Replace with your actual Google verification code
    yandex: 'REPLACE_WITH_YANDEX_CODE', // Optional: for Yandex search
    bing: 'REPLACE_WITH_BING_CODE', // Optional: for Bing search
  },
  alternates: {
    canonical: 'https://ebookaura.onrender.com/',
    languages: {
      'en-US': 'https://ebookaura.onrender.com/',
    },
  },
  authors: [
    { name: 'EbookAura Team' }
  ],
  category: 'Books & Literature',
  creator: 'EbookAura',
  publisher: 'EbookAura',
}; 