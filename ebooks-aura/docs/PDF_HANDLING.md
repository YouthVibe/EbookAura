# EbookAura PDF Handling and Viewer

This document details the PDF handling features of the EbookAura frontend, including the secure PDF viewer implementation, page navigation, rendering, and auxiliary features.

## Overview

EbookAura provides a secure, feature-rich PDF viewing experience that:

1. Protects content from unauthorized downloads
2. Delivers smooth, high-quality rendering
3. Supports essential reading features like navigation, zooming, and search
4. Integrates with the application's authentication and subscription systems

## Core Technologies

The PDF viewer implementation relies on the following technologies:

- **PDF.js**: Mozilla's PDF rendering engine for web browsers
- **React-PDF**: React wrapper components for PDF.js
- **Custom Canvas Renderer**: For enhanced security and watermarking
- **Web Workers**: For performance optimization during PDF processing

## Architecture

### Component Hierarchy

```
PdfViewer
├── PDFViewerContainer
│   ├── PDFControls
│   │   ├── PageNavigation
│   │   ├── ZoomControls
│   │   └── ViewModeSelector
│   ├── PDFDocument
│   │   ├── PDFPage
│   │   │   └── CanvasRenderer
│   │   └── PageAnnotations
│   └── PDFSidebar
│       ├── ThumbnailView
│       ├── OutlineView
│       └── SearchResults
└── PDFErrorBoundary
```

### Security Model

The PDF viewing system implements a multi-layered security approach:

1. **Server-side Authentication**: PDF content is only served to authenticated users
2. **Content Segmentation**: PDFs are served page-by-page rather than as a full document
3. **Canvas Rendering**: Content is rendered to canvas elements to prevent easy downloading
4. **Dynamic Watermarking**: User-specific watermarks are added to discourage screenshots
5. **Anti-Scraping Measures**: Rate limiting and anomaly detection for access patterns

## Main Component: PdfViewer

The `PdfViewer` component serves as the main entry point for PDF display:

```javascript
// src/app/components/PdfViewer.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import styles from './PdfViewer.module.css';
import { useAuth } from '@/app/hooks/useAuth';
import dynamic from 'next/dynamic';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Dynamically import control components to reduce initial bundle size
const PDFControls = dynamic(() => import('./PDFControls'), { ssr: false });
const PDFSidebar = dynamic(() => import('./PDFSidebar'), { ssr: false });

export default function PdfViewer({ pdfUrl, bookId, title }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const containerRef = useRef(null);

  // Track PDF viewing progress
  useEffect(() => {
    const recordProgress = async () => {
      // Log reading progress to backend
      if (user && pageNumber && numPages) {
        try {
          await fetch(`/api/books/${bookId}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: pageNumber, totalPages: numPages }),
            credentials: 'include'
          });
        } catch (e) {
          console.error('Failed to update reading progress', e);
        }
      }
    };

    recordProgress();
  }, [pageNumber, numPages, bookId, user]);

  // Function to handle successful document loading
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    
    // Record book view event
    if (user) {
      fetch(`/api/books/${bookId}/view`, { 
        method: 'POST',
        credentials: 'include'
      }).catch(e => console.error('Failed to record view', e));
    }
  }

  // Page navigation functions
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  const goToPage = (num) => setPageNumber(parseInt(num, 10));

  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1.0);

  // Rotation functions
  const rotateClockwise = () => setRotation(prev => (prev + 90) % 360);

  // Error handler
  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document. Please try again later.');
    setLoading(false);
  }

  // Custom page renderer with watermarking
  const renderPage = ({ canvasRef, width, height }) => {
    if (!canvasRef.current) return null;
    
    // Apply watermark if user is authenticated
    if (user && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Draw diagonal watermark with user email and timestamp
      const watermarkText = `${user.email} - ${new Date().toLocaleString()}`;
      ctx.save();
      ctx.globalAlpha = 0.15; // Subtle transparency
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4); // 45-degree angle
      ctx.fillText(watermarkText, -ctx.measureText(watermarkText).width / 2, 0);
      ctx.restore();
    }
  };

  return (
    <div className={styles.pdfViewerContainer} ref={containerRef}>
      {/* PDF Controls */}
      <PDFControls
        pageNumber={pageNumber}
        numPages={numPages}
        scale={scale}
        goToPrevPage={goToPrevPage}
        goToNextPage={goToNextPage}
        goToPage={goToPage}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetZoom={resetZoom}
        rotate={rotateClockwise}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <div className={styles.pdfViewerContent}>
        {/* Optional Sidebar */}
        {sidebarOpen && (
          <PDFSidebar
            pdfUrl={pdfUrl}
            currentPage={pageNumber}
            numPages={numPages}
            goToPage={goToPage}
          />
        )}

        {/* Main Document Viewer */}
        <div className={styles.documentContainer}>
          {error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className={styles.loading}>Loading PDF...</div>}
              className={styles.pdfDocument}
            >
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Loading PDF...</p>
                </div>
              ) : (
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  renderInteractiveForms={true}
                  className={styles.pdfPage}
                  customTextRenderer={({ str }) => str} // Custom text renderer
                  onRenderSuccess={renderPage} // Apply watermark
                />
              )}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
