# EbookAura Routing and Navigation Guide

This document details the routing and navigation architecture used in the EbookAura frontend application, built on Next.js 14's App Router.

## Routing Architecture Overview

EbookAura uses Next.js 14's App Router, which provides a file-system based routing structure with support for:

- **Static Routes**: Fixed URL paths like `/about` or `/contact`
- **Dynamic Routes**: URL paths with parameters like `/books/[id]`
- **Catch-all Routes**: Special routes that can match multiple segments like `/blog/[...slug]`
- **Route Groups**: Organizational folders that don't affect the URL structure 
- **Parallel Routes**: Multiple parts of a page that can be loaded independently
- **Intercepting Routes**: Routes that can override the navigation flow for special cases

## Directory Structure

In the App Router, the routing structure directly maps to the filesystem:

```
src/app/                   # Root layout and page
├── layout.js              # Root layout (applied to all routes)
├── page.js                # Home page (/)
├── page-metadata.js       # Metadata for the home page
├── not-found.js           # Custom 404 page
├── loading.js             # Loading state for the root
├── error.js               # Error boundary for the root
│
├── books/                 # Books section
│   ├── page.js            # Books list page (/books)
│   ├── layout.js          # Layout for all book pages
│   ├── loading.js         # Loading state for book pages
│   ├── error.js           # Error boundary for book pages
│   │
│   └── [id]/              # Dynamic route for individual books
│       ├── page.js        # Book detail page (/books/[id])
│       ├── layout.js      # Layout for a single book
│       ├── not-found.js   # 404 for book not found
│       ├── BookPageClient.js  # Client component for book details
│       └── BookClientWrapper.js  # Client wrapper for book viewing
│
├── search/                # Search section
│   └── page.js            # Search results page (/search)
│
├── (auth)/                # Auth route group (doesn't affect URL)
│   ├── login/
│   │   └── page.js        # Login page (/login)
│   └── register/
│       └── page.js        # Register page (/register)
│
├── profile/               # User profile section
│   ├── page.js            # Profile page (/profile)
│   └── [username]/        # Dynamic route for user profiles
│       └── page.js        # User profile page (/profile/[username])
│
├── admin/                 # Admin section (protected)
│   ├── layout.js          # Admin layout with auth check
│   ├── page.js            # Admin dashboard (/admin)
│   ├── books/
│   │   ├── page.js        # Book management (/admin/books)
│   │   └── [id]/
│   │       └── page.js    # Edit book (/admin/books/[id])
│   └── users/
│       └── page.js        # User management (/admin/users)
│
└── api/                   # API routes folder (if used)
    └── ...                # Various API endpoints
```

## Route Types and Implementations

### Static Routes

Standard pages with fixed URLs:

```javascript
// src/app/about/page.js - Accessible at /about
export default function AboutPage() {
  return (
    <div className="about-page">
      <h1>About EbookAura</h1>
      <p>EbookAura is a platform for discovering and reading ebooks...</p>
    </div>
  );
}
```

### Dynamic Routes

Pages that capture parameters from the URL:

```javascript
// src/app/books/[id]/page.js - Accessible at /books/123, /books/my-book, etc.
export default async function BookPage({ params }) {
  // params.id contains the captured value from the URL
  const bookId = params.id;
  
  // Fetch book data (server component)
  const book = await fetchBookById(bookId);
  
  if (!book) {
    notFound(); // Triggers the not-found.js page
  }
  
  return (
    <div className="book-details">
      <h1>{book.title}</h1>
      <BookClientWrapper bookData={book} />
    </div>
  );
}
```

### Route Groups

Folders that organize routes without affecting the URL path:

```javascript
// src/app/(auth)/login/page.js - Accessible at /login
// The (auth) part doesn't appear in the URL
export default function LoginPage() {
  return (
    <div className="login-page">
      <h1>Login to EbookAura</h1>
      <LoginForm />
    </div>
  );
}
```

### Catch-all Routes

Routes that capture multiple URL segments:

```javascript
// src/app/docs/[...slug]/page.js - Matches /docs/start, /docs/start/config, etc.
export default function DocsPage({ params }) {
  // params.slug is an array of segments, e.g., ['start', 'config']
  const slugArray = params.slug;
  
  return (
    <div className="docs-page">
      <h1>Documentation</h1>
      <DocsContent path={slugArray.join('/')} />
    </div>
  );
}
```

## Layouts and Templates

### Root Layout

The root layout applied to all pages:

```javascript
// src/app/layout.js
import { Providers } from './providers';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import './globals.css';

export const metadata = {
  title: {
    template: '%s | EbookAura',
    default: 'EbookAura - Discover and Read Ebooks',
  },
  description: 'Discover, read, and manage your ebook collection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16 pb-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

### Nested Layouts

Layouts can be nested to create section-specific layouts:

```javascript
// src/app/admin/layout.js
import { AdminSidebar } from './components/AdminSidebar';
import { withAdminAuth } from '@/utils/auth';

// Protect all admin routes with authentication
export default withAdminAuth(function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
});
```

## Navigation Strategies

### Client-Side Navigation

For client-side navigation using `next/link`:

```javascript
import Link from 'next/link';

export function BookCard({ book }) {
  return (
    <div className="book-card">
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      {/* Client-side navigation without full page reload */}
      <Link href={`/books/${book.id}`} className="view-button">
        View Book
      </Link>
    </div>
  );
}
```

### Programmatic Navigation

Using the router to navigate programmatically:

```javascript
'use client';

import { useRouter } from 'next/navigation';

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Programmatic navigation with query parameters
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };
  
  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search books..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Navigation Hooks

Using navigation hooks for advanced navigation logic:

```javascript
'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export function Pagination({ totalPages, currentPage }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const createPageUrl = (pageNumber) => {
    // Create a new URLSearchParams instance
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    
    return `${pathname}?${params.toString()}`;
  };
  
  const handlePageChange = (pageNumber) => {
    router.push(createPageUrl(pageNumber));
  };
  
  return (
    <div className="pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={page === currentPage ? 'active' : ''}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
```

## URL Management

### Route Parameters

Working with dynamic route parameters:

```javascript
// src/app/books/[id]/page.js
export async function generateStaticParams() {
  // Generate paths for static pages at build time
  const books = await getPopularBooks();
  
  return books.map((book) => ({
    id: book.id.toString(),
  }));
}

export default function BookPage({ params }) {
  // Access route parameters
  const { id } = params;
  // ...
}
```

### Query Parameters

Working with query/search parameters:

```javascript
// src/app/search/page.js
export default async function SearchPage({ searchParams }) {
  // Access query parameters
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '10', 10);
  
  // Fetch search results
  const results = await searchBooks({ query, page, limit });
  
  return (
    <div className="search-results">
      <h1>Search Results for: {query}</h1>
      <BookList books={results.books} />
      <Pagination
        currentPage={page}
        totalPages={results.totalPages}
      />
    </div>
  );
}
```

## Route Protection and Authentication

### Client-Side Protection

Using HOCs or hooks to protect client components:

```javascript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function withAuth(Component) {
  return function AuthProtected(props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!loading && !user) {
        // Redirect to login if not authenticated
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    }, [user, loading, router]);
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return null; // Will redirect in the useEffect
    }
    
    return <Component {...props} user={user} />;
  };
}
```

### Server-Side Protection

Using middleware or server components to protect routes:

```javascript
// src/middleware.js - Route protection with middleware
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function middleware(request) {
  // Check if the route is under /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value;
    
    // Verify token and check admin role
    const verifiedToken = token && await verifyAuth(token);
    const isAdmin = verifiedToken?.role === 'admin';
    
    if (!isAdmin) {
      // Redirect to login if not admin
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Specify which paths this middleware applies to
  matcher: ['/admin/:path*', '/profile/:path*'],
};
```

## Advanced Routing Features

### Parallel Routes

Loading multiple sections of a page independently:

```javascript
// src/app/dashboard/layout.js
export default function DashboardLayout({ children, notifications, stats }) {
  return (
    <div className="dashboard-layout">
      <div className="main-content">{children}</div>
      <div className="sidebar">
        <div className="notifications-pane">{notifications}</div>
        <div className="stats-pane">{stats}</div>
      </div>
    </div>
  );
}

// src/app/dashboard/@notifications/page.js
export default function Notifications() {
  return <UserNotifications />;
}

// src/app/dashboard/@stats/page.js
export default function Stats() {
  return <UserStats />;
}
```

### Intercepting Routes

Modifying the navigation behavior:

```javascript
// src/app/books/(browsing)/page.js - Normal books listing

// src/app/books/(.)[id]/page.js - Intercepts /books/[id] to show a modal view
export default function BookModalPage({ params }) {
  return (
    <div className="book-modal">
      <BookDetails id={params.id} />
    </div>
  );
}
```

## Loading and Error States

### Loading UI

Custom loading states for routes:

```javascript
// src/app/books/loading.js
export default function BookLoading() {
  return (
    <div className="book-loading">
      <div className="skeleton-header"></div>
      <div className="skeleton-grid">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="skeleton-card"></div>
        ))}
      </div>
    </div>
  );
}
```

### Error Boundaries

Custom error handling for routes:

```javascript
// src/app/books/error.js
'use client';

import { useEffect } from 'react';

export default function BookError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Book section error:', error);
  }, [error]);
  
  return (
    <div className="error-container">
      <h2>Something went wrong loading the books</h2>
      <p>{error.message || 'Unknown error occurred'}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Not Found Pages

Custom 404 pages:

```javascript
// src/app/books/[id]/not-found.js
export default function BookNotFound() {
  return (
    <div className="not-found-container">
      <h1>Book Not Found</h1>
      <p>We couldn't find the book you're looking for.</p>
      <Link href="/books">Browse all books</Link>
    </div>
  );
}
```

## SEO and Metadata

### Static Metadata

Setting static metadata for pages:

```javascript
// src/app/about/page.js
export const metadata = {
  title: 'About EbookAura',
  description: 'Learn about EbookAura, our mission, and our team',
  keywords: ['ebooks', 'reading', 'digital books', 'about'],
};

export default function AboutPage() {
  // Page content...
}
```

### Dynamic Metadata

Setting dynamic metadata based on page data:

```javascript
// src/app/books/[id]/page.js
export async function generateMetadata({ params }) {
  const book = await fetchBookById(params.id);
  
  if (!book) {
    return {
      title: 'Book Not Found',
    };
  }
  
  return {
    title: book.title,
    description: book.description?.substring(0, 160) || `Read ${book.title} on EbookAura`,
    openGraph: {
      title: book.title,
      description: book.description?.substring(0, 160) || `Read ${book.title} on EbookAura`,
      images: [book.coverImage && { url: book.coverImage }].filter(Boolean),
      type: 'book',
      authors: [book.author],
    },
  };
}

export default function BookPage({ params }) {
  // Page content...
}
```

## Sitemap and Robots.txt

### Dynamic Sitemap Generation

Generating a sitemap dynamically:

```javascript
// src/app/sitemap.js
export default async function sitemap() {
  // Fetch all books for the sitemap
  const books = await fetchAllBooks();
  const bookEntries = books.map((book) => ({
    url: `https://ebookaura.com/books/${book.id}`,
    lastModified: book.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));
  
  // Core static pages
  const staticPages = [
    {
      url: 'https://ebookaura.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://ebookaura.com/about',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    // Add more static routes...
  ];
  
  return [...staticPages, ...bookEntries];
}
```

### Robots.txt

Controlling search engine crawling:

```javascript
// src/app/robots.js
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
    ],
    sitemap: 'https://ebookaura.com/sitemap.xml',
  };
}
```

## Performance Optimization

### Route Cache Control

Controlling cache behavior for routes:

```javascript
// src/app/books/page.js
export const revalidate = 3600; // Revalidate every hour

export default async function BooksPage() {
  // Content will be cached and revalidated every hour
}
```

### Dynamic Rendering Modes

Controlling static vs. dynamic rendering:

```javascript
// src/app/books/[id]/page.js
export const dynamic = 'auto'; // 'auto', 'force-dynamic', or 'force-static'
export const dynamicParams = true; // Handle non-generated paths at request time

