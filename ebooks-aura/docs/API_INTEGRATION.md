# EbookAura API Integration Guide

This document details how the EbookAura frontend integrates with the backend API, including the approach to API requests, error handling, authentication, and environment configuration.

## API Structure Overview

The EbookAura frontend uses a structured, centralized approach to API integration that promotes:

1. **Consistency**: All API requests follow the same patterns
2. **Maintainability**: API endpoints are defined in a single location
3. **Type Safety**: API request/response types are well-defined
4. **Error Handling**: Consistent error processing approach
5. **Environment Awareness**: Easy switching between development and production

## API Configuration

### Base Configuration

The API configuration is centralized in `/src/app/utils/config.js`, which defines the base URL and all endpoints:

```javascript
// API base URL with environment variable fallback
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ebookaura.onrender.com/api';

// Structured API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    ME: `${API_BASE_URL}/auth/me`,
    // Other auth endpoints...
  },
  
  // Book endpoints
  BOOKS: {
    ALL: `${API_BASE_URL}/books`,
    DETAILS: (id) => `${API_BASE_URL}/books/${id}`,
    PDF: (id) => `${API_BASE_URL}/books/${id}/pdf`,
    // Other book endpoints...
  },
  
  // Other API categories...
};

// Export default for convenient import
export default { API_BASE_URL, API_ENDPOINTS };
```

### Environment Variables

The API URL is controlled through environment variables:

- **Development**: `http://localhost:5000/api` (default for local development)
- **Production**: `https://ebookaura.onrender.com/api` (deployed backend)

Environment variables are defined in:
- `.env.local` - Local development environment (not committed to version control)
- `.env` - Default environment settings (committed to version control)
- `.env.production` - Production settings used during production builds

## API Request Utilities

The `/src/app/api/apiUtils.js` file provides core utilities for making API requests:

```javascript
/**
 * Base API request function with error handling and authentication
 */
export const apiRequest = async (url, options = {}) => {
  try {
    // Default options with credentials and headers
    const defaultOptions = {
      credentials: 'include',  // Include cookies for JWT auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    // Merge default and custom options
    const config = {
      ...defaultOptions,
      ...options,
    };
    
    // Make the request
    const response = await fetch(url, config);
    
    // Parse response as JSON if possible
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Check for error responses
    if (!response.ok) {
      // Format error with status code and message
      const error = new Error(
        data.error || data.message || 'Unknown API error'
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    // Return successful response data
    return data;
  } catch (error) {
    // Add request URL to error for debugging
    error.url = url;
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
};
```

### HTTP Method Wrappers

Convenience methods for common HTTP verbs:

```javascript
// GET request wrapper
export const getAPI = (url, options = {}) => {
  return apiRequest(url, { method: 'GET', ...options });
};

// POST request wrapper
export const postAPI = (url, data, options = {}) => {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

// PUT request wrapper
export const putAPI = (url, data, options = {}) => {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
};

// DELETE request wrapper
export const deleteAPI = (url, options = {}) => {
  return apiRequest(url, { method: 'DELETE', ...options });
};
```

## Domain-Specific API Services

API calls are grouped into domain-specific service files for better organization:

### Books API Service (`/src/app/api/books.js`)

```javascript
import { getAPI, postAPI, putAPI, deleteAPI } from './apiUtils';
import { API_ENDPOINTS } from '../utils/config';

// Get all books with optional filtering
export const getBooks = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add pagination, sorting, filtering
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.category) queryParams.append('category', params.category);
  // Add other params as needed...
  
  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.BOOKS.ALL}${queryString ? `?${queryString}` : ''}`;
  
  return getAPI(url);
};

// Get book details by ID
export const getBookDetails = async (id) => {
  return getAPI(API_ENDPOINTS.BOOKS.DETAILS(id));
};

// Get book PDF URL
export const getBookPDF = async (id, download = false) => {
  const url = `${API_ENDPOINTS.BOOKS.PDF(id)}${download ? '?download=true' : ''}`;
  return getAPI(url);
};

