# EbookAura Frontend

This is the frontend application for EbookAura, built with Next.js to provide a modern and responsive user interface for browsing, viewing, and downloading e-books.

## Technology Stack

- **Next.js** - React framework with server-side rendering
- **React** - UI library
- **CSS Modules** - Scoped styling
- **React Icons** - Icon library
- **Next Router** - Client-side routing

## Features

### User Features
- Browse books by category, tag, or search term
- View book details, including cover, description, and metadata
- View PDF books directly in the browser
- Download PDF books for offline reading
- Rate and review books
- User authentication (login, register, profile management)
- Responsive design for mobile and desktop

### Admin Features
- Upload new books with metadata
- Upload cover images
- Manage existing books
- View statistics on book views and downloads

### Social Media Preview
When sharing book links on social media platforms like WhatsApp, Instagram, Twitter, or Facebook, the links will display rich previews including:
- Book cover image
- Book title and author
- Brief description
- Book rating
- File size information

This makes sharing books more engaging and informative for potential readers.

To test the social media previews, you can use the included test script:
```
test-og-metadata.bat <BOOK_ID>
```

Similarly, the search page has been enhanced with metadata for better sharing:
```
test-search-metadata.bat
```

Or directly check your links with:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## SEO and Metadata Features

### Sitemap Generation
The application includes a comprehensive sitemap generator that can be used to create and update the `sitemap.xml` file. This helps search engines discover and index all the pages of the application.

To generate the sitemap:
```
npm run generate:sitemap
```
or use the batch file:
```
generate-sitemap.bat
```

If you encounter dependency issues, we also provide a simplified sitemap generator that has no external dependencies:
```
npm run generate:simple-sitemap
```
or use the batch file:
```
generate-simple-sitemap.bat
```
This simpler version creates a basic sitemap with all your main pages and books.

### PDF Metadata Generation
EbookAura provides enhanced PDF metadata generation for improved search engine indexing and social sharing of your books. This feature:

1. Creates dedicated metadata pages for each book
2. Adds structured Schema.org markup for rich search results
3. Generates optimized social sharing metadata
4. Enhances the sitemap with book information and cover images

To generate PDF metadata:
```
npm run generate:pdf-metadata
```
or use the batch file:
```
generate-pdf-metadata.bat
```

The generated files will be stored in `public/pdf-metadata/` and can be accessed at:
- JSON format: `/pdf-metadata/[book-id].json`
- HTML format: `/pdf-metadata/[book-id].html`

These metadata pages are automatically included in the sitemap and help search engines better understand and index your PDF content.

### Social Media Preview Testing
You can test how your book links will appear when shared on social media platforms:

For individual book pages:
```
test-og-metadata.bat <BOOK_ID>
```

For the search page:
```
test-search-metadata.bat
```

### Robots.txt
The application includes a `robots.txt` file in the public directory that provides guidance to search engines about which parts of the site should be crawled. This file can be customized to fit your specific requirements.

## Enhanced SEO for PDFs

EbookAura includes advanced SEO optimization for PDF content to improve discoverability in search engines. These features help your PDF books rank higher in search results:

### PDF Metadata Generation

The system generates comprehensive metadata for each PDF book:

1. **HTML Landing Pages**: SEO-optimized landing pages for each PDF with:
   - Structured data markup (Schema.org)
   - Open Graph and Twitter card tags
   - Detailed book information
   - Breadcrumb navigation
   - Google Analytics integration
   - Mobile-responsive design

2. **JSON Metadata**: Machine-readable metadata used by search engines

3. **TXT Metadata Files**: Special meta.txt files that help search engines index PDFs more effectively

### Enhanced Sitemap Generation

The sitemap includes detailed information about each book:

1. **Book-specific metadata** in XML sitemap format
2. **Image information** for book covers
3. **Content relationships** between books and their metadata pages
4. **News publication data** for better indexing

### How to Generate PDF SEO Content

To generate all SEO content for your PDFs, run:

```bash
npm run seo:all
```

Or use the Windows batch file:

```
generate-pdf-metadata.bat
```

This will generate:
- HTML landing pages in `/public/pdf-metadata/*.html`
- JSON metadata files in `/public/pdf-metadata/*.json`
- TXT metadata files in `/public/pdf-metadata/*.txt`
- Enhanced sitemap at `/public/sitemap.xml`

### SEO Best Practices

For best SEO results:

1. Run the PDF metadata and sitemap generators regularly to keep content fresh
2. Ensure all PDFs have complete metadata (author, title, description, etc.)
3. Include categories and tags for better topical relevance
4. Use the meta.txt files alongside your PDFs for better indexing
5. Submit your sitemap to Google Search Console

## Pages and Components

