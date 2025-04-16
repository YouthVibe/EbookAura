'use client';

import { useState, useEffect } from 'react';
import { FaBook, FaEye, FaDownload, FaStar, FaBookmark, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './bookmarks.module.css';
import { useAuth } from '../context/AuthContext';

export default function BookmarksPage() {
  const [bookmarkedBooks, setBookmarkedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authVerified, setAuthVerified] = useState(false);
  const router = useRouter();
  const { getToken, getApiKey } = useAuth();

  // First verify user authentication
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getToken();
        const apiKey = getApiKey();
        
        if (!token || !apiKey) {
          router.push('/login');
          return;
        }

        // Call our new validation endpoint
        const response = await fetch('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': apiKey
          }
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Auth validation failed:', data);
          
          // Clear invalid credentials and redirect to login
          localStorage.removeItem('token');
          setError('Authentication failed. Please login again.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Authentication verified, proceed
        setAuthVerified(true);
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
      if (!authVerified) return;
      
      try {
        const token = getToken();
        const apiKey = getApiKey();

        const response = await fetch('/api/users/bookmarks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': apiKey
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bookmarks');
        }

        const data = await response.json();
        setBookmarkedBooks(data.books || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        setError('Failed to load bookmarks. Please try again later.');
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [authVerified, getToken, getApiKey]);

  const handleRemoveBookmark = async (bookId) => {
    try {
      const token = getToken();
      const apiKey = getApiKey();
      
      const response = await fetch('/api/users/bookmarks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ bookId })
      });

      if (response.ok) {
        setBookmarkedBooks(bookmarkedBooks.filter(book => book._id !== bookId));
      } else {
        const data = await response.json();
        console.error('Failed to remove bookmark:', data);
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
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
        <div className={styles.bookGrid}>
          {bookmarkedBooks.map((book) => (
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
                      <FaEye /> {book.views}
                    </span>
                    <span className={styles.stat}>
                      <FaDownload /> {book.downloads}
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
    </div>
  );
} 