'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaTrash, FaBookmark, FaStar, FaExclamationTriangle, FaCrown, FaCoins, FaInfoCircle, FaKey } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './settings.module.css';
import { API_BASE_URL } from '../utils/config';
import { deleteAPI, postAPI } from '../api/apiUtils';
import { getCurrentSubscription, getSubscriptionHistory, updateSubscription, cancelSubscription } from '../api/subscriptions';
import SimpleApiKeyManager from '../components/profile/SimpleApiKeyManager';
import SubscriptionStatus from '../components/profile/SubscriptionStatus';

export default function Settings() {
  const { user, logout, getToken, updateUserCoins } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState('');
  const [reviews, setReviews] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteReviewsModal, setShowDeleteReviewsModal] = useState(false);
  const [showDeleteBookmarksModal, setShowDeleteBookmarksModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Add subscription-related state
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Load user data
    fetchUserData();
    
    // Load subscription data
    fetchSubscriptionData();
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

  const fetchSubscriptionData = async () => {
    setSubscriptionLoading(true);
    
    try {
      // Try to fetch current subscription
      try {
        const subscriptionData = await getCurrentSubscription();
        
        // Check if user has a subscription using the hasSubscription flag
        if (subscriptionData && subscriptionData.hasSubscription && subscriptionData.subscription) {
          setCurrentSubscription(subscriptionData.subscription);
        } else {
          // User doesn't have an active subscription
          console.log('No active subscription found');
          
          // Check if this was an expired subscription
          if (subscriptionData && subscriptionData.wasExpired) {
            // Show message that subscription has expired
            setError('Your subscription has expired. Please renew to continue enjoying premium benefits.');
            // Add the expired subscription to the history 
            if (subscriptionData.subscription) {
              setSubscriptionHistory(prev => [subscriptionData.subscription, ...prev]);
            }
          }
          
          setCurrentSubscription(null);
        }
      } catch (err) {
        // Handle unexpected errors
        console.error('Error fetching subscription:', err);
        setCurrentSubscription(null);
      }
      
      // Fetch subscription history
      try {
        const historyData = await getSubscriptionHistory();
        if (historyData && historyData.subscriptions) {
          setSubscriptionHistory(historyData.subscriptions);
        } else if (historyData && historyData.data) {
          // Handle potential different response structure
          setSubscriptionHistory(historyData.data);
        } else {
          setSubscriptionHistory([]);
        }
      } catch (err) {
        console.error('Error fetching subscription history:', err);
        setSubscriptionHistory([]);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setSubscriptionLoading(false);
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
    setConfirmPassword('');
    setConfirmPasswordError('');
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please enter your password to confirm account deletion');
      return;
    }

    setShowDeleteAccountModal(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First, verify the password
      try {
        await postAPI('/users/verify-password', { password: confirmPassword }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (passwordError) {
        setLoading(false);
        setError('Password verification failed. Account deletion aborted.');
        return;
      }

      // If password verification succeeded, proceed with account deletion
      await deleteAPI('/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setSuccess('Account deleted successfully');
      logout();
      // Redirect to home page after successful account deletion
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message || 'An error occurred while deleting your account');
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!currentSubscription) return;
    
    setSubscriptionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await updateSubscription(
        currentSubscription._id, 
        { autoRenew: !currentSubscription.autoRenew }
      );
      
      if (result && result.subscription) {
        setCurrentSubscription(result.subscription);
        setSuccess(`Auto-renew has been ${result.subscription.autoRenew ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.message || 'Failed to update subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    setCancelReason("non_cancellable");
    setShowCancelSubscriptionModal(true);
  };

  const confirmCancelSubscription = async () => {
    setShowCancelSubscriptionModal(false);
    setError('Subscription cancellation is not allowed. Subscriptions are non-refundable once purchased.');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
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

        {/* Subscription Status Section */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>
            <FaCrown className={styles.sectionIcon} />
            Subscription
          </h2>
          <p className={styles.sectionDescription}>
            Manage your subscription plan and access to premium content
          </p>
          <SubscriptionStatus />
        </div>

        {/* API Key Management Section */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>
            <FaKey className={styles.sectionIcon} />
            API Key
          </h2>
          <p className={styles.sectionDescription}>
            Manage your API key for external applications and services
          </p>
          <SimpleApiKeyManager />
        </div>
        
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

        {/* Subscription Section */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Subscription Management</h2>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingTitle}>Current Subscription</h3>
              <p className={styles.settingDescription}>
                Manage your current subscription
              </p>
            </div>
            {subscriptionLoading ? (
              <div className={styles.loading}>Loading subscription data...</div>
            ) : currentSubscription ? (
              <div className={styles.subscriptionCard}>
                <div className={styles.subscriptionHeader}>
                  <h4 className={styles.subscriptionName}>{currentSubscription.plan?.name || 'Premium Plan'}</h4>
                  <span className={`${styles.subscriptionStatus} ${styles[currentSubscription.status]}`}>
                    {currentSubscription.status}
                  </span>
                </div>
                
                <div className={styles.subscriptionDetails}>
                  <p>
                    <strong>Started:</strong> {formatDate(currentSubscription.startDate)}
                  </p>
                  <p>
                    <strong>Expires:</strong> {formatDate(currentSubscription.endDate)}
                  </p>
                  <p>
                    <strong>Auto-Renew:</strong> {currentSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </p>
                  {currentSubscription.nextPaymentDate && (
                    <p>
                      <strong>Next Payment:</strong> {formatDate(currentSubscription.nextPaymentDate)}
                    </p>
                  )}
                  <p>
                    <strong>Payment Method:</strong> {currentSubscription.paymentMethod?.replace('_', ' ')}
                  </p>
                </div>
                
                <div className={styles.subscriptionActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={handleToggleAutoRenew}
                    disabled={subscriptionLoading || currentSubscription.status !== 'active'}
                  >
                    {currentSubscription.autoRenew ? 'Disable Auto-Renew' : 'Enable Auto-Renew'}
                  </button>
                  
                  <div className={styles.nonCancelableNotice}>
                    <FaInfoCircle className={styles.infoIcon} />
                    <p>Subscriptions are non-refundable and cannot be canceled once purchased.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.noSubscription}>
                <p>You don't have an active subscription.</p>
                {error && error.includes('expired') ? (
                  <div className={styles.expiredSubscriptionMessage}>
                    <FaInfoCircle className={styles.warningIcon} />
                    <p>Your subscription has expired. Renew now to continue enjoying premium benefits!</p>
                  </div>
                ) : null}
                <Link href="/plans" className={styles.planButton}>
                  {error && error.includes('expired') ? 'Renew Subscription' : 'View Subscription Plans'}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Subscription History */}
        {subscriptionHistory.length > 0 && (
          <div className={styles.subscriptionHistory}>
            <h3>Subscription History</h3>
            <div className={styles.historyList}>
              {subscriptionHistory.map((sub) => (
                <div key={sub._id} className={styles.historyItem}>
                  <div className={styles.historyHeader}>
                    <span className={styles.historyPlan}>{sub.plan?.name || 'Premium Plan'}</span>
                    <span className={`${styles.historyStatus} ${styles[sub.status]}`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className={styles.historyPeriod}>
                    {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
              <p>The following will be permanently deleted:</p>
              <ul className={styles.deletionList}>
                <li>Your user profile and personal information</li>
                <li>All your reviews and ratings</li>
                <li>All your bookmarks</li>
                <li>Your profile picture</li>
              </ul>
              <div className={styles.passwordConfirmation}>
                <label htmlFor="confirmPassword">Enter your password to confirm deletion:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.passwordInput}
                  placeholder="Your current password"
                />
                {confirmPasswordError && (
                  <p className={styles.passwordError}>{confirmPasswordError}</p>
                )}
              </div>
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
                Delete My Account
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

      {/* Cancel Subscription Modal - This can be removed since we don't want to show it anymore,
          but if there are other parts of the code that reference it, we'll keep a simplified version */}
      {showCancelSubscriptionModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Subscription Cancellation</h2>
            <p>Subscriptions are non-refundable and cannot be canceled once purchased.</p>
            <p>You will continue to have access until {formatDate(currentSubscription?.endDate)}.</p>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.confirmButton}
                onClick={() => setShowCancelSubscriptionModal(false)}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 