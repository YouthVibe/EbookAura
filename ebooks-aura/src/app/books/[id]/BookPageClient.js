'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { getAPI, postAPI } from '../../api/apiUtils';

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
  const [debugMode, setDebugMode] = useState(false);
  const router = useRouter();
  const { user, isLoggedIn, getToken, getApiKey, updateUserCoins } = useAuth();
  
  // Refs to help with race conditions
  const prevIsLoggedInRef = useRef(false);
  const isFetchingRef = useRef(false);
  
  // Check URL for debug parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Enable debug mode if URL contains debug=true
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('debug')) {
        setDebugMode(true);
        console.log('DEBUG MODE ENABLED VIA URL');
      }
      
      // Set up key sequence detection for debug mode
      let keySequence = [];
      const debugSequence = [17, 16, 80, 17, 16, 80]; // Ctrl+Shift+P twice
      
      const handleKeyDown = (e) => {
        keySequence.push(e.keyCode);
        if (keySequence.length > debugSequence.length) {
          keySequence.shift();
        }
        
        // Check if sequence matches
        if (keySequence.join('') === debugSequence.join('')) {
          setDebugMode(prevMode => !prevMode);
          console.log('DEBUG MODE TOGGLED VIA KEY SEQUENCE');
          keySequence = [];
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, []);
  
  // Computed properties for better readability and premium status handling
  // Using explicit boolean conversion for consistent behavior in all environments
  // More robust premium detection to handle various data types from the API
  const isPremiumBook = book ? (
    // Explicitly check all possible truthy representations that might come from different environments
    book.isPremium === true || 
    book.isPremium === 'true' || 
    book.isPremium === 1 ||
    String(book.isPremium).toLowerCase() === 'true' ||
    // If there's a price, it must be premium
    (book.price && Number(book.price) > 0)
  ) : false;
  
  const userHasPurchased = book ? (
    book.userHasAccess === true || 
    book.userHasAccess === 'true' ||
    book.userHasAccess === 1 ||
    String(book.userHasAccess).toLowerCase() === 'true'
  ) : false;
  
  const userHasEnoughCoins = user && book ? (
    Number(user.coins || 0) >= Number(book.price || 0)
  ) : false;
  
  // Get the book price (or default to 25 coins if premium but no price)
  const bookPrice = book ? (
    book.price ? Number(book.price) : (isPremiumBook ? 25 : 0)
  ) : 0;
  
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
  
  // Combined useEffect to handle both initial load and auth changes
  useEffect(() => {
    // Don't fetch if ID is missing
    if (!id) {
      console.error('BookPageClient: Book ID is missing or undefined');
      setError('Book ID is missing. Please go back and try again.');
      setLoading(false);
      return;
    }

    // Flag to track if we should fetch based on auth state
    let shouldFetch = true;

    // If this is an auth state change (not initial load)
    if (loading === false) {
      // Only fetch again if authentication just happened (we went from not logged in to logged in)
      // or if we're still waiting for book data
      shouldFetch = (isLoggedIn && !prevIsLoggedInRef.current) || !book;
    }

    // Track previous auth state for future comparison
    prevIsLoggedInRef.current = isLoggedIn;

    if (shouldFetch) {
      // Use a setTimeout to ensure this executes after any auth token checks complete
      setTimeout(() => fetchBookDetails(id), 50);
    }
  }, [id, isLoggedIn, user]);

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
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      
      // Use our API utility to fetch book details
      const bookData = await getAPI(`/books/${bookId}`);
      
      // Debug log book data to diagnose issues
      console.log('Raw book data structure:', JSON.stringify(bookData).substring(0, 500) + '...');
      console.log('Raw isPremium value:', String(bookData.isPremium), 'type:', typeof bookData.isPremium);
      console.log('Raw price value:', String(bookData.price), 'type:', typeof bookData.price);
      
      // Extract premium data specifically to ensure consistent type handling
      const extractedData = {
        isPremium: bookData.isPremium === true || 
                   bookData.isPremium === 'true' ||
                   bookData.isPremium === 1 ||
                   String(bookData.isPremium).toLowerCase() === 'true',
        price: bookData.price ? Number(bookData.price) : 0,
        userHasAccess: bookData.userHasAccess === true || 
                      bookData.userHasAccess === 'true' ||
                      bookData.userHasAccess === 1 ||
                      String(bookData.userHasAccess).toLowerCase() === 'true'
      };
      
      console.log('Book data received:', {
        id: bookData._id || bookData.id,
        title: bookData.title,
        isPremium: extractedData.isPremium,
        userHasAccess: extractedData.userHasAccess,
        price: extractedData.price
      });
      
      // Ensure premium properties are correctly typed
      // This fixes potential issues between dev and production environments
      const normalizedBookData = {
        ...bookData,
        // Handle various possible formats for isPremium flag
        isPremium: extractedData.isPremium,
        // Ensure userHasAccess is a proper boolean
        userHasAccess: extractedData.userHasAccess,
        // Ensure price is a number
        price: extractedData.price
      };
      
      // Add an additional safeguard - if there's a price, it must be premium
      if (!normalizedBookData.isPremium && normalizedBookData.price > 0) {
        console.log(`Force setting isPremium=true for book with price ${normalizedBookData.price}`);
        normalizedBookData.isPremium = true;
      }
      
      console.log('Normalized book data:', {
        isPremium: normalizedBookData.isPremium,
        userHasAccess: normalizedBookData.userHasAccess,
        price: normalizedBookData.price
      });
      
      setBook(normalizedBookData);
      setError(null);
    } catch (err) {
      console.error('Error fetching book details:', err);
      setError(`Failed to fetch book details: ${err.message}`);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
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
    if (isPremiumBook && !isLoggedIn) {
      setPremiumError('This is premium content. Please log in to access it.');
      router.push('/login');
      return;
    }
    
    // Check if user has purchased this premium content
    if (isPremiumBook && isLoggedIn && !userHasPurchased && !purchaseSuccess) {
      setPremiumError('You need to purchase this book to access it.');
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
    if (isPremiumBook && !isLoggedIn) {
      setPremiumError('This is premium content. Please log in to access it.');
      router.push('/login');
      return;
    }
    
    // Check if user has purchased this premium content
    if (isPremiumBook && isLoggedIn && !userHasPurchased && !purchaseSuccess) {
      setPremiumError('You need to purchase this book to download it.');
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
      setPurchaseError(`You need ${bookPrice - user.coins} more coins to purchase this book`);
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

  // Enhanced forceCheckPremium function
  const forceCheckPremium = useCallback(() => {
    if (!book) return;
    
    setDebugMode(true);
    
    console.log('======= PREMIUM STATUS DEBUG =======');
    console.log('Raw values:');
    console.log(`- isPremium = ${String(book.isPremium)} (${typeof book.isPremium})`);
    console.log(`- price = ${String(book.price)} (${typeof book.price})`);
    console.log(`- Current computed isPremiumBook: ${isPremiumBook}`);
    
    // Safeguard raw values - create fixed copies with proper types
    let fixedIsPremium = false;
    let fixedPrice = 0;
    
    // Normalize isPremium value
    if (book.isPremium === true || 
        book.isPremium === 'true' || 
        book.isPremium === 1 ||
        String(book.isPremium).toLowerCase() === 'true') {
      fixedIsPremium = true;
    }
    
    // Normalize price value
    if (book.price) {
      if (typeof book.price === 'number') {
        fixedPrice = book.price;
      } else if (typeof book.price === 'string') {
        fixedPrice = parseFloat(book.price.replace(/[^0-9.-]+/g, ''));
      } else if (typeof book.price === 'object' && book.price.$numberLong) {
        // Handle MongoDB long values
        fixedPrice = Number(book.price.$numberLong);
      } else {
        fixedPrice = Number(book.price);
      }
    }
    
    // Logic to determine premium status
    let shouldBePremium = fixedIsPremium;
    
    // If has price but not marked premium, should be premium
    if (!shouldBePremium && fixedPrice > 0) {
      shouldBePremium = true;
    }
    
    // Default price for premium books
    if (shouldBePremium && fixedPrice <= 0) {
      fixedPrice = 25;
    }
    
    console.log('\nFixed values:');
    console.log(`- fixedIsPremium = ${fixedIsPremium}`);
    console.log(`- fixedPrice = ${fixedPrice}`);
    console.log(`- shouldBePremium = ${shouldBePremium}`);
    
    // Update the book state with the fixed values
    setBook(prevBook => ({
      ...prevBook,
      isPremium: shouldBePremium,
      price: fixedPrice
    }));
    
    console.log('\nBook state updated with fixed values.');
    console.log('==================================');
    
    // Show a toast notification
    toast.success('Premium status check complete');
    
    // Try to request a fresh copy from the server
    setTimeout(() => {
      try {
        fetchBookDetails(id);
        console.log('Refreshed book data from server');
      } catch (err) {
        console.error('Error refreshing book data:', err);
      }
    }, 1000);
  }, [book, isPremiumBook, id, fetchBookDetails]);

  // Improved debug logging for premium detection
  useEffect(() => {
    if (book) {
      console.log('Premium detection debug:', {
        rawIsPremium: book.isPremium,
        isPremiumType: typeof book.isPremium,
        rawPrice: book.price,
        priceType: typeof book.price,
        computedIsPremium: isPremiumBook
      });
    }
  }, [book, isPremiumBook]);

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
        <div style={{ marginTop: "20px" }}>
          <Link href="/search" className={styles.backButton}>
            <FaArrowLeft /> Back to Search
          </Link>
          <button 
            onClick={forceCheckPremium}
            style={{
              display: 'none', // Hide the debug button but keep it available
              marginLeft: '10px',
              padding: '8px 15px',
              background: '#ff5b5b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Debug Premium Status
          </button>
        </div>
        
        {/* Show API URL debug info */}
        <div style={{ 
          display: 'none', // Hide the debug info section
          marginTop: '20px', 
          padding: '10px', 
          background: '#f8f8f8', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}>
          <h3>API Connection Debug Info</h3>
          <p><strong>Book ID:</strong> {id}</p>
          <p><strong>API URL:</strong> {API_ENDPOINTS.BOOKS.DETAILS(id)}</p>
          <p><strong>Direct URL:</strong> https://ebookaura.onrender.com/api/books/{id}</p>
          <p>
            <button
              onClick={() => window.open(`https://ebookaura.onrender.com/api/books/${id}`, '_blank')}
              style={{
                padding: '5px 10px',
                background: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Try Direct API
            </button>
            <button
              onClick={() => {
                // Force refresh the page with cache busting
                const cacheBuster = Date.now();
                window.location.href = `${window.location.pathname}?refresh=${cacheBuster}`;
              }}
              style={{
                padding: '5px 10px',
                background: '#34a853',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Force Refresh
            </button>
          </p>
        </div>
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
      <div className={styles.header}>
        <Link href="/search" className={styles.backButton}>
          <FaArrowLeft /> Back to Search
        </Link>
        
        {/* Debug button in price section */}
        <button
          onClick={forceCheckPremium}
          style={{
            display: 'none', // Hide debug button
            marginLeft: '10px',
            padding: '8px 15px',
            background: '#5b89ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          className={styles.debugButton}
        >
          {isPremiumBook ? '✓ Premium Book' : 'Debug Premium'}
        </button>
      </div>

      <div className={styles.bookDetailContainer}>
        <div className={styles.bookInformation}>
          <div className={styles.bookCover}>
            {book.coverImage ? (
              <>
                <img src={book.coverImage} alt={book.title} />
                {(isPremiumBook || book?.price > 0) && (
                  <div className={styles.premiumOverlay}>
                    <FaLock className={styles.lockIcon} />
                  </div>
                )}
              </>
            ) : (
              <div className={styles.placeholderCover}>
                <FaBook />
                {(isPremiumBook || book?.price > 0) && <FaLock className={styles.lockIconPlaceholder} />}
              </div>
            )}
            {(isPremiumBook || book?.price > 0) && (
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
              {(isPremiumBook || book?.price > 0) && (
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
            
            {/* Display price for premium books with improved condition */}
            {/* More robust condition check for production environments */}
            {(isPremiumBook || book?.price > 0) && (
              <div className={styles.premiumPurchaseContainer}>
                {/* Debug info - visible if debug mode is on */}
                {(process.env.NODE_ENV === 'development' || debugMode) && (
                  <div style={{
                    display: debugMode ? 'block' : 'none', // Show if debug mode is active
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '0.85rem'
                  }}>
                    <h3>Book Status Debug Information</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                      <li><strong>Book ID:</strong> {id}</li>
                      <li><strong>Title:</strong> {book?.title}</li>
                      <li><strong>Raw isPremium:</strong> {String(book?.isPremium)}</li>
                      <li><strong>Raw price:</strong> {String(book?.price)}</li>
                      <li><strong>isPremium type:</strong> {typeof book?.isPremium}</li>
                      <li><strong>price type:</strong> {typeof book?.price}</li>
                      <li><strong>Computed isPremiumBook:</strong> {String(isPremiumBook)}</li>
                      <li><strong>Premium Status:</strong> {isPremiumBook ? 'Premium Book' : 'Free Book'}</li>
                      <li><strong>Has Purchased:</strong> {userHasPurchased ? 'Yes' : 'No'}</li>
                      <li><strong>Is Logged In:</strong> {isLoggedIn ? 'Yes' : 'No'}</li>
                      <li><strong>User Coins:</strong> {user?.coins || 0}</li>
                      <li><strong>Book Price:</strong> {bookPrice}</li>
                      <li><strong>Has Enough Coins:</strong> {userHasEnoughCoins ? 'Yes' : 'No'}</li>
                      <li><strong>API URL:</strong> {API_ENDPOINTS.BOOKS.DETAILS(id)}</li>
                    </ul>
                    
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => setDebugMode(false)} 
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Hide Debug Info
                      </button>
                      
                      <button
                        onClick={forceCheckPremium}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Force Premium Check
                      </button>
                      
                      <button
                        onClick={() => {
                          // Force refresh API data with cache busting
                          fetchBookDetails(id);
                        }}
                        style={{
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Refresh Book Data
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Debug button */}
                {!debugMode && (
                  <button 
                    onClick={() => setDebugMode(true)}
                    style={{
                      display: 'none', // Hide in production, but keep the ability to activate
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      marginBottom: '10px'
                    }}
                  >
                    Show Debug Info
                  </button>
                )}
                
                {/* Always show premium badge */}
                <div className={styles.premiumLabel}>
                  <FaCrown className={styles.crownIcon} /> Premium Book
                </div>
                
                <div className={styles.premiumInfo}>
                  <div className={styles.premiumPrice}>
                    <FaCoins className={styles.coinIcon} />
                    <span className={styles.priceValue}>{bookPrice}</span> coins
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
                {isLoggedIn && !userHasPurchased && bookPrice > 0 && !purchaseSuccess && (
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
                    
                    {!userHasEnoughCoins && user && (
                      <div className={styles.insufficientCoins}>
                        You need <strong>{bookPrice - Number(user.coins || 0)}</strong> more coins to purchase this book.
                        <Link href="/coins" className={styles.getCoinsLink}>
                          <FaCoins className={styles.coinIcon} /> Get more coins
                        </Link>
                      </div>
                    )}
                  </>
                )}
                
                {/* Success message after purchase - show for both userHasPurchased or purchaseSuccess */}
                {(userHasPurchased === true || purchaseSuccess === true) && (
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
            <p>Are you sure you want to purchase "{book.title}" for {bookPrice} coins?</p>
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