### Main Pages
- **Home** (`/`) - Landing page with featured books
- **Search** (`/search`) - Book search and browsing
- **Book Details** (`/books/[id]`) - Individual book page with download/view options
- **Login** (`/login`) - User login page
- **Register** (`/register`) - New user registration
- **Profile** (`/profile`) - User profile management
- **Admin Dashboard** (`/admin`) - Admin tools (protected route)

### Key Components
- **BookCard** - Displays book information in grid/list views
- **BookReview** - Handles book ratings and reviews
- **SearchFilters** - Provides filtering options for book search
- **BookUploadForm** - For admins to upload new books
- **AuthContext** - Manages authentication state

## PDF Handling

The application provides two methods to interact with PDFs:

1. **View PDF** - Opens the PDF in a new browser tab for online reading
2. **Download PDF** - Downloads the PDF file to the user's device with proper filename

The download functionality has been implemented with a multi-step approach:
- Fetches PDF data from the backend proxy
- Creates a Blob with the PDF data
- Generates a download link with the proper filename
- Triggers the download programmatically

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables (create `.env.local` file):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Build for production:
   ```
   npm run build
   ```

5. Start the production server:
   ```
   npm start
   ```

## API Integration

The frontend communicates with the backend API using fetch requests. All API endpoints are centralized in a config file:

```javascript
// src/app/utils/config.js
// For development
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// For production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ebookaura.onrender.com/api';

export const API_ENDPOINTS = {
  BOOKS: {
    ALL: `${API_BASE_URL}/books`,
    DETAILS: (id) => `${API_BASE_URL}/books/${id}`,
    PDF: (id) => `${API_BASE_URL}/books/${id}/pdf`,
    // ... other endpoints
  },
  // ... other API categories
};
```

This centralized approach ensures:
- Consistent API URLs across the application
- Easy updates if API endpoints change
- Single source of truth for all endpoint definitions
- Better maintainability

Components and API functions import these endpoint definitions:

```javascript
import { API_ENDPOINTS } from '../utils/config';

// Fetch book data
const response = await fetch(API_ENDPOINTS.BOOKS.DETAILS(bookId));
```

## Deployment

### Static Site Generation

EbookAura can be built as a static site, which provides several advantages:

1. **Better Performance**: Static sites load faster since there's no server-side rendering at request time
2. **Cheaper Hosting**: Can be hosted on any static file hosting service (GitHub Pages, Netlify, Vercel, etc.)
3. **Better Security**: No server-side code execution means reduced attack surface
4. **Improved Reliability**: Static assets are easily cached and distributed via CDNs

To build the site as a static export:

```bash
# Build with development API URL
npm run build:static

# Build with production API URL
npm run build:static:prod
```

The static site will be generated in the `out` directory. To test it locally:

```bash
npm run serve
```

This will start a local server to serve the static files from the `out` directory.

### Hosting the Static Site

#### Netlify/Vercel
Simply connect your repository and set the build command to:
```
npm run build:static:prod
```

And set the output directory to `out`.

#### GitHub Pages
1. Push the `out` directory to the `gh-pages` branch
2. Configure GitHub Pages to serve from this branch

#### Any Static Host
Upload the contents of the `out` directory to any static file host.

### Production API

This application is configured to use the production API at `https://ebookaura.onrender.com/api`. 

We have implemented several utilities to help manage API URLs between development and production:

1. **Automatic Configuration Scripts**
   - `build-production.bat` - Sets up all configuration files to use the production API URL and builds the application
   - `switch-to-dev.bat` - Switches configuration to use the development API URL (localhost)
   - `check-api-urls.js` - Utility script to verify API URL configuration across files

2. **Configuration Files**
   - `.env` - Contains environment variables like `NEXT_PUBLIC_API_URL`
   - `src/app/api/apiUtils.js` - Central API utilities with API_BASE_URL configuration
   - `src/app/utils/config.js` - Application-wide configuration including API endpoints
   - `next.config.mjs` - Next.js configuration with API rewrites

To switch between environments:

1. **For Production**:
   ```
   npm run build:production
   ```
   or
   ```
   .\build-production.bat
   ```

2. **For Development**:
   ```
   .\switch-to-dev.bat
   npm run dev
   ```

3. **To Check Configuration**:
   ```
   node check-api-urls.js
   ```

The scripts ensure consistent API URL usage across all files in the application.

## Folder Structure

```
src/
├── app/                # Next.js App Router
│   ├── api/            # API functions for data fetching
│   ├── books/          # Book-related pages
│   ├── components/     # Shared React components
│   ├── context/        # React context providers (e.g., AuthContext)
│   ├── utils/          # Utility functions and configuration
│   │   └── config.js   # Centralized API endpoints and app config
│   ├── admin/          # Admin pages and components
│   ├── profile/        # User profile pages
│   └── ...
├── public/             # Static assets
└── styles/             # Global styles
```

## State Management

- **Local state** - React useState for component-level state
- **Context API** - For global state like authentication
- **Server components** - For data fetching and initial state

## Browser Compatibility

The application is tested and works on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