```

## PDF Access Control

### Authentication Integration

PDF access is tightly integrated with EbookAura's authentication system:

1. **Subscription Checks**: Verifies the user has an active subscription for premium content
2. **Preview Limitations**: Free users may be limited to a subset of pages
3. **Access Logging**: All PDF view events are recorded for analytics

```javascript
// src/app/books/[id]/page.js
import { getBookPdfUrl } from '@/app/api/books';
import PdfViewer from '@/app/components/PdfViewer';
import { getCurrentUser } from '@/app/api/auth';
import { notFound, redirect } from 'next/navigation';

export default async function BookPage({ params }) {
  // Get current user (if authenticated)
  let user;
  try {
    const userData = await getCurrentUser();
    user = userData.user;
  } catch (error) {
    // User is not authenticated
    user = null;
  }

  // Get book details
  const bookId = params.id;
  const book = await getBookById(bookId);
  
  if (!book) {
    notFound();
  }
  
  // Check premium content restrictions
  if (book.isPremium && (!user || !user.hasActiveSubscription)) {
    redirect(`/books/${bookId}/preview?subscribe=true`);
  }
  
  // Get secure PDF URL with authentication token
  const pdfUrl = await getBookPdfUrl(bookId);
  
  return (
    <div className="book-page">
      <h1>{book.title}</h1>
      <div className="author">by {book.author}</div>
      
      <PdfViewer 
        pdfUrl={pdfUrl} 
        bookId={bookId} 
        title={book.title} 
      />
    </div>
  );
}
```

## Server-Side PDF Protection

EbookAura employs several server-side strategies to protect PDF content:

1. **Signed URLs**: Temporary, authenticated URLs for accessing PDF content
2. **Proxy Requests**: PDF content is served through a backend proxy to avoid exposing direct file paths
3. **Byte Range Serving**: PDFs are served in chunks to prevent full downloads

```javascript
// src/app/api/books.js
// Function to get secure PDF URL
export const getBookPdfUrl = async (bookId) => {
  try {
    const response = await fetch(`/api/books/${bookId}/secure-pdf-url`, {
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      throw new Error('Failed to get secure PDF URL');
    }
    
    const data = await response.json();
    return data.url; // This URL is temporary and contains auth tokens
  } catch (error) {
    console.error('Error getting secure PDF URL:', error);
    throw error;
  }
};
```

## PDF Viewer Features

### Page Navigation

The PDF viewer supports various navigation methods:

```javascript
// src/app/components/PDFControls.jsx
export default function PDFControls({ 
  pageNumber, numPages, goToPrevPage, goToNextPage, goToPage,
  zoomIn, zoomOut, resetZoom, rotate, toggleSidebar, isSidebarOpen
}) {
  const handlePageInput = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= numPages) {
      goToPage(value);
    }
  };

  return (
    <div className={styles.pdfControls}>
      <div className={styles.navigationControls}>
        <button 
          onClick={goToPrevPage} 
          disabled={pageNumber <= 1}
          aria-label="Previous page"
        >
          <PreviousIcon />
        </button>
        
        <div className={styles.pageInfo}>
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={pageNumber}
            onChange={handlePageInput}
            onBlur={handlePageInput}
          />
          <span> / {numPages || '-'}</span>
        </div>
        
        <button 
          onClick={goToNextPage} 
          disabled={pageNumber >= numPages}
          aria-label="Next page"
        >
          <NextIcon />
        </button>
      </div>
      
      {/* Zoom controls, view mode selector, etc. */}
    </div>
  );
}
```

### PDF Sidebar

The sidebar provides additional navigation options:

```javascript
// src/app/components/PDFSidebar.jsx
export default function PDFSidebar({ pdfUrl, currentPage, numPages, goToPage }) {
  const [activeTab, setActiveTab] = useState('thumbnails');
  const [thumbnails, setThumbnails] = useState([]);
  const [outline, setOutline] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load document outline/bookmarks
  useEffect(() => {
    const loadOutline = async () => {
      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const outline = await pdf.getOutline();
        setOutline(outline || []);
      } catch (error) {
        console.error('Error loading PDF outline:', error);
      }
    };
    
    if (pdfUrl) {
      loadOutline();
    }
  }, [pdfUrl]);
  
  // Generate thumbnail previews
  useEffect(() => {
    const generateThumbnails = async () => {
      // Implementation details for thumbnail generation
    };
    
    if (numPages) {
      generateThumbnails();
    }
  }, [pdfUrl, numPages]);
  
  // Handle search
  const handleSearch = async (query) => {
    // Implementation details for text search
  };
  
  return (
    <div className={styles.pdfSidebar}>
      {/* Tab selection */}
      <div className={styles.sidebarTabs}>
        <button 
          className={activeTab === 'thumbnails' ? styles.activeTab : ''}
          onClick={() => setActiveTab('thumbnails')}
        >
          Thumbnails
        </button>
        <button 
          className={activeTab === 'outline' ? styles.activeTab : ''}
          onClick={() => setActiveTab('outline')}
        >
          Outline
        </button>
        <button 
          className={activeTab === 'search' ? styles.activeTab : ''}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
      </div>
      
      {/* Tab content */}
      <div className={styles.sidebarContent}>
        {activeTab === 'thumbnails' && (
          <div className={styles.thumbnailView}>
            {thumbnails.map((thumbnail, index) => (
              <div 
                key={index}
                className={`${styles.thumbnail} ${currentPage === index + 1 ? styles.activeThumbnail : ''}`}
                onClick={() => goToPage(index + 1)}
              >
                <img src={thumbnail} alt={`Page ${index + 1}`} />
                <span>{index + 1}</span>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'outline' && (
          <div className={styles.outlineView}>
            {/* Render document outline/bookmarks */}
          </div>
        )}
        
        {activeTab === 'search' && (
          <div className={styles.searchView}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in document..."
            />
            <button onClick={() => handleSearch(searchQuery)}>Search</button>
            
            <div className={styles.searchResults}>
              {/* Render search results */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## PDF Metadata Extraction

EbookAura extracts and stores PDF metadata for improved search and indexing:

```javascript
// scripts/extract-pdf-metadata.js
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function extractPdfMetadata(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // Extract basic metadata
    const metadata = {
      title: data.info.Title || path.basename(filePath, '.pdf'),
      author: data.info.Author || 'Unknown',
      subject: data.info.Subject || '',
      keywords: data.info.Keywords || '',
      creator: data.info.Creator || '',
      producer: data.info.Producer || '',
      creationDate: data.info.CreationDate || null,
      modDate: data.info.ModDate || null,
      pageCount: data.numpages,
      textContent: data.text.substring(0, 10000), // First 10000 chars for indexing
    };
    
    return metadata;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

// Main function to process all PDFs
async function processAllPdfs(directoryPath, outputPath) {
  const files = fs.readdirSync(directoryPath);
  const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
  
  const metadata = {};
  
  for (const file of pdfFiles) {
    const filePath = path.join(directoryPath, file);
    const fileMetadata = await extractPdfMetadata(filePath);
    
    if (fileMetadata) {
      metadata[file] = fileMetadata;
    }
  }
  
  // Write metadata to JSON file
  fs.writeFileSync(
    outputPath, 
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`Metadata extracted for ${Object.keys(metadata).length} PDF files`);
}

// Usage example
processAllPdfs(
  './public/books', 
  './public/pdf-metadata/metadata.json'
);
```

## Accessibility Features

EbookAura's PDF viewer includes accessibility features:

1. **Keyboard Navigation**: Full keyboard support for page navigation
2. **Screen Reader Support**: Properly labeled controls and content for screen readers
3. **Text Layer**: Selectable, accessible text layer over the PDF rendering
4. **Adjustable Size**: Zoom controls for better readability

## Performance Optimization

Several strategies are employed to optimize PDF viewing performance:

1. **Lazy Loading**: Pages are loaded on-demand as the user navigates
2. **Web Workers**: PDF processing is offloaded to web workers
3. **Canvas Caching**: Rendered pages are cached to improve navigation speed
4. **Progressive Loading**: Rendering starts with a low-resolution preview
5. **Code Splitting**: PDF components are loaded dynamically

## Integration with Reading Progress

The PDF viewer tracks and syncs reading progress:

```javascript
// src/app/hooks/useReadingProgress.js
import { useState, useEffect } from 'react';
import { getBookProgress, updateBookProgress } from '@/app/api/progress';

export function useReadingProgress(bookId) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load initial progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        const data = await getBookProgress(bookId);
        setProgress(data.progress);
      } catch (error) {
        console.error('Failed to load reading progress:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (bookId) {
      loadProgress();
    }
  }, [bookId]);
  
  // Update progress
  const updateProgress = async (page, totalPages) => {
    try {
      const data = await updateBookProgress(bookId, { page, totalPages });
      setProgress(data.progress);
      return data.progress;
    } catch (error) {
      console.error('Failed to update reading progress:', error);
      throw error;
    }
  };
  
  return {
    progress,
    loading,
    updateProgress,
  };
}
```

## Security Considerations

When implementing the PDF viewer, several security aspects were addressed:

1. **Content Protection**: Preventing unauthorized downloading
2. **Memory Management**: Handling large PDFs without performance issues
3. **Cross-Origin Restrictions**: Managing PDF resources across domains
4. **Sanitization**: Protection against malicious PDF content
5. **User Privacy**: Ensuring reading data is protected

## Conclusion

EbookAura's PDF handling system provides a secure, feature-rich reading experience while protecting content from unauthorized access. The implementation balances user experience with robust security measures, ensuring that both readers and content creators benefit from the platform. 