// Other book-related API functions...
```

### Auth API Service (`/src/app/api/auth.js`)

```javascript
import { getAPI, postAPI } from './apiUtils';
import { API_ENDPOINTS } from '../utils/config';

// Login user
export const login = async (credentials) => {
  return postAPI(API_ENDPOINTS.AUTH.LOGIN, credentials);
};

// Register new user
export const register = async (userData) => {
  return postAPI(API_ENDPOINTS.AUTH.REGISTER, userData);
};

// Get current user profile
export const getCurrentUser = async () => {
  return getAPI(API_ENDPOINTS.AUTH.ME);
};

// Other auth-related API functions...
```

## Authentication Integration

### Token Management

JWT tokens are managed through HTTP-only cookies set by the backend for security. The frontend handles authentication state through the AuthContext:

```javascript
// In AuthContext.js
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data.user || null);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (credentials) => {
    const response = await loginAPI(credentials);
    setUser(response.user);
    return response;
  };
  
  // Logout function
  const logout = async () => {
    await logoutAPI();
    setUser(null);
  };
  
  // Provide auth context
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected API Requests

For routes requiring authentication, the token is automatically included through credentials:include, which sends the HTTP-only cookie with the request.

## Error Handling

API errors are handled consistently throughout the application:

### API-Level Error Handling

All API requests use the central error handling in the apiRequest function, which:

1. Checks for non-OK responses (status codes outside 200-299)
2. Parses error messages from the response
3. Adds additional metadata like URL and status code
4. Throws a standardized error object

### Component-Level Error Handling

Components that make API requests implement try/catch blocks:

```javascript
// Example of component with API error handling
const BookDetails = ({ bookId }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBookDetails(bookId);
        setBook(data.book);
      } catch (error) {
        console.error('Failed to fetch book:', error);
        setError(error.message || 'Failed to load book details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBook();
  }, [bookId]);
  
  // Render based on state
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!book) return <NotFound />;
  
  return (
    <div className={styles.bookDetails}>
      {/* Book details UI */}
    </div>
  );
};
```

### Global Error Handling

For consistent global error handling, EbookAura uses:

1. **Toast Notifications**: For transient error messages
2. **Error Boundaries**: For catching rendering errors
3. **Centralized Error Reporting**: Logs errors to the console and could send to a monitoring service

## Data Fetching Strategies

EbookAura employs different data fetching strategies depending on the context:

### Server Components

For Next.js server components that fetch data on the server:

```javascript
// In a server component (app/books/[id]/page.js)
export default async function BookPage({ params }) {
  try {
    // Server-side data fetching
    const book = await getBook(params.id);
    
    return (
      <div>
        <h1>{book.title}</h1>
        {/* Render server component with data */}
        <BookClientWrapper bookData={book} />
      </div>
    );
  } catch (error) {
    // Server-side error handling
    console.error('Error fetching book:', error);
    return <ErrorComponent message="Failed to load book" />;
  }
}
```

### Client Components

For interactive components that need to fetch data client-side:

```javascript
// In a client component with the "use client" directive
'use client';

import { useState, useEffect } from 'react';
import { getBookReviews } from '@/app/api/reviews';

export default function ReviewSection({ bookId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await getBookReviews(bookId);
        setReviews(data.reviews);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadReviews();
  }, [bookId]);
  
  // Render reviews
}
```

### SWR for Data Fetching

For data that needs to be revalidated, EbookAura can use SWR (stale-while-revalidate):

```javascript
import useSWR from 'swr';
import { getBookDetails } from '@/app/api/books';

function BookStats({ bookId }) {
  // SWR hook with automatic revalidation
  const { data, error, isLoading } = useSWR(
    `/api/books/${bookId}`,
    () => getBookDetails(bookId),
    { refreshInterval: 60000 } // Refresh every minute
  );
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return (
    <div>
      <p>Views: {data.book.viewCount}</p>
      <p>Downloads: {data.book.downloadCount}</p>
    </div>
  );
}
```

## File Upload Handling

For file uploads, such as book covers or PDFs:

