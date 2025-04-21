'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaSort, FaEye, FaDownload, FaBook, FaStar, FaRegStar, FaBookmark, FaRegBookmark, FaStarHalfAlt, FaFileAlt, FaFile, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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

  // Function to fetch books with pagination
  const fetchBooks = async (currentPage = 1, shouldReplaceResults = true) => {
    if (currentPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    setError(null);
    
    let apiUrl = '/books?';
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    
    if (selectedCategory && selectedCategory !== 'All') {
      params.append('category', selectedCategory);
    }
    
    if (sortBy) {
      params.append('sort', sortBy);
    }
    
    // Add pagination parameters
    params.append('page', currentPage);
    params.append('limit', 10); // Load 10 books per page
    
    // Append parameters to URL
    apiUrl += params.toString();
    
    try {
      // Use the simple getAPI function without any authentication headers
      const data = await getAPI(apiUrl);
      
      if (data && data.books && Array.isArray(data.books)) {
        // If we're loading the first page, replace the current books
        // Otherwise, append the new books to the existing ones
        if (shouldReplaceResults) {
          setBooks(data.books);
        } else {
          setBooks(prevBooks => [...prevBooks, ...data.books]);
        }
        
        // Update pagination information
        if (data.pagination) {
          setHasMore(data.pagination.hasNextPage);
          setTotalBooks(data.pagination.totalBooks);
        } else {
          setHasMore(false);
        }
      } else if (data && Array.isArray(data)) {
        // Handle case where API returns an array directly
        if (shouldReplaceResults) {
          setBooks(data);
        } else {
          setBooks(prevBooks => [...prevBooks, ...data]);
        }
        // Assume there's no more data if the returned array is empty or less than 10 items
        setHasMore(data.length === 10);
      } else {
        if (shouldReplaceResults) {
          setBooks([]);
        }
        setHasMore(false);
        if (currentPage === 1) {
          setError('No books found matching your criteria');
        }
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. Please try again.');
      if (shouldReplaceResults) {
        setBooks([]);
      }
    } finally {
      if (currentPage === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
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

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error && books.length === 0 ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.resultsCount}>
            Found {totalBooks > 0 ? totalBooks : books.length} {totalBooks === 1 ? 'book' : 'books'}
          </div>
          <div className={styles.bookGrid}>
            {books.map((book, index) => (
              <div 
                key={book._id} 
                className={styles.bookCard}
                ref={index === books.length - 1 ? lastBookRef : null}
              >
                <button 
                  className={styles.bookmarkButton}
                  onClick={() => handleBookmark(book._id)}
                  title={bookmarkedBooks.has(book._id) ? "Remove from bookmarks" : "Add to bookmarks"}
                >
                  {bookmarkedBooks.has(book._id) ? <FaBookmark /> : <FaRegBookmark />}
                </button>

                <Link href={`/books/${book._id}`} className={styles.bookLink}>
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
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>by {book.author}</p>
                    {renderRatingStars(book.averageRating)}
                    <p className={styles.bookCategory}>{book.category}</p>
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
              </div>
            ))}
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