export async function generateStaticParams() {
  // Pre-render only popular books
  const popularBooks = await getPopularBooks();
  return popularBooks.map((book) => ({ id: book.id }));
}

export default function BookPage({ params }) {
  // This will be statically generated for popular books (from generateStaticParams)
  // and dynamically rendered for others (due to dynamicParams: true)
}
```

## Breadcrumb Navigation

Implementing breadcrumb navigation:

```javascript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // Skip rendering breadcrumbs on home page
  if (pathname === '/') return null;
  
  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Generate breadcrumbs with readable names
  const breadcrumbs = segments.map((segment, index) => {
    // Handle dynamic segments
    const isDynamicSegment = segment.match(/^\[.*\]$/);
    
    // Create the full path to this point
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    
    // Create a readable label (capitalize, remove hyphens, etc.)
    let label = segment;
    
    // Replace dynamic segments with readable names based on context
    if (isDynamicSegment) {
      // Lookup based on context, e.g., book title
      label = 'Item Details'; // This should be replaced with actual data
    } else {
      // Format regular segments
      label = segment
        .replace(/-/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
    }
    
    return { href, label };
  });
  
  // Add home as the first breadcrumb
  breadcrumbs.unshift({ href: '/', label: 'Home' });
  
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumbs">
      <ol>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href}>
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link href={crumb.href}>{crumb.label}</Link>
                <span className="separator">/</span>
              </>
            ) : (
              // Current page is not a link
              <span className="current">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

## Route Transitions

Adding animated transitions between routes:

```javascript
'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function RouteTransition({ children }) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Use in a layout
// src/app/layout.js
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <RouteTransition>
          {children}
        </RouteTransition>
        <Footer />
      </body>
    </html>
  );
}
```

## URL Persistence

Maintaining URL state during navigation:

```javascript
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function FilterSidebar({ initialFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get current filter values from URL or defaults
  const category = searchParams.get('category') || initialFilters.category;
  const minPrice = searchParams.get('minPrice') || initialFilters.minPrice;
  const maxPrice = searchParams.get('maxPrice') || initialFilters.maxPrice;
  
  const updateFilters = (newFilters) => {
    // Create a new URLSearchParams instance
    const params = new URLSearchParams(searchParams);
    
    // Update parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Update URL without reloading the page
    router.push(`${pathname}?${params.toString()}`);
  };
  
  return (
    <div className="filter-sidebar">
      {/* Filter UI components */}
      <select
        value={category}
        onChange={(e) => updateFilters({ category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="fiction">Fiction</option>
        <option value="non-fiction">Non-Fiction</option>
        {/* More options */}
      </select>
      
      {/* More filter controls */}
    </div>
  );
}
```

## Deep Linking

Supporting deep linking to specific content:

```javascript
// src/app/books/[id]/page.js
import { redirect } from 'next/navigation';

export default async function BookPage({ params, searchParams }) {
  const bookId = params.id;
  const book = await fetchBookById(bookId);
  
  if (!book) {
    notFound();
  }
  
  // Handle deep links to specific chapter
  const chapterId = searchParams.chapter;
  if (chapterId) {
    // Validate chapter ID
    const chapterExists = book.chapters.some(ch => ch.id === chapterId);
    
    if (!chapterExists) {
      // Redirect to the book page if chapter doesn't exist
      redirect(`/books/${bookId}`);
    }
  }
  
  return (
    <div className="book-page">
      <h1>{book.title}</h1>
      <BookViewer
        book={book}
        initialChapter={chapterId}
      />
    </div>
  );
}
```

## Conclusion

Next.js App Router provides a powerful, flexible foundation for EbookAura's routing and navigation. The file-system-based approach makes it intuitive to create and manage routes, while features like layouts, loading states, and error boundaries make it easy to create a polished user experience.

By leveraging both server and client components appropriately, EbookAura achieves an optimal balance of performance, SEO, and interactivity, with smooth navigation transitions and a consistent user experience.

By leveraging both server and client components appropriately, EbookAura achieves an optimal balance of performance, SEO, and interactivity, with smooth navigation transitions and a consistent user experience. 