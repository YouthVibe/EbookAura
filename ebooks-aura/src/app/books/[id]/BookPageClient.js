'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaDownload, FaEye, FaBook, FaArrowLeft, FaStar, FaCalendarAlt, FaFileAlt, FaLock, FaCrown, FaUser, FaCoins, FaCheck } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import BookReview from '../../components/BookReview';
import styles from './book.module.css';
import { API_ENDPOINTS } from '../../utils/config';
import { createDownloadablePdf } from '../../utils/pdfUtils';
import { useAuth } from '../../context/AuthContext';
import { purchaseBook, checkBookPurchase } from '../../api/coins';
import { toast } from 'react-toastify';

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
  const [premiumError, setPremiumError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();
  const { user, isLoggedIn, getToken, getApiKey, updateUserCoins } = useAuth();
  
  // Computed properties for better readability
  const isPremiumBook = book?.isPremium;
  const userHasPurchased = book?.userHasAccess;
  const userHasEnoughCoins = user && book ? user.coins >= book.price : false;
  
  // Check if user has purchased the book
  const checkPurchaseStatus = useCallback(async () => {
    if (!isLoggedIn || !id || !isPremiumBook) {
      return;
    }
    
    try {
      const result = await checkBookPurchase(id);
      
      if (result && result.success) {
        // Update book with purchase status
        setBook(prevBook => ({
          ...prevBook,
          userHasAccess: result.hasPurchased
        }));
        
        if (result.hasPurchased) {
          setPurchaseSuccess(true);
        }
      }
    } catch (err) {
      console.error('Error checking book purchase status:', err);
      // Don't show an error UI to the user for this check
    }
  }, [isLoggedIn, id, isPremiumBook, setPurchaseSuccess, setBook]);
  
  // Check purchase status when auth state changes or after purchase
  useEffect(() => {
    if (isLoggedIn && id && isPremiumBook) {
      checkPurchaseStatus();
    }
  }, [isLoggedIn, id, isPremiumBook, checkPurchaseStatus]);
  
  // Static export safeguard - ensure ID is available
  useEffect(() => {
    if (!id) {
      console.error('BookPageClient: Book ID is missing or undefined');
      setError('Book ID is missing. Please go back and try again.');
      setLoading(false);
      return;
    }
    
    fetchBookDetails(id);
  }, [id]);
  
  // Refetch book details when auth state changes
  useEffect(() => {
    if (id && (user || isLoggedIn)) {
      fetchBookDetails(id);
    }
  }, [user, isLoggedIn, id]);

  // Clean up PDF blob URL when component unmounts or when PDF viewer is closed
  useEffect(() => {
    return () => {
      // Only clean up if pdfUrl is a string that starts with 'blob:'
      if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);
  
  // Function to fetch book details
  const fetchBookDetails = async (bookId) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // Always check for token directly from localStorage as a fallback
      const localStorageToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Add auth token if user is logged in to check purchase status
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // First try to use the token from auth context
      let token = getToken();
      
      // If no token from context but one exists in localStorage, use that instead
      if (!token && localStorageToken) {
        token = localStorageToken;
      }
      
      // Add token to headers if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/books/${bookId}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Book not found. It may have been removed or the ID is invalid.');
        } else {
          throw new Error(`Error fetching book details: ${response.status}`);
        }
      }
      
      const bookData = await response.json();
      
      if (!bookData) {
        throw new Error('No book data returned from the server');
      }
      
      // Set the book data in state
      setBook(bookData);
      
      // If premium book and user has access, clear any previous purchase states
      if (bookData.isPremium && bookData.userHasAccess) {
        setPurchaseSuccess(true);
        setPurchaseError(null);
      }
      
      // Track view if not tracked already in this session
      const viewedBooks = JSON.parse(localStorage.getItem('viewedBooks') || '[]');
      if (!viewedBooks.includes(bookId)) {
        // Add this book to viewed books in this session
        viewedBooks.push(bookId);
        localStorage.setItem('viewedBooks', JSON.stringify(viewedBooks));
        
        // Send view tracking request (no need to await)
        fetch(`${apiUrl}/books/${bookId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(e => console.error('Error tracking view:', e));
      }
    } catch (err) {
      console.error('Error fetching book details:', err);
      setError(err.message || 'Failed to load book details. Please try again.');
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
      
      // For premium content, add authentication headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (book.isPremium) {
        const token = getToken();
        const apiKey = getApiKey();
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
      }
      
      // Fetch the PDF data from our proxy endpoint
      const proxyUrl = `${API_ENDPOINTS.BOOKS.PDF_CONTENT(id)}?counted=true`;
      const response = await fetch(proxyUrl, { headers });
      
      if (!response.ok) {
        // Handle premium authentication error
        if (response.status === 401) {
          const errorData = await response.json();
          if (errorData.isPremium) {
            setPremiumError('This is premium content. Please log in to access it.');
            throw new Error('Premium content requires authentication');
          }
        }
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      // Get the PDF content as a blob
      const pdfBlob = await response.blob();
      
      // Set the PDF blob directly to be used by the viewer
      setPdfUrl(pdfBlob);
      setShowPdfViewer(true);
    } catch (err) {
      console.error('Error fetching PDF for viewing:', err);
      
      // Don't try fallback for premium content errors
      if (premiumError) {
        if (!isLoggedIn) {
          alert('This is premium content. Please log in to access it.');
          router.push('/login');
        } else {
          alert('You do not have access to this premium content.');
        }
        return;
      }
      
      // Fallback for non-premium errors
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
    // Check for premium content
    if (book.isPremium && !isLoggedIn) {
      setPremiumError('This is premium content. Please log in to access it.');
      router.push('/login');
      return;
    }
    
    fetchPdfForViewing();
  };

  const handleDownload = async () => {
    if (!book || !id) {
      console.error('Cannot download: Book data or ID is missing');
      return;
    }
    
    // Check for premium content
    if (book.isPremium && !isLoggedIn) {
      setPremiumError('This is premium content. Please log in to access it.');
      router.push('/login');
      return;
    }
      
    try {
      setDownloading(true);
      console.log('Downloading book with ID:', id);
      
      // For premium content, add authentication headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (book.isPremium) {
        const token = getToken();
        const apiKey = getApiKey();
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
      }
      
      // Increment download count via the API
      try {
        await fetch(API_ENDPOINTS.BOOKS.DOWNLOAD(id), {
          method: 'POST',
          headers
        });
      } catch (countErr) {
        console.warn('Failed to record download count, but continuing download:', countErr);
      }

      // Get a sanitized file name for the PDF
      const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      try {
        // Use our backend proxy to fetch the PDF content
        console.log(`Fetching PDF content via backend proxy for book: ${book.title}`);
        
        // Fetch the PDF data from our proxy endpoint
        const proxyUrl = `${API_ENDPOINTS.BOOKS.PDF_CONTENT(id)}?download=true&counted=true`;
        const response = await fetch(proxyUrl, { headers });
        
        if (!response.ok) {
          // Handle premium authentication error
          if (response.status === 401) {
            const errorData = await response.json();
            if (errorData.isPremium) {
              setPremiumError('This is premium content. Please log in to access it.');
              throw new Error('Premium content requires authentication');
            }
          }
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

  // Function to initiate the purchase process
  const initiateBookPurchase = () => {
    if (!book || !id) {
      console.error('Cannot purchase: Book data or ID is missing');
      return;
    }
    
    if (!isLoggedIn) {
      setPremiumError('You need to be logged in to purchase this book');
      router.push('/login');
      return;
    }
    
    // Check if user already owns the book
    if (userHasPurchased || purchaseSuccess) {
      toast.info('You already own this book');
      return;
    }
    
    // Check if user has enough coins
    if (!userHasEnoughCoins) {
      setPurchaseError(`You need ${book.price - user.coins} more coins to purchase this book`);
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };
  
  // Function to actually purchase the book after confirmation
  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      setPurchaseError(null);
      setShowConfirmation(false);
      
      const result = await purchaseBook(id);
      
      // Update user's coins
      if (result && typeof result.coins === 'number') {
        updateUserCoins(result.coins);
        
        // Check purchase status to update UI
        await checkPurchaseStatus();
        
        setPurchaseSuccess(true);
        toast.success('Book purchased successfully!');
      }
    } catch (err) {
      console.error('Error purchasing book:', err);
      
      // Extract error message from the response if available
      let errorMessage = 'Failed to purchase book. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setPurchaseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPurchasing(false);
    }
  };
  
  // Function to cancel purchase
  const cancelPurchase = () => {
    setShowConfirmation(false);
  };
  
  // Force check login state
  const forceCheckLogin = () => {
    // Check local storage directly
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      try {
        // Fetch book with auth token to refresh state
        fetchBookDetails(id);
        
        // Show success message
        toast.info('Auth state refreshed');
      } catch (e) {
        console.error('Error refreshing auth state:', e);
      }
    } else {
      toast.error('No login data found in local storage');
    }
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
              <>
                <img src={book.coverImage} alt={book.title} />
                {isPremiumBook && (
                  <div className={styles.premiumOverlay}>
                    <FaLock className={styles.lockIcon} />
                  </div>
                )}
              </>
            ) : (
              <div className={styles.placeholderCover}>
                <FaBook />
                {isPremiumBook && <FaLock className={styles.lockIconPlaceholder} />}
              </div>
            )}
            {isPremiumBook && (
              <div className={styles.premiumBadge}>
                <FaCrown className={styles.crownIcon} /> Premium
              </div>
            )}
          </div>

          <div className={styles.bookInfo}>
            <h1 className={styles.title}>{book.title}</h1>
            <p className={styles.author}>by {book.author}</p>
            <div className={styles.categoryInfo}>
              <p className={styles.category}>{book.category}</p>
              {isPremiumBook && (
                <span className={styles.premiumTag}>
                  <FaCrown className={styles.premiumIcon} /> Premium
                </span>
              )}
            </div>
            
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
            
            {/* Display price for premium books */}
            {isPremiumBook && (
              <div className={styles.premiumPurchaseContainer}>
                {/* Debug info - only in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '10px', background: '#f0f0f0', padding: '5px', marginBottom: '10px', borderRadius: '4px', display: 'none' }}>
                    <div>Debug: isLoggedIn={String(isLoggedIn)}</div>
                    <div>Debug: userHasPurchased={String(userHasPurchased)}</div>
                  </div>
                )}
                
                <div className={styles.premiumInfo}>
                  <div className={styles.premiumPrice}>
                    <FaCoins className={styles.coinIcon} />
                    <span className={styles.priceValue}>{book.price}</span> coins
                  </div>
                  
                  {isLoggedIn && (
                    <div className={styles.userCoins}>
                      <span>Your balance: </span>
                      <FaCoins className={styles.coinIcon} />
                      <span className={styles.coinValue}>{user?.coins || 0}</span> coins
                    </div>
                  )}
                </div>
                
                {/* Purchase section for logged in users */}
                {isLoggedIn && !userHasPurchased && !purchaseSuccess && (
                  <>
                    {purchaseError && (
                      <div className={styles.purchaseError}>
                        {purchaseError}
                      </div>
                    )}
                    
                    <button 
                      onClick={initiateBookPurchase}
                      className={`${styles.purchaseButton} ${!userHasEnoughCoins ? styles.disabledPurchase : ''}`}
                      disabled={purchasing || !userHasEnoughCoins}
                    >
                      {purchasing ? 'Processing...' : (
                        <>
                          <FaCoins className={styles.buttonCoinIcon} />
                          Purchase with Coins
                        </>
                      )}
                    </button>
                    
                    {!userHasEnoughCoins && (
                      <div className={styles.insufficientCoins}>
                        You need <strong>{book.price - user.coins}</strong> more coins to purchase this book.
                        <Link href="/coins" className={styles.getCoinsLink}>
                          <FaCoins className={styles.coinIcon} /> Get more coins
                        </Link>
                      </div>
                    )}
                  </>
                )}
                
                {/* Success message after purchase */}
                {(userHasPurchased || purchaseSuccess) && (
                  <div className={styles.purchaseSuccess}>
                    <FaCheck /> You own this book! You can now access the full content.
                  </div>
                )}
                
                {/* Message for non-logged in users */}
                {!isLoggedIn && (
                  <div className={styles.purchaseLogin}>
                    <Link href="/login" className={styles.loginLink}>
                      <FaUser className={styles.userIcon} /> Log in
                    </Link> 
                    to purchase this premium book.
                    
                    {process.env.NODE_ENV === 'development' && (
                      <button 
                        onClick={forceCheckLogin}
                        style={{
                          display: 'none', // Hide in UI but keep for debugging
                          marginLeft: '10px',
                          fontSize: '11px',
                          padding: '3px 6px',
                          background: '#f0f0f0',
                          border: '1px solid #ccc',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Retry login check
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={styles.actions}>
              {book.isCustomUrl ? (
                // For custom URL PDFs, show a single "Open PDF" button that redirects to the URL
                <button 
                  onClick={handleOpenCustomUrl}
                  className={`${styles.openUrlButton} ${(isPremiumBook && !userHasPurchased && !purchaseSuccess) ? styles.disabledButton : ''}`}
                  disabled={openingCustomUrl || (isPremiumBook && !userHasPurchased && !purchaseSuccess)}
                >
                  <FaFileAlt /> {openingCustomUrl ? 'Opening...' : 'Open PDF'}
                </button>
              ) : (
                // For regular PDFs, show the standard View and Download buttons
                <>
                  <button 
                    onClick={handleViewPdf} 
                    className={`${styles.viewButton} ${(isPremiumBook && !userHasPurchased && !purchaseSuccess) ? styles.disabledButton : ''}`}
                    disabled={viewing || (isPremiumBook && !userHasPurchased && !purchaseSuccess)}
                  >
                    <FaFileAlt /> {viewing ? 'Opening...' : 'View PDF'}
                  </button>
                  
                  <button 
                    onClick={handleDownload} 
                    className={`${styles.downloadButton} ${(isPremiumBook && !userHasPurchased && !purchaseSuccess) ? styles.disabledButton : ''}`}
                    disabled={downloading || (isPremiumBook && !userHasPurchased && !purchaseSuccess)}
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

      {/* Purchase confirmation dialog */}
      {showConfirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationDialog}>
            <h3>Confirm Purchase</h3>
            <p>Are you sure you want to purchase "{book.title}" for {book.price} coins?</p>
            <div className={styles.confirmationButtons}>
              <button onClick={cancelPurchase} className={styles.cancelButton}>Cancel</button>
              <button onClick={handlePurchase} className={styles.confirmButton}>Confirm Purchase</button>
            </div>
          </div>
        </div>
      )}

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