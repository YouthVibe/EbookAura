'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FaDownload, FaEye, FaBook, FaArrowLeft, FaStar, FaCalendarAlt, FaFileAlt, FaLock, FaCrown, FaUser, FaCoins, FaCheck, FaCheckCircle, FaUserPlus } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import BookReview from '../../components/BookReview';
import styles from './book.module.css';
import { API_ENDPOINTS } from '../../utils/config';
import { createDownloadablePdf } from '../../utils/pdfUtils';
import { useAuth } from '../../context/AuthContext';
import { purchaseBook, checkBookPurchase } from '../../api/coins.js';
import { getCurrentSubscription } from '../../api/subscriptions.js';
import { toast } from 'react-toastify';
import { getAPI, postAPI } from '../../api/apiUtils';
import { normalizeMongoDocument } from '../../utils/mongoUtils';

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

// Add a utility function to track API call times
const API_CALL_TRACKER = {};

const shouldMakeApiCall = (apiName, minIntervalMs = 300000) => { // Default: 5 minutes
  const now = Date.now();
  const lastCallTime = API_CALL_TRACKER[apiName] || 0;
  
  if (now - lastCallTime < minIntervalMs) {
    console.log(`Skipping ${apiName} API call, last call was ${(now - lastCallTime) / 1000}s ago (min interval: ${minIntervalMs / 1000}s)`);
    return false;
  }
  
  // Update the tracker with current time
  API_CALL_TRACKER[apiName] = now;
  return true;
};

