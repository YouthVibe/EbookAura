'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaSort, FaEye, FaDownload, FaBook, FaStar, FaRegStar, FaBookmark, FaRegBookmark, FaStarHalfAlt, FaFileAlt, FaFile, FaChevronLeft, FaChevronRight, FaLock, FaCrown, FaCoins } from 'react-icons/fa';
import Link from 'next/link';
import styles from './search.module.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import SearchInput from '../components/SearchInput';
import { getAPI, postAPI } from '../api/apiUtils';

// Add a simple toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${type === 'success' ? styles.toastSuccess : styles.toastError}`}>
      <span>{message}</span>
      <button onClick={onClose} className={styles.toastClose}>×</button>
    </div>
  );
};

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' }
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookmarkedBooks, setBookmarkedBooks] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const router = useRouter();
  const { getToken, getApiKey } = useAuth();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const observer = useRef();
  const lastBookElementRef = useRef(null);

  // Add function to show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Add function to hide toast
  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAPI('/books/categories');
        
        // Check if data.categories exists and is an array
        if (data && data.categories && Array.isArray(data.categories)) {
          setCategories(['All', ...data.categories]);
        } else if (data && Array.isArray(data)) {
          // If data is directly an array
          setCategories(['All', ...data]);
        } else if (data && typeof data === 'object') {
          // If categories might be in another format
          const extractedCategories = [];
          
          // If it's an object with category keys
          if (Object.keys(data).length > 0) {
            Object.keys(data).forEach(key => {
              if (Array.isArray(data[key])) {
                extractedCategories.push(...data[key]);
              } else if (typeof data[key] === 'string') {
                extractedCategories.push(data[key]);
              }
            });
          }
          
          if (extractedCategories.length > 0) {
            setCategories(['All', ...extractedCategories]);
          } else {
            // Fallback to default categories if extraction fails
            setCategories(['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Technology']);
          }
        } else {
          // Fallback to default categories if data format is unexpected
          setCategories(['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Technology']);
        }
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
        // Fallback to default categories on error
        setCategories(['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Technology']);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        if (!token) {
          console.log('No authentication token found, user is not logged in');
          setIsLoggedIn(false);
          return;
        }

        try {
          const data = await getAPI('/auth/check', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (data && typeof data.isAuthenticated === 'boolean') {
            setIsLoggedIn(data.isAuthenticated);
            console.log('Auth check successful, user is', data.isAuthenticated ? 'authenticated' : 'not authenticated');
            
            if (data.isAuthenticated) {
              // Fetch user's bookmarks
              fetchUserBookmarks();
            }
          } else {
            console.warn('Unexpected auth check response format:', data);
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error('Auth check API error:', error.message);
          setIsLoggedIn(false);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
        localStorage.removeItem('token');
      }
    };

    checkAuth();
  }, [getToken]);

  const fetchUserBookmarks = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('No token available for fetching bookmarks');
        return;
      }
      
      console.log('Fetching user bookmarks...');
      const data = await getAPI('/users/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': getApiKey()
        }
      });
      
      // Handle different possible response formats
      let bookmarkIds = [];
      
      if (data && data.bookmarks && Array.isArray(data.bookmarks)) {
        console.log('Received bookmarks array from API');
        bookmarkIds = data.bookmarks;
      } else if (data && data.books && Array.isArray(data.books)) {
        console.log('Received books array from API');
        bookmarkIds = data.books.map(book => book._id);
      } else if (data && Array.isArray(data)) {
        console.log('Received direct array from API');
        // If data is directly an array of IDs or book objects
        bookmarkIds = data.map(item => item._id || item);
      } else {
        console.warn('Unexpected bookmark data format:', data);
      }
      
      console.log(`Found ${bookmarkIds.length} bookmarks`);
      setBookmarkedBooks(new Set(bookmarkIds));
    } catch (error) {
      console.error('Error fetching bookmarks:', error.message);
    }
  };

  const handleBookmark = async (bookId) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    // Find the book title for better toast messages
    const book = books.find(b => b._id === bookId);
    const bookTitle = book ? book.title : 'Book';

    // Optimistically update UI
    const newBookmarkedBooks = new Set(bookmarkedBooks);
    const wasBookmarked = bookmarkedBooks.has(bookId);
    
    if (wasBookmarked) {
      newBookmarkedBooks.delete(bookId);
    } else {
      newBookmarkedBooks.add(bookId);
    }
    setBookmarkedBooks(newBookmarkedBooks);
    
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      await postAPI('/users/bookmarks', { bookId }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': getApiKey()
        }
      });

      // Show success toast
      showToast(wasBookmarked 
        ? `Removed "${bookTitle}" from bookmarks` 
        : `Added "${bookTitle}" to bookmarks`, 'success');
    } catch (error) {
      // Revert changes on error
      if (wasBookmarked) {
        newBookmarkedBooks.add(bookId);
      } else {
        newBookmarkedBooks.delete(bookId);
      }
      setBookmarkedBooks(newBookmarkedBooks);
      
      // Provide more detailed error messaging
      let errorMessage = 'Error updating bookmark';
      
      if (error.message) {
        console.error('Bookmark error details:', error.message);
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          errorMessage = 'Authentication error. Please log in again.';
          // Redirect to login on auth errors
          setTimeout(() => router.push('/login'), 2000);
        }
      }
      
      console.error('Error toggling bookmark:', error);
      showToast(errorMessage, 'error');
    }
  };

  const fetchBooks = async (currentPage = 1, shouldReplaceResults = true) => {
    try {
      console.log(`Fetching books: page ${currentPage}, category: "${selectedCategory}", sort: ${sortBy}, query: "${searchQuery}", premium: ${showPremiumOnly}`);
      setLoadingMore(currentPage > 1);
      if (currentPage === 1) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 12);
      params.append('sort', sortBy);
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      // Add premium filter parameter
      if (showPremiumOnly) {
        params.append('premium', 'true');
      }

      const queryString = params.toString();
      const data = await getAPI(`/books?${queryString}`);
      
      let booksData = [];
      let totalCount = 0;
      
      if (Array.isArray(data)) {
        // Handle case where API returns an array directly
        booksData = data;
        totalCount = data.length;
      } else if (data && data.books && Array.isArray(data.books)) {
        // Handle case where API returns { books: [...], totalCount: X }
        booksData = data.books;
        totalCount = data.totalCount || data.pagination?.totalBooks || data.books.length;
      } else {
        throw new Error('Unexpected response format from API');
      }
      
      // Ensure each book has an isPremium property, default to false if not present
      booksData = booksData.map(book => {
        const isPremium = book.isPremium === true; // Force boolean conversion
        console.log(`Processing book: ${book.title}, isPremium before: ${book.isPremium}, after: ${isPremium}`);
        return {
          ...book,
          isPremium // Convert undefined/null to false, keep true as true
        };
      });
      
      // Log premium books count
      const premiumBooksCount = booksData.filter(book => book.isPremium === true).length;
      console.log(`Fetched ${booksData.length} books (total: ${totalCount}), ${premiumBooksCount} premium books`);
      
      // If in premium mode, but no premium books found, log warning
      if (showPremiumOnly && premiumBooksCount === 0) {
        console.warn('Premium filter is on but no premium books were found');
      }
      
      setTotalBooks(totalCount);
      setHasMore(booksData.length > 0 && booksData.length >= 12);
      
      if (shouldReplaceResults) {
        setBooks(booksData);
      } else {
        // Filter out duplicates when adding more books
        const existingIds = new Set(books.map(book => book._id));
        const uniqueNewBooks = booksData.filter(book => !existingIds.has(book._id));
        setBooks(prev => [...prev, ...uniqueNewBooks]);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Callback for infinite scrolling using Intersection Observer
  const lastBookRef = useCallback(node => {
    if (loading || loadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Reset pagination when search parameters change
  useEffect(() => {
    setPage(1);
    setBooks([]);
    setHasMore(true);
    fetchBooks(1, true);
  }, [searchQuery, selectedCategory, sortBy]);

  // Load more books when page changes
  useEffect(() => {
    if (page > 1) {
      fetchBooks(page, false);
    }
  }, [page]);

  // Restart search when premium filter changes
  useEffect(() => {
    if (!loading) {
      setPage(1);
      fetchBooks(1, true);
    }
  }, [showPremiumOnly]);

  // Handle viewing a PDF
  const handleViewPdf = (bookId) => {
    window.open(`/api/books/${bookId}/pdf`, '_blank');
  };

  // Handle downloading a PDF
  const handleDownloadPdf = (bookId) => {
    window.open(`/api/books/${bookId}/pdf?download=true`, '_blank');
  };

  const renderRatingStars = (rating) => {
    // Handle case when rating is undefined or 0
    if (!rating || rating <= 0) {
      return (
        <div className={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map(i => (
            <FaRegStar key={i} className={styles.emptyStar} />
          ))}
          <span className={styles.ratingValue}>(0.0)</span>
        </div>
      );
    }
    
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(roundedRating)) {
        stars.push(<FaStar key={i} className={styles.star} />);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<FaStarHalfAlt key={i} className={styles.star} />);
      } else {
        stars.push(<FaRegStar key={i} className={styles.emptyStar} />);
      }
    }
    
    return (
      <div className={styles.ratingStars}>
        {stars}
        <span className={styles.ratingValue}>({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <div className={styles.searchSection}>
        <SearchInput
          placeholder="Search for books by title, author or description..."
          onSearch={setSearchQuery}
          initialValue={searchQuery}
          debounceTime={500}
          className={styles.searchBar}
        />

        <div className={styles.categories}>
          <button
            className={`${styles.categoryButton} ${selectedCategory === '' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className={styles.filterOptions}>
          <div className={styles.premiumFilter}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showPremiumOnly}
                onChange={() => setShowPremiumOnly(!showPremiumOnly)}
                className={styles.toggleCheckbox}
              />
              <span className={styles.toggleSwitch}></span>
              <span className={styles.toggleText}>Premium Books{showPremiumOnly ? '' : ' Only'}</span>
            </label>
          </div>

          <div className={styles.sortSection}>
            <FaSort className={styles.sortIcon} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error && books.length === 0 ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          {showPremiumOnly && (
            <div className={styles.premiumSectionHeader}>
              <FaCrown className={styles.premiumHeaderIcon} />
              <h2>Premium Collection</h2>
              <p>Exclusive content for our authenticated members</p>
            </div>
          )}
          
          <div className={styles.resultsCount}>
            Found {totalBooks > 0 ? totalBooks : books.length} {totalBooks === 1 ? 'book' : 'books'}
            {showPremiumOnly && ' (Premium Only)'}
          </div>
          <div className={styles.bookGrid}>
            {books.map((book, index) => {
              // Debug premium book status
              console.log(`Book: ${book.title}, isPremium: ${book.isPremium}`, book);
              
              return (
                <div 
                  key={book._id} 
                  className={`${styles.bookCard} ${book.isPremium ? styles.premiumBook : ''}`}
                  ref={index === books.length - 1 ? lastBookRef : null}
                >
                  <Link href={`/books/${book._id}`} className={styles.bookLink}>
                    <div className={styles.bookCover}>
                      {book.coverImage ? (
                        <div className={styles.coverImageContainer}>
                          <img 
                            src={book.coverImage} 
                            alt={book.title} 
                            className={styles.coverImage}
                            loading="lazy"
                          />
                          {book.isPremium && book.price > 0 && (
                            <div className={styles.premiumPrice}>
                              {book.price} <FaCoins className={styles.miniCoin} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.placeholderCover}>
                          <FaBook className={styles.bookIcon} />
                          {book.isPremium && book.price > 0 && (
                            <div className={styles.premiumPrice}>
                              {book.price} <FaCoins className={styles.miniCoin} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={styles.bookInfo}>
                      <h3 className={styles.bookTitle}>{book.title}</h3>
                      <p className={styles.bookAuthor}>by {book.author}</p>
                      {renderRatingStars(book.averageRating)}
                      <div className={styles.categoryInfo}>
                        <p className={styles.bookCategory}>{book.category}</p>
                        {book.isPremium && (
                          <span className={styles.bookPremiumTag}>
                            <FaCrown className={styles.premiumIcon} /> Premium
                          </span>
                        )}
                      </div>
                      <div className={styles.bookStats}>
                        <span className={styles.stat}>
                          <FaEye /> {book.views || 0}
                        </span>
                        <span className={styles.stat}>
                          <FaDownload /> {book.downloads || 0}
                        </span>
                        {book.pageSize > 0 && (
                          <span className={styles.stat}>
                            <FaFileAlt /> {book.pageSize}p
                          </span>
                        )}
                        {book.fileSizeMB > 0 && (
                          <span className={styles.stat}>
                            <FaFile /> {book.fileSizeMB}MB
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  <button 
                    className={styles.inlineBookmarkButton}
                    onClick={(e) => {
                      e.preventDefault();
                      handleBookmark(book._id);
                    }}
                    title={bookmarkedBooks.has(book._id) ? "Remove from bookmarks" : "Add to bookmarks"}
                  >
                    {bookmarkedBooks.has(book._id) ? (
                      <>
                        <FaBookmark /> Bookmarked
                      </>
                    ) : (
                      <>
                        <FaRegBookmark /> Bookmark
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          
          {books.length === 0 && (
            <div className={styles.noResults}>
              No books found. Try adjusting your search criteria.
            </div>
          )}
          
          {loadingMore && (
            <div className={styles.loadingMore}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading more books...</p>
            </div>
          )}
          
          {!hasMore && books.length > 0 && (
            <div className={styles.endOfResults}>
              You've reached the end of the results.
            </div>
          )}
        </>
      )}
    </div>
  );
} 