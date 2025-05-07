/**
 * Layout for book pages
 * This provides the outer structure for dynamic book routes
 */

import React from 'react';

// Using a static approach that doesn't need headers() function
export default function BookLayout({ children }) {
  return (
    <section className="book-page-wrapper">
      {children}
    </section>
  );
}

// Metadata for the book section
export const metadata = {
  title: 'Book Details | EbookAura',
  description: 'View and download eBooks from our collection',
}; 