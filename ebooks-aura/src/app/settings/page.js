'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaTrash, FaBookmark, FaStar, FaMoon, FaSun, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './settings.module.css';
import { API_BASE_URL } from '../utils/config';

export default function Settings() {
  const { user, logout, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState('');
  const [reviews, setReviews] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [theme, setTheme] = useState('light');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteReviewsModal, setShowDeleteReviewsModal] = useState(false);
  const [showDeleteBookmarksModal, setShowDeleteBookmarksModal] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Load user data
    fetchUserData();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [user, router]);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch user reviews
      const reviewsResponse = await fetch(`${API_BASE_URL}/reviews/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!reviewsResponse.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData);

      // Fetch user bookmarks
      const bookmarksResponse = await fetch(`${API_BASE_URL}/bookmarks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!bookmarksResponse.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      const bookmarksData = await bookmarksResponse.json();
      setBookmarks(bookmarksData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'An error occurred while fetching your data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setConfirmAction(`Are you sure you want to delete this review?`);
    setSuccess('');
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete review');
      }

      setSuccess('Review deleted successfully');
      setReviews(reviews.filter(review => review._id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err.message || 'An error occurred while deleting the review');
    }
  };

  const handleDeleteAllReviews = async () => {
    setShowDeleteReviewsModal(true);
  };

  const confirmDeleteAllReviews = async () => {
    setShowDeleteReviewsModal(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/user/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete all reviews');
      }

      setSuccess('All reviews deleted successfully');
      setReviews([]);
    } catch (err) {
      console.error('Error deleting all reviews:', err);
      setError(err.message || 'An error occurred while deleting all reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    setConfirmAction(`Are you sure you want to delete this bookmark?`);
    setSuccess('');
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete bookmark');
      }

      setSuccess('Bookmark deleted successfully');
      setBookmarks(bookmarks.filter(bookmark => bookmark._id !== bookmarkId));
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      setError(err.message || 'An error occurred while deleting the bookmark');
    }
  };

  const handleDeleteAllBookmarks = async () => {
    setShowDeleteBookmarksModal(true);
  };

  const confirmDeleteAllBookmarks = async () => {
    setShowDeleteBookmarksModal(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/bookmarks/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete all bookmarks');
      }

      setSuccess('All bookmarks deleted successfully');
      setBookmarks([]);
    } catch (err) {
      console.error('Error deleting all bookmarks:', err);
      setError(err.message || 'An error occurred while deleting all bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteAccountModal(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      setSuccess('Account deleted successfully');
      logout();
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message || 'An error occurred while deleting your account');
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.settingsContainer}>
          <div className={styles.loading}>
            <div className={styles.loadingAnimation}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.settingsContainer}>
        <div className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            <FaArrowLeft className={styles.backIcon} />
            Back to Profile
          </Link>
          <h1 className={styles.headerTitle}>Settings</h1>
          <p className={styles.headerSubtitle}>Manage your account settings</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Account Settings</h2>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>Delete Account</h3>
              <p className={styles.settingDescription}>
                Permanently delete your account and all associated data
              </p>
            </div>
            <button 
              className={styles.deleteButton}
              onClick={handleDeleteAccount}
            >
              <FaTrash className={styles.deleteIcon} />
              Delete Account
            </button>
          </div>
        </div>

        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Reviews & Ratings</h2>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>Delete All Reviews</h3>
              <p className={styles.settingDescription}>
                Remove all your reviews and ratings from books
              </p>
            </div>
            <button 
              className={styles.deleteButton}
              onClick={handleDeleteAllReviews}
            >
              <FaTrash className={styles.deleteIcon} />
              Delete All Reviews
            </button>
          </div>

          {reviews.length > 0 && (
            <div className={styles.reviewsList}>
              <h3 className={styles.subsectionTitle}>Your Reviews</h3>
              {reviews.map((review) => (
                <div key={review._id} className={styles.reviewItem}>
                  <div className={styles.reviewInfo}>
                    <h4 className={styles.bookTitle}>{review.book.title}</h4>
                    <div className={styles.rating}>
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          className={`${styles.starIcon} ${i < review.rating ? styles.filled : ''}`} 
                        />
                      ))}
                    </div>
                    <p className={styles.reviewText}>{review.text}</p>
                    <p className={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    className={styles.deleteReviewButton}
                    onClick={() => handleDeleteReview(review._id)}
                  >
                    <FaTrash className={styles.deleteIcon} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Bookmarks</h2>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>Delete All Bookmarks</h3>
              <p className={styles.settingDescription}>
                Remove all your bookmarked books
              </p>
            </div>
            <button 
              className={styles.deleteButton}
              onClick={handleDeleteAllBookmarks}
            >
              <FaTrash className={styles.deleteIcon} />
              Delete All Bookmarks
            </button>
          </div>

          {bookmarks.length > 0 && (
            <div className={styles.bookmarksList}>
              <h3 className={styles.subsectionTitle}>Your Bookmarks</h3>
              {bookmarks.map((bookmark) => (
                <div key={bookmark._id} className={styles.bookmarkItem}>
                  <div className={styles.bookmarkInfo}>
                    <h4 className={styles.bookTitle}>{bookmark.book.title}</h4>
                    <p className={styles.bookmarkDate}>
                      Added on {new Date(bookmark.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    className={styles.deleteBookmarkButton}
                    onClick={() => handleDeleteBookmark(bookmark._id)}
                  >
                    <FaTrash className={styles.deleteIcon} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>Theme</h3>
              <p className={styles.settingDescription}>
                Switch between light and dark mode
              </p>
            </div>
            <button 
              className={styles.themeButton}
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <>
                  <FaMoon className={styles.themeIcon} />
                  Dark Mode
                </>
              ) : (
                <>
                  <FaSun className={styles.themeIcon} />
                  Light Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <h3 className={styles.modalTitle}>Delete Account</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <p>All your data, including reviews, bookmarks, and profile information will be permanently deleted.</p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteButton}
                onClick={confirmDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Reviews Modal */}
      {showDeleteReviewsModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <h3 className={styles.modalTitle}>Delete All Reviews</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Are you sure you want to delete all your reviews? This action cannot be undone.</p>
              <p>All your reviews and ratings will be permanently removed from the platform.</p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteReviewsModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteButton}
                onClick={confirmDeleteAllReviews}
              >
                Delete All Reviews
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Bookmarks Modal */}
      {showDeleteBookmarksModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <h3 className={styles.modalTitle}>Delete All Bookmarks</h3>
            </div>
            <div className={styles.modalContent}>
              <p>Are you sure you want to delete all your bookmarks? This action cannot be undone.</p>
              <p>All your bookmarked books will be permanently removed from your account.</p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteBookmarksModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteButton}
                onClick={confirmDeleteAllBookmarks}
              >
                Delete All Bookmarks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 