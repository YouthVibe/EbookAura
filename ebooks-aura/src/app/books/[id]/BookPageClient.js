'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaEye, FaBook, FaArrowLeft, FaStar, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookReview from '../../components/BookReview';
import styles from './book.module.css';
import { API_ENDPOINTS } from '../../utils/config';

export default function BookPageClient({ id }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const router = useRouter();
  
  // Static export safeguard - ensure ID is available
  useEffect(() => {
    if (!id && typeof window !== 'undefined') {
      // Get ID from URL path if not provided as prop
      const pathParts = window.location.pathname.split('/');
      const pathId = pathParts[pathParts.length - 1];
      
      if (pathId) {
        console.log('Using ID from URL path:', pathId);
        fetchBookDetails(pathId);
      } else {
        setError('Book ID is missing');
        setLoading(false);
      }
    } else if (id) {
      fetchBookDetails(id);
    } else {
      setError('Book ID is missing');
      setLoading(false);
    }
  }, [id]);
  
  // Extracted fetch logic into a separate function
  const fetchBookDetails = async (bookId) => {
    try {
      console.log('BookPage: Fetching details for book ID:', bookId);
      setLoading(true);
      
      const response = await fetch(API_ENDPOINTS.BOOKS.DETAILS(bookId));
      
      if (!response.ok) {
        console.error(`Book fetch failed with status: ${response.status}`);
        throw new Error('Book not found');
      }
      
      const bookData = await response.json();
      console.log('Book data received:', bookData);
      setBook(bookData);
      setError(null);
    } catch (err) {
      console.error('Error in fetchBook:', err);
      setError('Error loading book details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    // Use proper ID (from props or extracted from URL)
    const bookId = id || (typeof window !== 'undefined' ? 
      window.location.pathname.split('/').pop() : null);
      
    try {
      if (!bookId) {
        console.error('Cannot download: Book ID is missing');
        return;
      }
      
      setDownloading(true);
      console.log('Downloading book with ID:', bookId);
      
      // Increment download count via the API
      await fetch(API_ENDPOINTS.BOOKS.DOWNLOAD(bookId), {
        method: 'POST',
      });

      // Get a sanitized file name for the PDF
      const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      try {
        // Use our backend proxy to fetch the PDF content
        console.log(`Fetching PDF content via backend proxy for book: ${book.title}`);
        
        // Fetch the PDF data from our proxy endpoint
        const proxyUrl = `${API_ENDPOINTS.BOOKS.PDF_CONTENT(bookId)}?download=true&counted=true`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Get the PDF content as a blob
        const pdfBlob = await response.blob();
        
        // Create a blob URL for the PDF
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        // Create a link element to trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        
        // Add the link to the document and click it
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up by removing the link and revoking the blob URL
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        console.log(`PDF downloaded as: ${fileName}`);
      } catch (directDownloadError) {
        console.warn('Direct download failed, using fallback:', directDownloadError);
        // Fallback to original backend endpoint if proxy fails
        const fallbackUrl = `${API_ENDPOINTS.BOOKS.PDF(bookId)}?download=true&counted=true`;
        window.open(fallbackUrl, '_blank');
      }
      
      // Update local state to show download count increased
      setBook({
        ...book,
        downloads: book.downloads + 1
      });
    } catch (err) {
      console.error('Error downloading book:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleViewPdf = async () => {
    // Use proper ID (from props or extracted from URL)
    const bookId = id || (typeof window !== 'undefined' ? 
      window.location.pathname.split('/').pop() : null);
      
    try {
      if (!bookId) {
        console.error('Cannot view PDF: Book ID is missing');
        return;
      }
      
      setViewing(true);
      console.log('Viewing PDF for book ID:', bookId);
      
      // For viewing, we'll open the PDF directly in a new tab
      // Use the original URL which should work for viewing
      try {
        // Use the existing PDF endpoint which sets proper headers for viewing
        const viewUrl = `${API_ENDPOINTS.BOOKS.PDF(bookId)}?counted=true`;
        console.log(`Opening PDF for viewing at: ${viewUrl}`);
        window.open(viewUrl, '_blank');
      } catch (viewError) {
        console.warn('Error viewing PDF:', viewError);
        // Fallback - try direct URL if our endpoint fails
        if (book.pdfUrl) {
          const directUrl = book.pdfUrl.endsWith('.pdf') ? book.pdfUrl : `${book.pdfUrl}.pdf`;
          console.log(`Fallback: Opening PDF directly at: ${directUrl}`);
          window.open(directUrl, '_blank');
        } else {
          throw new Error('No PDF URL available for viewing');
        }
      }
    } catch (err) {
      console.error('Error viewing PDF:', err);
    } finally {
      setViewing(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
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
    return <div className={styles.error}>Book not found</div>;
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

            <div className={styles.buttonGroup}>
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
            </div>
          </div>
        </div>

        <BookReview bookId={id} />
      </div>
    </div>
  );
} 