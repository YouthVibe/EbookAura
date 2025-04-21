'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaEye, FaBook, FaArrowLeft, FaStar, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import BookReview from '../../components/BookReview';
import styles from './book.module.css';
import { API_ENDPOINTS } from '../../utils/config';
import { createDownloadablePdf } from '../../utils/pdfUtils';

// Dynamically import PdfViewer with no SSR to avoid the Promise.withResolvers error
const PdfViewer = dynamic(() => import('../../components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Loading PDF viewer...</p>
    </div>
  ),
});

export default function BookPageClient({ id }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [openingCustomUrl, setOpeningCustomUrl] = useState(false);
  const router = useRouter();
  
  // Static export safeguard - ensure ID is available
  useEffect(() => {
    if (!id) {
      console.error('BookPageClient: Book ID is missing or undefined');
      setError('Book ID is missing. Please go back and try again.');
      setLoading(false);
      return;
    }
    
    console.log('BookPageClient: Initializing with book ID:', id);
    fetchBookDetails(id);
  }, [id]);

  // Clean up PDF blob URL when component unmounts or when PDF viewer is closed
  useEffect(() => {
    return () => {
      // Only clean up if pdfUrl is a string that starts with 'blob:'
      if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);
  
  // Extracted fetch logic into a separate function
  const fetchBookDetails = async (bookId) => {
    try {
      console.log('BookPageClient: Fetching details for book ID:', bookId);
      setLoading(true);
      
      const response = await fetch(API_ENDPOINTS.BOOKS.DETAILS(bookId), {
        // Add cache control headers
        cache: 'no-store', // Don't cache this request 
        next: { revalidate: 60 } // Or revalidate every 60 seconds
      });
      
      if (!response.ok) {
        console.error(`Book fetch failed with status: ${response.status}`);
        throw new Error(response.status === 404 
          ? 'Book not found. It may have been removed or the ID is incorrect.' 
          : `Failed to load book (${response.status})`);
      }
      
      const bookData = await response.json();
      console.log('Book data received:', bookData);
      
      // Enhanced logging for custom URL PDFs
      if (bookData.isCustomUrl) {
        console.log('Book has custom URL:', bookData.customURLPDF || bookData.pdfUrl);
        console.log('Will display single "Open PDF" button instead of View/Download buttons');
        console.log('This button will redirect to:', bookData.customURLPDF || bookData.pdfUrl);
      }
      
      // Validate the book data
      if (!bookData || typeof bookData !== 'object') {
        throw new Error('Invalid book data received from server');
      }
      
      setBook(bookData);
      setError(null);
    } catch (err) {
      console.error('Error in fetchBookDetails:', err);
      setError(err.message || 'Error loading book details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPdfForViewing = async () => {
    if (!book || !id) {
      console.error('Cannot view PDF: Book data or ID is missing');
      return;
    }
    
    try {
      setViewing(true);
      console.log('Fetching PDF content for viewing, book ID:', id);
      
      // Fetch the PDF data from our proxy endpoint - no authentication needed
      const proxyUrl = `${API_ENDPOINTS.BOOKS.PDF_CONTENT(id)}?counted=true`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      // Get the PDF content as a blob
      const pdfBlob = await response.blob();
      
      // Set the PDF blob directly to be used by the viewer
      setPdfUrl(pdfBlob);
      setShowPdfViewer(true);
    } catch (err) {
      console.error('Error fetching PDF for viewing:', err);
      
      // Fallback - try direct URL if our endpoint fails
      try {
        if (book.pdfUrl) {
          const directUrl = book.pdfUrl.endsWith('.pdf') ? book.pdfUrl : `${book.pdfUrl}.pdf`;
          console.log(`Fallback: Using direct PDF URL: ${directUrl}`);
          setPdfUrl(directUrl);
          setShowPdfViewer(true);
        } else {
          throw new Error('No PDF URL available for viewing');
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        alert('Failed to load PDF for viewing. Please try downloading instead.');
      }
    } finally {
      setViewing(false);
    }
  };

  const handleViewPdf = async () => {
    // Public access - no authentication needed
    fetchPdfForViewing();
  };

  const handleDownload = async () => {
    if (!book || !id) {
      console.error('Cannot download: Book data or ID is missing');
      return;
    }
      
    try {
      setDownloading(true);
      console.log('Downloading book with ID:', id);
      
      // Increment download count via the API - public access, no authentication needed
      try {
        await fetch(API_ENDPOINTS.BOOKS.DOWNLOAD(id), {
          method: 'POST',
        });
      } catch (countErr) {
        console.warn('Failed to record download count, but continuing download:', countErr);
      }

      // Get a sanitized file name for the PDF
      const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      try {
        // Use our backend proxy to fetch the PDF content - public access, no authentication needed
        console.log(`Fetching PDF content via backend proxy for book: ${book.title}`);
        
        // Fetch the PDF data from our proxy endpoint
        const proxyUrl = `${API_ENDPOINTS.BOOKS.PDF_CONTENT(id)}?download=true&counted=true`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Get the PDF content as a blob
        const pdfBlob = await response.blob();
        
        // Use our utility function to create a downloadable PDF
        const result = createDownloadablePdf(pdfBlob, fileName);
        
        if (!result.success) {
          throw new Error(result.error || 'Download failed');
        }
        
        console.log(`PDF downloaded as: ${fileName}`);
      } catch (directDownloadError) {
        console.warn('Direct download failed, using fallback:', directDownloadError);
        // Fallback to original backend endpoint if proxy fails - public access, no authentication needed
        const fallbackUrl = `${API_ENDPOINTS.BOOKS.PDF(id)}?download=true&counted=true`;
        window.open(fallbackUrl, '_blank');
      }
      
      // Update local state to show download count increased
      setBook(prevBook => ({
        ...prevBook,
        downloads: (prevBook.downloads || 0) + 1
      }));
    } catch (err) {
      console.error('Error downloading book:', err);
    } finally {
      setDownloading(false);
    }
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    // Clean up any blob URLs - this is no longer needed with the updated PdfViewer component
    // which handles its own blob URL cleanup
    setPdfUrl(null);
  };

  // Function to handle opening custom URLs
  const handleOpenCustomUrl = () => {
    if (!book) {
      console.error('Cannot open custom URL: Book data is missing');
      return;
    }
    
    try {
      setOpeningCustomUrl(true);
      const customUrl = book.customURLPDF || book.pdfUrl;
      
      // Log the action for debugging and potential analytics
      console.log('Opening custom URL PDF:', customUrl);
      
      // Increment download count via the API - still count as a "download" for analytics
      try {
        fetch(API_ENDPOINTS.BOOKS.DOWNLOAD(id), {
          method: 'POST',
        }).then(() => {
          // Update local state to show download count increased
          setBook(prevBook => ({
            ...prevBook,
            downloads: (prevBook.downloads || 0) + 1
          }));
          
          // Open the URL in a new tab
          window.open(customUrl, '_blank');
        }).catch(countErr => {
          console.warn('Failed to record download count for custom URL:', countErr);
          // Still open the URL even if tracking fails
          window.open(customUrl, '_blank');
        }).finally(() => {
          setOpeningCustomUrl(false);
        });
      } catch (err) {
        console.error('Error opening custom URL:', err);
        // Still try to open the URL directly as a fallback
        window.open(customUrl, '_blank');
        setOpeningCustomUrl(false);
      }
    } catch (err) {
      console.error('Error opening custom URL:', err);
      alert('Failed to open the PDF. Please try again or contact support if the problem persists.');
      setOpeningCustomUrl(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading book details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <Link href="/search" className={styles.backButton}>
          <FaArrowLeft /> Back to Search
        </Link>
      </div>
    );
  }

  if (!book) {
    return (
      <div className={styles.error}>
        <h2>Book Not Found</h2>
        <p>We couldn't find the book you're looking for.</p>
        <Link href="/search" className={styles.backButton}>
          <FaArrowLeft /> Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/search" className={styles.backButton}>
        <FaArrowLeft /> Back to Search
      </Link>

      <div className={styles.bookDetailContainer}>
        <div className={styles.bookInformation}>
          <div className={styles.bookCover}>
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} />
            ) : (
              <div className={styles.placeholderCover}>
                <FaBook />
              </div>
            )}
          </div>

          <div className={styles.bookInfo}>
            <h1 className={styles.title}>{book.title}</h1>
            <p className={styles.author}>by {book.author}</p>
            <p className={styles.category}>{book.category}</p>
            
            <div className={styles.stats}>
              <span className={styles.stat}>
                <FaEye /> {book.views} views
              </span>
              <span className={styles.stat}>
                <FaDownload /> {book.downloads} downloads
              </span>
              {book.averageRating > 0 && (
                <span className={styles.stat}>
                  <FaStar /> {book.averageRating.toFixed(1)}
                </span>
              )}
              {book.pageSize > 0 && (
                <span className={styles.stat}>
                  <FaFileAlt /> {book.pageSize} pages
                </span>
              )}
              {book.fileSizeMB > 0 && (
                <span className={styles.stat}>
                  <FaFileAlt /> {book.fileSizeMB} MB
                </span>
              )}
            </div>

            <div className={styles.description}>
              <h2>Description</h2>
              <p>{book.description}</p>
            </div>

            <div className={styles.tags}>
              <h2>Tags</h2>
              <div className={styles.tagList}>
                {book.tags && book.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {(!book.tags || book.tags.length === 0) && (
                  <span className={styles.noTags}>No tags</span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              {book.isCustomUrl ? (
                // For custom URL PDFs, show a single "Open PDF" button that redirects to the URL
                <button 
                  onClick={handleOpenCustomUrl}
                  className={styles.openUrlButton}
                  disabled={openingCustomUrl}
                >
                  <FaFileAlt /> {openingCustomUrl ? 'Opening...' : 'Open PDF'}
                </button>
              ) : (
                // For regular PDFs, show the standard View and Download buttons
                <>
                  <button 
                    onClick={handleViewPdf} 
                    className={styles.viewButton}
                    disabled={viewing}
                  >
                    <FaFileAlt /> {viewing ? 'Opening...' : 'View PDF'}
                  </button>
                  
                  <button 
                    onClick={handleDownload} 
                    className={styles.downloadButton}
                    disabled={downloading}
                  >
                    <FaDownload /> {downloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <BookReview bookId={id} />
      </div>

      {showPdfViewer && pdfUrl && typeof window !== 'undefined' && (
        <PdfViewer 
          pdfUrl={pdfUrl}
          onClose={closePdfViewer}
          title={book.title}
          allowDownload={true}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
} 