export default function BookPageClient({ id }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [isSubscriptionChecking, setIsSubscriptionChecking] = useState(false);
  const [subscriptionCheckerActive, setSubscriptionCheckerActive] = useState(false);
  const [premiumError, setPremiumError] = useState(null);
  const router = useRouter();
  const { user, isLoggedIn, getToken, getApiKey, updateUserCoins } = useAuth();
  
  // Refs to help with race conditions
  const prevIsLoggedInRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastRefreshTimeRef = useRef(0); // Track last refresh time
  const subscriptionCheckTimerRef = useRef(null);
  
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
  
  // Computed property to check if user has access from book data
  const bookUserHasAccess = book ? (
    book.userHasAccess === true || 
    book.userHasAccess === 'true' ||
    book.userHasAccess === 1 ||
    String(book.userHasAccess).toLowerCase() === 'true'
  ) : false;
  
  // Use both the state and computed property for determining if user has access
  // Now considering subscription status as well
  const hasUserPurchased = bookUserHasAccess || hasSubscription;
  
  // Check if user can download - only subscribed users can download premium books
  const canDownload = isPremiumBook ? hasSubscription : true;
  
  // User can always view PDFs regardless of premium status or subscription
  const canView = true;
  
  const userHasEnoughCoins = user && book ? (
    Number(user.coins || 0) >= Number(book.price || 0)
  ) : false;
  
  // Get the book price (or default to 25 coins if premium but no price)
  const bookPrice = book ? (
    book.price ? Number(book.price) : (isPremiumBook ? 25 : 0)
  ) : 0;
  
  // Check if user has purchased the book
  const checkPurchaseStatus = useCallback(async () => {
    if (!id) {
      console.log('Cannot check purchase status: Book ID is missing');
      return;
    }
    
    // Skip checks for non-premium books or when user is not logged in
    if (!isPremiumBook) {
      console.log('Skipping purchase check for non-premium book');
      return;
    }
    
    if (!isLoggedIn) {
      console.log('Skipping purchase check - user not logged in');
      return;
    }
    
    // Skip check if subscription already grants access
    if (hasSubscription) {
      console.log('User already has access through subscription, skipping purchase check');
      return;
    }
    
    // Avoid concurrent requests
    if (isFetchingRef.current) {
      console.log('Already fetching data, skipping duplicate purchase check');
      return;
    }
    
    // Check if enough time has passed since last API call (5 minutes minimum)
    if (!shouldMakeApiCall('checkPurchase_' + id, 300000)) {
      return;
    }
    
    // Check if we've recently checked the purchase status (using localStorage)
    try {
      const cachedPurchaseData = localStorage.getItem('purchaseCheckData_' + id);
      if (cachedPurchaseData) {
        const parsedData = JSON.parse(cachedPurchaseData);
        const lastCheckTime = new Date(parsedData.timestamp);
        const now = new Date();
        
        // If we've checked in the last 5 minutes, use the cached result
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        if (lastCheckTime > fiveMinutesAgo) {
          console.log('Using cached purchase data from', lastCheckTime);
          
          if (parsedData.hasPurchased) {
            console.log('Cached data indicates user has purchased this book');
            setBook(prevBook => ({
              ...prevBook,
              userHasAccess: true
            }));
            
            return;
          }
        }
      }
    } catch (cacheError) {
      console.error('Error checking cached purchase data:', cacheError);
    }
    
    console.log(`Checking purchase status for book ID: ${id}`);
    
    try {
      isFetchingRef.current = true;
      
      // First check if the book already has userHasAccess set to true
      if (book && book.userHasAccess === true) {
        console.log('Book already marked as purchased in local state');
        setBook(prevBook => ({
          ...prevBook,
          userHasAccess: true
        }));
        
        return;
      }
      
      // Call the API to verify purchase status
      console.log('Calling API to verify purchase status...');
      const result = await checkBookPurchase(id);
      
      // Cache the result in localStorage with a timestamp
      try {
        localStorage.setItem('purchaseCheckData_' + id, JSON.stringify({
          hasPurchased: result?.success && result?.hasPurchased === true,
          timestamp: new Date().toISOString()
        }));
      } catch (cacheError) {
        console.error('Error caching purchase data:', cacheError);
      }
      
      console.log('Purchase check API response:', result);
      
      if (result && result.success) {
        // Update book with purchase status
        const hasPurchased = result.hasPurchased;
        console.log(`API confirms user ${hasPurchased ? 'has' : 'has not'} purchased this book`);
        
        setBook(prevBook => ({
          ...prevBook,
          userHasAccess: hasPurchased
        }));
        
        if (hasPurchased) {
          setBook(prevBook => ({
            ...prevBook,
            userHasAccess: true
          }));
        }
      } else {
        console.warn('Purchase check API returned success:false or invalid response');
      }
    } catch (err) {
      console.error('Error checking book purchase status:', err);
      
      // If the server is down or there's a network error, check local storage as fallback
      try {
        // As a fallback, we can check if the book ID exists in the user data
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const userData = JSON.parse(userInfo);
          if (userData.purchasedBooks && Array.isArray(userData.purchasedBooks)) {
            const hasPurchased = userData.purchasedBooks.includes(id);
            console.log(`Fallback: Local storage indicates user ${hasPurchased ? 'has' : 'has not'} purchased this book`);
            
            if (hasPurchased) {
              setBook(prevBook => ({
                ...prevBook,
                userHasAccess: true
              }));
            }
          }
        }
      } catch (storageErr) {
        console.error('Error checking local storage for purchase status:', storageErr);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [isLoggedIn, id, isPremiumBook, book, hasSubscription, setBook]);
  
  // Function to check user's subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isLoggedIn) {
      console.log('Skipping subscription check - user not logged in');
      setHasSubscription(false);
      return false;
    }
    
    try {
      console.log('Checking subscription status for premium book access');
      setIsSubscriptionChecking(true);
      
      // Avoid concurrent requests
      if (isFetchingRef.current) {
        console.log('Already fetching data, skipping duplicate subscription check');
        return hasSubscription; // Return current state
      }
      
      // Check if enough time has passed since last API call (1 minute minimum)
      if (!shouldMakeApiCall('checkSubscription', 60000)) {
        return hasSubscription; // Return current state
      }
      
      // Log call time to avoid duplicate calls
      markApiCallTime('checkSubscription');
      
      isFetchingRef.current = true;
      
      // Use the updated subscription API endpoint
      const { getCurrentSubscription } = await import('../../api/subscriptions.js');
      const result = await getCurrentSubscription();
      
      console.log('Subscription check response:', result);
      
      const subscriptionActive = !!(result && result.success && result.active);
      
      // Update subscription state
      setHasSubscription(subscriptionActive);
      
      // Update book access state based on subscription
      if (subscriptionActive) {
        console.log('User has active subscription with access to premium books');
        
        setBook(prevBook => ({
          ...prevBook,
          userHasAccess: true
        }));
        
        // Cache subscription status
        if (typeof window !== 'undefined') {
          localStorage.setItem(`subscription_${id}`, JSON.stringify({
            hasSubscription: true,
            timestamp: new Date().getTime()
          }));
        }
      } else {
        console.log('User does not have an active subscription with premium access');
        
        // Only update book access if it's not already set by other means (e.g., direct purchase)
        if (!bookUserHasAccess) {
          setBook(prevBook => ({
            ...prevBook,
            userHasAccess: false
          }));
        }
        
        // Cache subscription status
        if (typeof window !== 'undefined') {
          localStorage.setItem(`subscription_${id}`, JSON.stringify({
            hasSubscription: false,
            timestamp: new Date().getTime()
          }));
        }
      }
      
      return subscriptionActive;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setHasSubscription(false);
      return false;
    } finally {
      setIsSubscriptionChecking(false);
      isFetchingRef.current = false;
    }
  }, [isLoggedIn, id, bookUserHasAccess]);
  
  // Function to check subscription status with API key
  const checkSubscriptionWithApiKey = useCallback(async (apiKey) => {
    if (!apiKey) {
      console.error('No API key provided for subscription check');
      return false;
    }

    try {
      console.log('Checking subscription status using API key');
      setIsSubscriptionChecking(true);
      
      // Avoid concurrent requests
      if (isFetchingRef.current) {
        console.log('Already fetching data, skipping duplicate API key subscription check');
        return hasSubscription;
      }
      
      isFetchingRef.current = true;
      
      // Import the API key subscription check utility
      const { checkSubscriptionWithApiKey } = await import('../../api/subscriptions.js');
      const result = await checkSubscriptionWithApiKey(apiKey);
      
      console.log('API key subscription check response:', result);
      
      const subscriptionActive = !!(result && result.success && result.active);
      
      // Update subscription state if the API key check is successful
      if (subscriptionActive) {
        console.log('API key has access to premium content through active subscription');
        setHasSubscription(true);
        
        // Update book access state based on subscription
        setBook(prevBook => ({
          ...prevBook,
          userHasAccess: true
        }));
        
        return true;
      } else {
        console.log('API key does not have an active subscription with premium access');
        return false;
      }
    } catch (error) {
      console.error('Error checking subscription status with API key:', error);
      return false;
    } finally {
      setIsSubscriptionChecking(false);
      isFetchingRef.current = false;
    }
  }, [id]);
  
  // Set up subscription checker with 5-minute interval (significantly slower than before)
  useEffect(() => {
    // Initial check when component mounts or when login/premium status changes
    if (isLoggedIn && isPremiumBook && !subscriptionCheckerActive) {
      // Skip if user already has purchased the book
      if (bookUserHasAccess) {
        console.log('User already has access through purchase, not setting up subscription checker');
        return;
      }
      
      console.log('Starting subscription checker...');
      
      // Check if we need to run the initial check by checking localStorage cache
      let skipInitialCheck = false;
      try {
        const cachedSubscriptionData = localStorage.getItem('subscriptionCheckData');
        if (cachedSubscriptionData) {
          const parsedData = JSON.parse(cachedSubscriptionData);
          const lastCheckTime = new Date(parsedData.timestamp);
          const now = new Date();
          
          // If we've checked in the last 5 minutes, use the cached result
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          if (lastCheckTime > fiveMinutesAgo) {
            console.log('Using cached subscription data for initial check');
            skipInitialCheck = true;
            
            if (parsedData.hasSubscription) {
              setHasSubscription(true);
              
              // Update book state to reflect access
              setBook(prevBook => ({
                ...prevBook,
                userHasAccess: true
              }));
            }
          }
        }
      } catch (cacheError) {
        console.error('Error checking cached subscription data:', cacheError);
      }
      
      // Only run the initial check if we don't have recent cached data
      if (!skipInitialCheck) {
        checkSubscriptionStatus();
      }
      
      // We only need one check, so we won't set up an interval anymore
      // This one check is sufficient and the cached data will be used
      // on subsequent page views within 5 minutes
      
      // Marking subscription checker as active but we won't actually 
      // set up a timer, avoiding unnecessary API calls
      setSubscriptionCheckerActive(true);
    }
    
    // Clean up if needed
    return () => {
      if (subscriptionCheckTimerRef.current) {
        console.log('Clearing subscription checker...');
        clearInterval(subscriptionCheckTimerRef.current);
        subscriptionCheckTimerRef.current = null;
        setSubscriptionCheckerActive(false);
      }
    };
  }, [isLoggedIn, isPremiumBook, checkSubscriptionStatus, subscriptionCheckerActive, bookUserHasAccess]);
  
  // Check purchase status when auth state changes or after purchase
  useEffect(() => {
    if (isLoggedIn && id && isPremiumBook) {
      checkPurchaseStatus();
    }
  }, [isLoggedIn, id, isPremiumBook, checkPurchaseStatus]);
  
  // Check subscription status when user logs in
  useEffect(() => {
    if (isLoggedIn && !prevIsLoggedInRef.current) {
      console.log('User just logged in - checking subscription status');
      checkSubscriptionStatus();
    }
    
    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn, checkSubscriptionStatus]);

  // Also check subscription status when the component mounts
  useEffect(() => {
    if (isLoggedIn) {
      checkSubscriptionStatus();
    }
  }, [isLoggedIn, checkSubscriptionStatus]);
  
  // Function to fetch book details
  const fetchBookDetails = useCallback(async (bookId) => {
    if (!bookId) {
      return;
    }

    console.log(`Fetching book details for book ID ${bookId}`);
    
    // Check if enough time has passed since last API call (30 seconds minimum for book details)
    if (!shouldMakeApiCall('fetchBook_' + bookId, 30000)) {
      // Even if we don't fetch, we should check purchase/subscription status
      // Run these after a short delay to avoid component re-render issues
      setTimeout(() => {
        checkPurchaseStatus();
        checkSubscriptionStatus();
      }, 100);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = isLoggedIn ? await getToken() : null;
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/books/${bookId}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch book: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Book data received:', data);
      
      // Normalize the data to ensure consistent structure
      const normalizedData = normalizeMongoDocument(data);
      
      setBook(normalizedData);
      
      // Check if the book is premium and if the user already has access
      const isPremium = normalizedData.isPremium || (normalizedData.price && normalizedData.price > 0);
      const userHasAccess = normalizedData.userHasAccess;
      
      // Coordinate purchase and subscription checks
      if (isLoggedIn && isPremium) {
        console.log('Book is premium and user is logged in, checking access rights');
        
        let accessVerified = false;
        
        // First check if the book response already indicates access
        if (normalizedData.userHasAccess === true) {
          console.log('API response indicates user already has access');
          accessVerified = true;
        }
        
        if (!accessVerified) {
          // Check purchase status first
          try {
            await checkPurchaseStatus();
            
            // If purchase check granted access, we can skip subscription check
            if (hasUserPurchased) {
              console.log('Purchase check confirmed access');
              accessVerified = true;
            }
          } catch (purchaseError) {
            console.error('Error in purchase check:', purchaseError);
          }
        }
        
        // If still no access, check subscription
        if (!accessVerified) {
          try {
            console.log('Checking subscription status for premium content');
            await checkSubscriptionStatus();
            
            // After subscription check, update access flag if we got access
            if (hasSubscription) {
              console.log('Subscription check confirmed access');
              accessVerified = true;
            }
          } catch (subscriptionError) {
            console.error('Error in subscription check:', subscriptionError);
          }
        }
        
        // Final update of book access state based on all checks
        if (accessVerified) {
          console.log('Access verified through any method, updating book state');
          setBook(prevBook => ({
            ...prevBook,
            userHasAccess: true
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      setError('Failed to load book details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, getToken, checkPurchaseStatus, checkSubscriptionStatus, hasUserPurchased, bookUserHasAccess]);

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
      
      // Check if we have an API key in the URL params (for external applications)
      const urlParams = new URLSearchParams(window.location.search);
      const apiKeyParam = urlParams.get('apiKey');
      
      if (book.isPremium) {
        let subscriptionVerified = false;

        // First check if user already has verified access through the component state
        if (hasSubscription || hasUserPurchased) {
          console.log('User has already verified subscription or purchase');
          subscriptionVerified = true;
        }
        
        // If a URL API key is provided, verify subscription with it
        if (apiKeyParam && !subscriptionVerified) {
          console.log('API key provided in URL, checking subscription status');
          
          try {
            const hasActiveSubscription = await checkSubscriptionWithApiKey(apiKeyParam);
            if (hasActiveSubscription) {
              subscriptionVerified = true;
              console.log('Subscription verified with API key from URL');
            }
          } catch (apiKeyError) {
            console.error('Error verifying subscription with API key:', apiKeyError);
          }
        }
        
        // If no URL API key or verification failed, try with authentication token
        if (!subscriptionVerified) {
          const token = getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Using auth token for PDF access');
          }
        }
        
        // Add API key to headers if provided in URL or available from auth context
        if (apiKeyParam) {
          headers['X-API-Key'] = apiKeyParam;
          console.log('Using API key from URL parameter');
        } else {
          const storedApiKey = getApiKey();
          if (storedApiKey) {
            headers['X-API-Key'] = storedApiKey;
            console.log('Using stored API key');
          }
        }
      }
      
      // Fetch the PDF data from our proxy endpoint
      const proxyUrl = `${API_ENDPOINTS.BOOKS.PDF_CONTENT(id)}?counted=true`;
      const response = await fetch(proxyUrl, { headers });
      
      if (!response.ok) {
        // Handle premium authentication error
        if (response.status === 401 || response.status === 403) {
          let errorMessage = 'Access denied.';
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
            if (errorData.isPremium) {
              setPremiumError('This is premium content. Please log in to access it.');
            }
          } catch (e) {
            // If we can't parse the error JSON, use a generic message
          }
          throw new Error(`Access denied: ${errorMessage}`);
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
          console.log(`Fallback: Using direct PDF URL: ${book.pdfUrl}`);
          setPdfUrl(book.pdfUrl);
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
    // Allow view for everyone regardless of premium status
    fetchPdfForViewing();
  };

  const handleDownload = async () => {
    if (!book || !id) {
      console.error('Cannot download: Book data or ID is missing');
      return;
    }
    
    // Check for premium content - only allow download with subscription
    if (isPremiumBook) {
      // Check if the request has an API key in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const apiKeyParam = urlParams.get('apiKey');
      
      let hasAccess = false;
      
      // Check if the user already has verified access through subscription or purchase
      if (hasSubscription || hasUserPurchased) {
        hasAccess = true;
        console.log('User has subscription or has purchased the book, allowing download');
      }
      
      // If no access yet and API key is provided, check subscription with API key
      if (!hasAccess && apiKeyParam) {
        try {
          const hasActiveSubscription = await checkSubscriptionWithApiKey(apiKeyParam);
          if (hasActiveSubscription) {
            hasAccess = true;
            console.log('API key has valid subscription, allowing download');
          }
        } catch (apiKeyError) {
          console.error('Error verifying subscription with API key:', apiKeyError);
        }
      }
      
      // If still no access, block download
      if (!hasAccess) {
        if (!isLoggedIn) {
          setPremiumError('You need to log in and subscribe to download this premium book.');
          router.push('/login');
          return;
        } else {
          setPremiumError('You need an active subscription to download this premium book.');
          toast.error('Subscription required to download premium books', {
            position: "top-center",
            autoClose: 3000
          });
          return;
        }
      }
    }
      
    try {
      setViewing(true);
      console.log('Downloading book with ID:', id);
      
      // For premium content, add authentication headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Check for API key in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const apiKeyParam = urlParams.get('apiKey');
      
      if (book.isPremium) {
        // Add API key to headers if provided in URL or available from auth context
        if (apiKeyParam) {
          headers['X-API-Key'] = apiKeyParam;
          console.log('Using API key from URL parameter for download');
        } else {
          const token = getToken();
          const storedApiKey = getApiKey();
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Using auth token for PDF download');
          }
          
          if (storedApiKey) {
            headers['X-API-Key'] = storedApiKey;
            console.log('Using stored API key for download');
          }
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
          if (response.status === 401 || response.status === 403) {
            const errorData = await response.json();
            if (errorData.isPremium && errorData.requiresSubscription) {
              setPremiumError(errorData.message || 'You need an active subscription to download this premium book.');
              
              // Show a toast notification
              toast.error('Subscription required for download', {
                position: "top-center",
                autoClose: 3000
              });
              
              // If user isn't logged in, redirect to login page
              if (!isLoggedIn) {
                setTimeout(() => router.push('/login'), 1500);
              }
              
              throw new Error('Premium content requires subscription for downloads');
            } else if (errorData.isPremium) {
              setPremiumError(errorData.message || 'This is premium content. Please log in to access it.');
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
        
        // Show success toast
        toast.success('Download successful!', {
          position: "top-center",
          autoClose: 2000
        });
      } catch (directDownloadError) {
        console.warn('Direct download failed, using fallback:', directDownloadError);
        
        // Show notification about the error but trying fallback
        toast.info('Trying alternative download method...', {
          position: "top-center",
          autoClose: 2000
        });
        
        // Check if this was a subscription error before falling back
        if (directDownloadError.message.includes('subscription')) {
          return; // Don't proceed with fallback for subscription errors
        }
        
        // Fallback to original backend endpoint if proxy fails - public access, no authentication needed
        try {
          const fallbackUrl = `${API_ENDPOINTS.BOOKS.PDF(id)}?download=true&counted=true`;
          window.open(fallbackUrl, '_blank');
        } catch (fallbackError) {
          console.error('Fallback download also failed:', fallbackError);
          toast.error('Download failed. Please try again later.', {
            position: "top-center",
            autoClose: 3000
          });
        }
      }
      
      // Update local state to show download count increased
      setBook(prevBook => ({
        ...prevBook,
        downloads: (prevBook.downloads || 0) + 1
      }));
    } catch (err) {
      console.error('Error downloading book:', err);
      
      // If this is a premium subscription error, don't show a generic error
      if (!err.message.includes('subscription') && !err.message.includes('Premium content')) {
        toast.error('Download failed. Please try again later.', {
          position: "top-center",
          autoClose: 3000
        });
      }
    } finally {
      setViewing(false);
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
          // Still try to open the URL directly as a fallback
          window.open(customUrl, '_blank');
        });
      } catch (err) {
        console.error('Error opening custom URL:', err);
        // Still try to open the URL directly as a fallback
        window.open(customUrl, '_blank');
      }
    } catch (err) {
      console.error('Error opening custom URL:', err);
      alert('Failed to open the PDF. Please try again or contact support if the problem persists.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to refresh the user's coin balance
  const refreshUserCoins = useCallback(async () => {
    if (!isLoggedIn || !user) {
      console.log('Cannot refresh coins: User not logged in');
      return;
    }
    
    // Check if we've refreshed recently (within the last 5 seconds)
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    if (timeSinceLastRefresh < 5000) {
      console.log(`Skipping coin refresh - last refresh was ${timeSinceLastRefresh}ms ago (< 5000ms)`);
      return;
    }
    
    // Update the last refresh time
    lastRefreshTimeRef.current = now;
    console.log('Refreshing user coin balance...');
    
    try {
      const { getUserCoins } = await import('../../api/coins.js');
      const coinsData = await getUserCoins();
      
      if (coinsData && typeof coinsData.coins === 'number') {
        console.log(`Updating user coins from ${user.coins} to ${coinsData.coins}`);
        updateUserCoins(coinsData.coins);
      }
    } catch (err) {
      console.error('Error refreshing coin balance:', err);
    }
  }, [isLoggedIn, user, updateUserCoins]);
  
  // Refresh coin balance when component mounts or when user logs in
  useEffect(() => {
    if (isLoggedIn && isPremiumBook) {
      console.log('Component mounted or premium status changed - refreshing coin balance');
      refreshUserCoins();
    }
  }, [isLoggedIn, isPremiumBook, refreshUserCoins]);

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
      
      // If user just logged in, refresh their coin balance
      if (isLoggedIn && !prevIsLoggedInRef.current) {
        console.log('User just logged in - refreshing coin balance');
        refreshUserCoins();
      }
    }

    // Track previous auth state for future comparison
    prevIsLoggedInRef.current = isLoggedIn;

    if (shouldFetch) {
      // Use a setTimeout to ensure this executes after any auth token checks complete
      setTimeout(() => fetchBookDetails(id), 50);
    }
  }, [id, isLoggedIn, user, refreshUserCoins]);

  // Clean up PDF blob URL when component unmounts or when PDF viewer is closed
  useEffect(() => {
    return () => {
      // Only clean up if pdfUrl is a string that starts with 'blob:'
      if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Initial component mount check for cached data and auth state
  useEffect(() => {
    if (isLoggedIn && isPremiumBook) {
      console.log('Component mounted - checking cached data and auth state');
      
      // First, try to retrieve relevant data from cache
      try {
        // First check localStorage for cached subscription data
        const cachedSubscriptionData = localStorage.getItem('subscriptionCheckData');
        if (cachedSubscriptionData) {
          try {
            const parsedData = JSON.parse(cachedSubscriptionData);
            const lastCheckTime = new Date(parsedData.timestamp);
            const now = new Date();
            
            // Use cached data if less than 1 minute old
            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
            if (lastCheckTime > oneMinuteAgo && parsedData.hasSubscription) {
              console.log('Using fresh cached subscription data on initial mount');
              setHasSubscription(true);
              
              setBook(prevBook => ({
                ...prevBook,
                userHasAccess: true
              }));
              
              // Still continue with the fresh API call in the background to verify
            } else {
              console.log('Cached subscription data is not fresh enough or inactive');
            }
          } catch (e) {
            console.error('Error parsing cached subscription data:', e);
          }
        }
        
        // Also check for cached purchase data for this specific book
        const cachedPurchaseData = localStorage.getItem('purchaseCheckData_' + id);
        if (cachedPurchaseData) {
          try {
            const parsedData = JSON.parse(cachedPurchaseData);
            if (parsedData.hasPurchased) {
              console.log('Using cached purchase data on initial mount');
              setBook(prevBook => ({
                ...prevBook,
                userHasAccess: true
              }));
            }
          } catch (e) {
            console.error('Error parsing cached purchase data:', e);
          }
        }
      } catch (err) {
        console.error('Error checking cached data on mount:', err);
      }
      
      // Always run a fresh subscription check on component mount
      // Using a slight delay to allow state initialization and avoid overwrites
      setTimeout(() => {
        checkSubscriptionStatus();
      }, 300);
    }
  }, [isLoggedIn, isPremiumBook, id, checkSubscriptionStatus]);

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
            onClick={() => setDebugMode(true)}
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
          onClick={() => setDebugMode(true)}
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
            
            {/* Display premium info for premium books */}
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
                      <li><strong>Has Subscription:</strong> {hasSubscription ? 'Yes' : 'No'}</li>
                      <li><strong>Is Logged In:</strong> {isLoggedIn ? 'Yes' : 'No'}</li>
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
                        onClick={() => {
                          // Force refresh API data with cache busting
                          fetchBookDetails(id);
                        }}
                        style={{
                          background: '#28a745',
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
                
                {/* Subscription access message for logged in users with active subscription */}
                {isLoggedIn && hasSubscription && (
                  <div className={styles.subscriptionAccess}>
                    <FaCheckCircle className={styles.checkIcon} />
                    <div>
                      <div className={styles.accessTitle}>Premium Access</div>
                      <div className={styles.accessText}>You have access to this book through your active subscription.</div>
                    </div>
                  </div>
                )}
                {console.log('hasSubscription', hasSubscription)}
                {/* Subscription required message for logged in users without subscription */}
                {isLoggedIn && !hasSubscription && (
                  <div className={styles.subscriptionRequired}>
                    <div className={styles.subscriptionMessage}>
                      <FaCrown className={styles.crownIcon} />
                      <div>
                        <div className={styles.subscriptionTitle}>Subscription Required</div>
                        <div className={styles.subscriptionText}>
                          This premium book is only available to subscribers. Subscribe to access all premium books.
                        </div>
                      </div>
                    </div>
                    
                    <Link href="/plans" className={styles.subscribeButton}>
                      <FaCrown className={styles.buttonCrownIcon} />
                      Subscribe Now
                    </Link>
                  </div>
                )}
                
                {/* Message for non-logged in users */}
                {!isLoggedIn && (
                  <div className={styles.loginRequired}>
                    <div className={styles.loginMessage}>
                      This premium book requires a subscription. Please log in to access with your subscription or to subscribe.
                    </div>
                    <div className={styles.loginButtons}>
                      <Link href="/login" className={styles.loginButton}>
                        <FaUser className={styles.userIcon} /> Log In
                      </Link>
                      <Link href="/signup" className={styles.signupButton}>
                        <FaUserPlus className={styles.userPlusIcon} /> Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <button 
                onClick={handleViewPdf} 
                className={`${styles.viewButton}`}
                disabled={viewing}
              >
                <FaFileAlt /> {viewing ? 'Opening...' : 'View PDF'}
              </button>
                
              <button 
                onClick={handleDownload} 
                className={`${styles.downloadButton} ${(!canDownload) ? styles.disabledButton : ''}`}
                disabled={viewing || !canDownload}
              >
                <FaDownload /> {viewing ? 'Downloading...' : 'Download PDF'}
              </button>
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

      {/* Add subscription banner when debug mode is on */}
      {isLoggedIn && debugMode && (
        <div className={styles.debugSection} style={{ margin: '10px 0', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
          <strong>Debug Info:</strong>
          <div>Premium Book: {isPremiumBook ? 'Yes' : 'No'}</div>
          <div>Price: {bookPrice} coins</div>
          <div>User Purchased: {hasUserPurchased ? 'Yes' : 'No'}</div>
          <div>Has Subscription: {hasSubscription ? 'Yes' : 'No'}</div>
          <div>Has Access: {hasUserPurchased ? 'Yes' : 'No'}</div>
        </div>
      )}
      
      {/* Add subscription notification if relevant */}
      {isLoggedIn && isPremiumBook && hasSubscription && (
        <div className={`${styles.subscriptionNotice} ${styles.accessNotice}`} style={{ 
          margin: '10px 0', 
          padding: '15px', 
          background: '#e9f7ff', 
          borderRadius: '8px',
          border: '1px solid #4c9aff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          fontWeight: '500'
        }}>
          <FaCrown style={{ color: '#ffd700', fontSize: '24px' }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Premium Access</div>
            <span>You have access to this book through your active subscription. Enjoy reading!</span>
          </div>
        </div>
      )}

      {/* Add status indicator for debugging if enabled */}
      {debugMode && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div><strong>API Status:</strong> {isFetchingRef.current ? '🔄 Fetching...' : '✅ Idle'}</div>
          <div><strong>Book Premium:</strong> {isPremiumBook ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Access:</strong> {hasUserPurchased ? '✅ Yes' : '❌ No'}</div>
          {hasUserPurchased && (
            <div><strong>Access Type:</strong> {hasSubscription ? '🔑 Subscription' : '💰 Purchased'}</div>
          )}
          <div><strong>Subscription Check:</strong> {isSubscriptionChecking ? '🔄 Active' : '⏹️ Inactive'}</div>
        </div>
      )}

      {/* Premium book subscription message for download */}
      {isPremiumBook && !hasSubscription && (
        <div className={styles.subscriptionNotice} style={{ 
          margin: '10px 0', 
          padding: '15px', 
          background: '#fff6e6', 
          borderRadius: '8px',
          border: '1px solid #ffe0b2',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          fontWeight: '500'
        }}>
          <FaDownload style={{ color: '#e65100', fontSize: '24px' }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Download Requires Subscription</div>
            <span>You can view this premium PDF, but you need an active subscription to download it. {!isLoggedIn && 'Please log in and subscribe to download.'}
            {isLoggedIn && (
              <Link href="/plans" style={{ color: '#0070f3', fontWeight: 'bold', marginLeft: '6px' }}>
                Subscribe Now
              </Link>
            )}
            </span>
          </div>
        </div>
      )}

      {/* Add subscription notification if user has subscription */}
      {isLoggedIn && isPremiumBook && hasSubscription && (
        <div className={`${styles.subscriptionNotice} ${styles.accessNotice}`} style={{ 
          margin: '10px 0', 
          padding: '15px', 
          background: '#e9f7ff', 
          borderRadius: '8px',
          border: '1px solid #4c9aff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          fontWeight: '500'
        }}>
          <FaCrown style={{ color: '#ffd700', fontSize: '24px' }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Premium Access</div>
            <span>You have full access to this premium book through your active subscription. You can view and download.</span>
          </div>
        </div>
      )}
    </div>
  );
} 