/**
 * Layout for book pages
 * This provides the outer structure for dynamic book routes
 */

export default function BookLayout({ children }) {
  return (
    <section>
      {/* This wraps the page.js component with any additional structure */}
      <div className="book-page-wrapper">
        {children}
      </div>
    </section>
  );
}

// Metadata for the book section
export const metadata = {
  title: 'Book Details | EbookAura',
  description: 'View and download eBooks from our collection',
}; 