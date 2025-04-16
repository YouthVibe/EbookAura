'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FaDownload, FaEye, FaBook, FaArrowLeft, FaStar, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import Link from 'next/link';
import BookReview from '../../components/BookReview';
import styles from './book.module.css';

export default function BookPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  
  useEffect(() => {
    const fetchBook = async () => {
      try {
        if (!id) {
          setError('Book ID is missing');
          setLoading(false);
          return;
        }
        
        console.log('BookPage: Fetching details for book ID:', id);
        setLoading(true);
        const response = await fetch(`/api/books/${id}`);
        
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

    fetchBook();
  }, [id]);

  const handleDownload = async () => {
    try {
      if (!id) {
        console.error('Cannot download: Book ID is missing');
        return;
      }
      
      setDownloading(true);
      console.log('Downloading book with ID:', id);
      
      // Increment download count via the API
      await fetch(`/api/books/${id}/download`, {
        method: 'POST',
      });

      // Get a sanitized file name for the PDF
      const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      try {
        // Use our backend proxy to fetch the PDF content
        console.log(`Fetching PDF content via backend proxy for book: ${book.title}`);
        
        // Fetch the PDF data from our proxy endpoint
        const proxyUrl = `/api/books/${id}/pdf-content?download=true&counted=true`;
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
        const fallbackUrl = `/api/books/${id}/pdf?download=true&counted=true`;
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
    try {
      if (!id) {
        console.error('Cannot view PDF: Book ID is missing');
        return;
      }
      
      setViewing(true);
      console.log('Viewing PDF for book ID:', id);
      
      // For viewing, we'll open the PDF directly in a new tab
      // Use the original URL which should work for viewing
      try {
        // Use the existing PDF endpoint which sets proper headers for viewing
        const viewUrl = `/api/books/${id}/pdf?counted=true`;
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