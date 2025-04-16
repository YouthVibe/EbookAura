'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaSort, FaEye, FaDownload, FaBook, FaStar, FaRegStar, FaBookmark, FaRegBookmark, FaStarHalfAlt } from 'react-icons/fa';
import Link from 'next/link';
import styles from './search.module.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

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
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookmarkedBooks, setBookmarkedBooks] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const router = useRouter();
  const { getToken, getApiKey } = useAuth();

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
        const response = await fetch('/api/books/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        if (!token) {
          setIsLoggedIn(false);
          return;
        }

        const response = await fetch('/api/auth/check', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(data.isAuthenticated);
          // Fetch user's bookmarks
          fetchUserBookmarks();
        } else {
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
      if (!token) return;
      
      const response = await fetch('/api/users/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': getApiKey()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle different possible response formats
        let bookmarkIds = [];
        if (data.bookmarks) {
          bookmarkIds = data.bookmarks;
        } else if (data.books && Array.isArray(data.books)) {
          bookmarkIds = data.books.map(book => book._id);
        }
        setBookmarkedBooks(new Set(bookmarkIds));
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
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
      const response = await fetch('/api/users/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify({ bookId })
      });

      if (response.ok) {
        // Show success toast
        showToast(wasBookmarked 
          ? `Removed "${bookTitle}" from bookmarks` 
          : `Added "${bookTitle}" to bookmarks`, 'success');
      } else {
        // Revert changes if the API call fails
        if (wasBookmarked) {
          newBookmarkedBooks.add(bookId);
        } else {
          newBookmarkedBooks.delete(bookId);
        }
        setBookmarkedBooks(newBookmarkedBooks);
        console.error('Bookmark operation failed');
        showToast('Failed to update bookmark', 'error');
      }
    } catch (error) {
      // Revert changes on error
      if (wasBookmarked) {
        newBookmarkedBooks.add(bookId);
      } else {
        newBookmarkedBooks.delete(bookId);
      }
      setBookmarkedBooks(newBookmarkedBooks);
      console.error('Error toggling bookmark:', error);
      showToast('Error updating bookmark', 'error');
    }
  };

  // Fetch books with debounce
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search: searchQuery,
          category: selectedCategory,
          sort: sortBy
        });
        const response = await fetch(`/api/books?${params}`);
        if (!response.ok) throw new Error('Failed to fetch books');
        const data = await response.json();
        setBooks(data);
      } catch (err) {
        setError('Failed to load books');
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, sortBy]);

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
        <div className={styles.searchBar}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by title, author, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

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
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.resultsCount}>
            Found {books.length} {books.length === 1 ? 'book' : 'books'}
          </div>
          <div className={styles.bookGrid}>
            {books.map((book) => (
              <div key={book._id} className={styles.bookCard}>
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
        </>
      )}
    </div>
  );
} 