```javascript
// File upload utility function
export const uploadFile = async (file, type = 'image') => {
  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file);
  
  // Select appropriate endpoint
  const endpoint = type === 'pdf' 
    ? API_ENDPOINTS.UPLOAD.PDF 
    : API_ENDPOINTS.UPLOAD.FILE;
  
  // Special handling for file uploads
  return apiRequest(endpoint, {
    method: 'POST',
    body: formData,
    // Important: Don't set Content-Type for FormData
    headers: {}, 
    credentials: 'include'
  });
};

// Component using file upload
const CoverUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      const result = await uploadFile(file);
      // Handle successful upload
      console.log('Uploaded file:', result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};
```

## PDF Handling

PDF files require special handling:

```javascript
// Get PDF with proper response handling
export const getBookPDFContent = async (id) => {
  // Use the PDF content endpoint
  const url = API_ENDPOINTS.BOOKS.PDF_CONTENT(id);
  
  // Special handling for binary data
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch PDF');
  }
  
  // Return the binary blob
  return response.blob();
};
```

## Environment Management

EbookAura includes utilities to manage API URLs across environments:

### URL Switching Scripts

The following scripts help manage the API URL configuration:

- `switch-to-dev.bat` - Configures the application to use the local development API
- `switch-to-production.bat` - Configures the application to use the production API
- `check-api-urls.js` - Verifies API URL configuration across all files

```javascript
// Example of check-api-urls.js
const fs = require('fs');
const path = require('path');

// Files to check
const filesToCheck = [
  './src/app/utils/config.js',
  './src/app/api/apiUtils.js',
  // Other files that might contain API URLs
];

// API URL patterns to look for
const patterns = {
  dev: /http:\/\/localhost:\d+\/api/,
  production: /https:\/\/ebookaura\.onrender\.com\/api/,
};

// Check each file
filesToCheck.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for patterns
    const hasDevUrl = patterns.dev.test(content);
    const hasProductionUrl = patterns.production.test(content);
    
    console.log(`File: ${filePath}`);
    console.log(`  Dev URL: ${hasDevUrl ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  Production URL: ${hasProductionUrl ? 'FOUND' : 'NOT FOUND'}`);
    console.log('---');
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
```

### Next.js API Rewrites

When in development mode, Next.js can be configured to proxy API requests:

```javascript
// In next.config.mjs
async rewrites() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  return [
    {
      source: '/api/:path*',
      destination: `${apiBaseUrl}/:path*`,
    },
  ];
}
```

## API Testing

EbookAura uses several approaches to test API integration:

### API Endpoint Testing

Scripts to test API endpoints directly:

```javascript
// In scripts/test-api.js
const testEndpoint = async (url, options = {}) => {
  try {
    console.log(`Testing endpoint: ${url}`);
    const response = await fetch(url, options);
    
    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      console.error('Error response:', await response.text());
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Test examples
testEndpoint('https://ebookaura.onrender.com/api/books');
testEndpoint('https://ebookaura.onrender.com/api/books/categories');
```

### Integration Testing

Components that integrate with APIs can be tested to verify correct behavior:

```javascript
// Example component test with API mocking
test('BookList loads and displays books', async () => {
  // Mock API response
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        books: [
          { id: '1', title: 'Test Book 1', author: 'Author 1' },
          { id: '2', title: 'Test Book 2', author: 'Author 2' },
        ],
      }),
    })
  );
  
  // Render component
  render(<BookList />);
  
  // Wait for books to load
  await screen.findByText('Test Book 1');
  
  // Verify books are displayed
  expect(screen.getByText('Test Book 1')).toBeInTheDocument();
  expect(screen.getByText('Test Book 2')).toBeInTheDocument();
  
  // Verify API was called with correct URL
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/books'),
    expect.any(Object)
  );
});
```

## API Documentation

EbookAura maintains documentation about the API integration:

1. **API Reference**: Details all available endpoints and parameters
2. **Authentication Guide**: How to handle protected endpoints
3. **Error Handling Guide**: Standardized error handling approach
4. **Environment Setup**: Configuration for different environments

This comprehensive API integration approach provides a robust foundation for connecting the frontend to the backend while maintaining flexibility, security, and error resilience. 