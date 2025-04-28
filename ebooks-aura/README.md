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

Or directly check your links with:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

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
