'use client';

import { useState, useEffect } from 'react';
import { FaBook, FaEye, FaDownload, FaStar, FaBookmark, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './bookmarks.module.css';
import { useAuth } from '../context/AuthContext';
import { getAPI, deleteAPI } from '../api/apiUtils';
import SearchInput from '../components/SearchInput';

export default function BookmarksPage() {
  const [bookmarkedBooks, setBookmarkedBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authVerified, setAuthVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { getToken, getApiKey } = useAuth();

  // First verify user authentication
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getToken();
        const apiKey = getApiKey();
        
        if (!token || !apiKey) {
          console.log('No token or API key found, redirecting to login');
          router.push('/login');
          return;
        }

        // Use getAPI instead of fetch
        try {
          console.log('Verifying authentication...');
          const data = await getAPI('/auth/check', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-Key': apiKey
            }
          });

          console.log('Auth response:', data);
          
          if (data && data.isAuthenticated) {
            console.log('Authentication verified');
            setAuthVerified(true);
          } else {
            console.error('Auth validation failed:', data);
            localStorage.removeItem('token');
            setError('Authentication failed. Please login again.');
            setTimeout(() => router.push('/login'), 2000);
          }
        } catch (error) {
          console.error('API auth verification error:', error);
          localStorage.removeItem('token');
          setError('Authentication verification failed. Please login again.');
          setTimeout(() => router.push('/login'), 2000);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setError('Authentication verification failed. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    verifyAuth();
  }, [router, getToken, getApiKey]);

  // Fetch bookmarks only after auth is verified
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!authVerified) {
        console.log('Auth not verified yet, skipping bookmark fetch');
        return;
      }
      
      try {
        const token = getToken();
        const apiKey = getApiKey();

        console.log('Fetching bookmarks...');
        
        try {
          const data = await getAPI('/users/bookmarks', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-Key': apiKey
            }
          });

          console.log('Bookmark data received:', data);
          
          // Handle different response formats
          if (data && data.books && Array.isArray(data.books)) {
            console.log(`Found ${data.books.length} bookmarks`);
            setBookmarkedBooks(data.books);
          } else if (data && Array.isArray(data)) {
            console.log(`Found ${data.length} bookmarks (array format)`);
            setBookmarkedBooks(data);
          } else {
            console.warn('Unexpected bookmark data format:', data);
            setBookmarkedBooks([]);
          }
        } catch (apiError) {
          console.error('API error fetching bookmarks:', apiError);
          setError('Failed to load bookmarks. Please try again later.');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        setError('Failed to load bookmarks. Please try again later.');
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [authVerified, getToken, getApiKey]);

  useEffect(() => {
    // Initialize filtered books when bookmarked books are loaded
    setFilteredBooks(bookmarkedBooks);
  }, [bookmarkedBooks]);

  /**
   * Enhanced search functionality that searches across multiple book fields
   * including title, author, category, and description.
   */
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredBooks(bookmarkedBooks);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const searchTerms = lowercasedSearch.split(' ').filter(term => term.length > 0);
    
    // More sophisticated search that matches any of the search terms
    // across all searchable fields
    const results = bookmarkedBooks.filter(book => {
      // If any search term matches any field, include the book
      return searchTerms.some(term => 
        (book.title && book.title.toLowerCase().includes(term)) || 
        (book.author && book.author.toLowerCase().includes(term)) || 
        (book.category && book.category.toLowerCase().includes(term)) ||
        (book.description && book.description.toLowerCase().includes(term)) ||
        (book.tags && Array.isArray(book.tags) && 
          book.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    });
    
    setFilteredBooks(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredBooks(bookmarkedBooks);
  };

  const handleRemoveBookmark = async (bookId) => {
    try {
      const token = getToken();
      const apiKey = getApiKey();
      
      console.log(`Removing bookmark for book ID: ${bookId}`);
      
      try {
        await deleteAPI(`/users/bookmarks/${bookId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': apiKey
          }
        });

        console.log('Bookmark removed successfully');
        setBookmarkedBooks(prevBooks => prevBooks.filter(book => book._id !== bookId));
      } catch (apiError) {
        console.error('API error removing bookmark:', apiError);
        alert('Failed to remove bookmark. Please try again.');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      alert('An error occurred. Please try again.');
    }
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/search" className={styles.backButton}>
          <FaArrowLeft /> Back to Search
        </Link>
        <h1>My Bookmarks</h1>
      </div>

      {bookmarkedBooks.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't bookmarked any PDFs yet.</p>
          <Link href="/search" className={styles.browseButton}>
            Browse PDFs
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.searchContainer}>
            <SearchInput 
              placeholder="Search your bookmarks..." 
              onSearch={handleSearch}
              initialValue={searchQuery}
              debounceTime={500}
              className={styles.bookmarkSearch}
            />
          </div>
          
          {filteredBooks.length === 0 ? (
            <div className={styles.noResults}>
              <p>No bookmarks match your search.</p>
              <button 
                onClick={clearSearch}
                className={styles.clearSearchButton}
              >
                Clear search and show all bookmarks
              </button>
            </div>
          ) : (
            <div className={styles.bookGrid}>
              {filteredBooks.map((book) => (
                <div key={book._id} className={styles.bookCard}>
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
                      <p className={styles.bookCategory}>{book.category}</p>
                      <div className={styles.bookStats}>
                        <span className={styles.stat}>
                          <FaEye /> {book.views || 0}
                        </span>
                        <span className={styles.stat}>
                          <FaDownload /> {book.downloads || 0}
                        </span>
                        {book.averageRating > 0 && (
                          <span className={styles.stat}>
                            <FaStar /> {book.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button 
                    className={styles.removeBookmarkButton}
                    onClick={() => handleRemoveBookmark(book._id)}
                    title="Remove from bookmarks"
                  >
                    <FaBookmark />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 