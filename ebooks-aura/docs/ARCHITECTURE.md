# EbookAura Frontend Architecture

## Overview

EbookAura's frontend is built with Next.js, a React framework that enables server-side rendering, static site generation, and client-side rendering strategies. The application provides a modern, responsive interface for browsing, viewing, and managing e-books.

## System Architecture

The EbookAura frontend follows a modular architecture with clear separation of concerns:

```
EbookAura/
├── src/                  # Source code
│   ├── app/              # Next.js App Router structure
│   │   ├── api/          # API integration services
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── utils/        # Utility functions
│   │   ├── books/        # Book-related pages
│   │   ├── admin/        # Admin pages (protected)
│   │   ├── profile/      # User profile pages
│   │   └── ...           # Other page routes
├── public/               # Static assets
│   ├── images/           # Image assets
│   ├── pdf-metadata/     # SEO metadata for PDFs
│   ├── sitemap.xml       # Generated sitemap
│   └── robots.txt        # Search engine directives
├── scripts/              # Utility scripts (sitemap generation, etc.)
└── next.config.mjs       # Next.js configuration
```

## Core Technologies

The frontend is built with the following key technologies:

- **Next.js**: React framework with server-side rendering, API routes, and routing
- **React**: UI library for component-based development
- **CSS Modules**: Scoped styling for components
- **React PDF Viewer**: PDF viewing component
- **Material UI**: UI component library
- **React Icons**: Icon library
- **React Toastify**: Toast notification system

## Key Components

### App Structure

1. **Page Components**
   - Home page (`/`): Landing page with featured books
   - Search page (`/search`): Book browsing with filters
   - Book details page (`/books/[id]`): Individual book page with details and actions
   - Login/Register pages: User authentication
   - Profile pages: User profile management
   - Admin pages: Protected routes for administration

2. **Layout Components**
   - Root layout (`layout.js`): Provides common structure across all pages
   - Navbar: Main navigation component
   - Footer: Site-wide footer

### Core Components

1. **Book-Related Components**
   - `BookPageClient.js`: Client-side component for book details
   - `PdfViewer.jsx`: PDF viewing component
   - `BookReview.js`: Component for displaying and submitting reviews

2. **User Interface Components**
   - `SearchInput.js`: Search box component
   - `Alert.js`: Alert notification component
   - `ProgressBar.js`: Loading indicator

3. **Authentication Components**
   - Authentication forms
   - Protected route wrappers

## Data Flow

### API Integration

The frontend communicates with the backend through centralized API services:

1. **API Configuration**
   - `utils/config.js`: Central configuration for API endpoints
   - Environment variables control API URL (development vs. production)

2. **API Services**
   - `api/apiUtils.js`: Base API utility functions
   - Domain-specific API services (books, reviews, users, etc.)

3. **Data Fetching Strategies**
   - Server Components: Direct data fetching on the server
   - Client Components: Fetch via API services with loading states

### Authentication Flow

1. User enters credentials on login/register page
2. Credentials are sent to the authentication API endpoint
3. On success, JWT token is stored (HTTP-only cookie handled by backend)
4. AuthContext updates the authentication state
5. Protected routes become accessible

### Book Viewing Flow

1. User navigates to a book details page (`/books/[id]`)
2. Server component pre-renders book metadata
3. Client components handle interactive elements (reviews, PDF viewing)
4. PDF viewing uses secure URL generation with proper headers
5. Download functionality handles proper file naming and content types

## State Management

1. **Global State**
   - React Context API for authentication state and global UI state
   - Context providers wrap the application

2. **Local State**
   - React useState and useReducer for component-level state
   - Form state management for input handling

3. **Server State**
   - Next.js server components for initial data loading
   - Client-side data fetching for dynamic updates

## Rendering Strategies

EbookAura employs multiple rendering strategies:

1. **Server-Side Rendering (SSR)**
   - Initial page load with complete HTML
   - SEO-friendly content generation
   - Used for dynamic pages requiring fresh data

2. **Static Site Generation (SSG)**
   - Pre-rendered pages at build time
   - Extremely fast page loads
   - Used for static content like the homepage

3. **Client-Side Rendering (CSR)**
   - Dynamic updating of content after initial load
   - Interactive components like PDF viewer
   - Used for highly interactive features

4. **Incremental Static Regeneration (ISR)**
   - Static pages that revalidate after a specified interval
   - Combines benefits of static generation with fresh content
   - Used for book listings that change over time

## SEO Strategy

EbookAura implements comprehensive SEO features:

1. **Metadata Generation**
   - Dynamic metadata tags for all pages
   - Social media sharing previews (OpenGraph, Twitter Cards)
   - Structured data markup (Schema.org)

2. **PDF-specific SEO**
   - Dedicated landing pages for PDF content
   - Structured data specifically for PDFs
   - Sitemap entries for PDF content

3. **Sitemap Generation**
   - Automated sitemap generation
   - Includes all pages and book entries
   - Submission functionality to search engines

## Deployment Modes

The frontend supports multiple deployment strategies:

1. **Standard Next.js Deployment**
   - Server-side rendering capabilities
   - API route support
   - Dynamic content generation

2. **Static Site Export**
   - Pure static HTML/CSS/JS output
   - Can be hosted on any static file hosting
   - No server-side dependencies

## Performance Optimizations

1. **Code Splitting**
   - Automatic code splitting by Next.js
   - Dynamic imports for large components

2. **Image Optimization**
   - Next.js Image component
   - Responsive images with appropriate sizes

3. **Lazy Loading**
   - Components and routes load on demand
   - PDF content loads progressively

4. **Caching Strategy**
   - Static assets with long cache times
   - Dynamic content with appropriate cache control

## Cross-Cutting Concerns

1. **Error Handling**
   - Error boundaries for client-side errors
   - Custom error pages
   - API error handling with user feedback

2. **Accessibility**
   - Semantic HTML structure
   - ARIA attributes where appropriate
   - Keyboard navigation support

3. **Internationalization**
   - Structure supports i18n implementation
   - Centralized text resources

## Configuration Management

1. **Environment Variables**
   - `.env` files for different environments
   - Next.js built-in environment variable support

2. **Build Scripts**
   - Specialized scripts for different build targets
   - Environment switching utilities

## Security Considerations

1. **Authentication**
   - HTTP-only cookies for token storage
   - Protected routes with authentication checks

2. **API Access**
   - Centralized API request handling
   - Authentication headers management

3. **Content Security**
   - Proper Content Security Policy
   - Secure asset loading

## Frontend-Backend Integration

The frontend integrates with the backend through:

1. **API Integration**
   - RESTful API consumption
   - Consistent error handling
   - Authentication token management

2. **File Handling**
   - Secure PDF viewing through backend proxying
   - File upload with progress monitoring
   - Proper content type handling

This architecture provides a solid foundation for a modern, performant, and maintainable ebook management application with excellent user experience and SEO capabilities. 