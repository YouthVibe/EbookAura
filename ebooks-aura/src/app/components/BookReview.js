'use client';

import { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaUser, FaCalendarAlt, FaTrash, FaTimes } from 'react-icons/fa';
import { getBookReviews, getBookRating, submitBookReview, deleteReview } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import styles from './BookReview.module.css';

export default function BookReview({ bookId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const { user } = useAuth();
  
  // Fetch reviews and rating
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Validate bookId
        if (!bookId) {
          setError('Book ID is missing. Cannot load reviews.');
          setLoading(false);
          return;
        }
        
        console.log('BookReview: Fetching data for bookId:', bookId);
        setLoading(true);
        
        // Fetch reviews and rating in parallel
        const [reviewsData, ratingData] = await Promise.all([
          getBookReviews(bookId),
          getBookRating(bookId)
        ]);
        
        setReviews(reviewsData);
        setAverageRating(ratingData.averageRating);
        setReviewCount(ratingData.reviewCount);
        setError(null);
      } catch (err) {
        setError('Failed to load reviews. Please try again later.');
        console.error('Error loading review data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bookId]);
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle comment change with character limit
  const handleCommentChange = (e) => {
    const text = e.target.value;
    if (text.length <= 200) {
      setComment(text);
      setCharacterCount(text.length);
    }
  };
  
  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // Validate bookId
    if (!bookId) {
      setSubmitError('Book ID is missing. Cannot submit review.');
      return;
    }
    
    if (rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      console.log('Submitting review for bookId:', bookId);
      const newReview = await submitBookReview(bookId, rating, comment);
      
      // Add the new review to the list
      setReviews([newReview, ...reviews]);
      
      // Update the average rating
      const newTotal = averageRating * reviewCount + rating;
      const newCount = reviewCount + 1;
      setAverageRating(newTotal / newCount);
      setReviewCount(newCount);
      
      // Reset form
      setRating(0);
      setComment('');
      setCharacterCount(0);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit review. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Initiate review deletion process - show confirmation
  const confirmDeleteReview = (review) => {
    setReviewToDelete(review);
    setShowDeleteConfirm(true);
  };
  
  // Cancel review deletion
  const cancelDeleteReview = () => {
    setReviewToDelete(null);
    setShowDeleteConfirm(false);
  };

  // Handle review deletion after confirmation
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      setDeleting(true);
      
      console.log('Deleting review with ID:', reviewToDelete._id);
      await deleteReview(reviewToDelete._id);
      
      // Remove the review from the list
      setReviews(reviews.filter(review => review._id !== reviewToDelete._id));
      
      // Update the average rating
      if (reviewCount > 1) {
        const newTotal = averageRating * reviewCount - reviewToDelete.rating;
        const newCount = reviewCount - 1;
        setAverageRating(newTotal / newCount);
        setReviewCount(newCount);
      } else {
        setAverageRating(0);
        setReviewCount(0);
      }
      
      setDeleteSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error deleting review:', err);
      setSubmitError(err.message || 'Failed to delete review. Please try again later.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setReviewToDelete(null);
    }
  };
  
  // Check if a review belongs to the current user
  const isUserReview = (review) => {
    // Check if the review name matches the user's name or username
    return user && (
      (user.name && review.userName === user.name) || 
      (user.username && review.userName === user.username)
    );
  };
  
  // Render stars for rating selection
  const renderRatingStars = () => {
    return Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
      <span 
        key={star} 
        className={styles.ratingStar}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoveredRating(star)}
        onMouseLeave={() => setHoveredRating(0)}
      >
        {(hoveredRating || rating) >= star ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };
  
  // Render stars for display
  const renderDisplayStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
      <span key={star} className={styles.displayStar}>
        {rating >= star ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };
  
  if (loading) {
    return <div className={styles.loading}>Loading reviews...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  return (
    <div className={styles.reviewContainer}>
      {showDeleteConfirm && reviewToDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmHeader}>
              <h4>Delete Review</h4>
              <button 
                onClick={cancelDeleteReview}
                className={styles.closeButton}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>
            <p>Are you sure you want to delete your review? This action cannot be undone.</p>
            <div className={styles.confirmButtons}>
              <button 
                onClick={cancelDeleteReview}
                className={styles.cancelButton}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteReview}
                className={styles.deleteConfirmButton}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className={styles.reviewHeader}>Customer Reviews</h2>
      
      <div className={styles.reviewSummary}>
        <div className={styles.averageRating}>
          <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
          <div className={styles.ratingStars}>
            {renderDisplayStars(averageRating)}
          </div>
          <span className={styles.reviewCount}>
            Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>
      
      {user ? (
        <div className={styles.reviewForm}>
          <h3>Write a Review</h3>
          
          {success && (
            <div className={styles.success}>
              Your review has been submitted successfully!
            </div>
          )}
          
          {deleteSuccess && (
            <div className={styles.success}>
              Your review has been deleted successfully!
            </div>
          )}
          
          {submitError && (
            <div className={styles.submitError}>{submitError}</div>
          )}
          
          <form onSubmit={handleSubmitReview}>
            <div className={styles.ratingSelector}>
              <label>Your Rating:</label>
              <div className={styles.stars}>
                {renderRatingStars()}
              </div>
            </div>
            
            <div className={styles.commentField}>
              <label>
                Your Review: <span className={styles.optional}>(optional, max 200 characters)</span>
              </label>
              <textarea 
                value={comment}
                onChange={handleCommentChange}
                placeholder="Share your thoughts about this book (optional)"
                rows={4}
                className={styles.textarea}
              />
              <div className={styles.characterCount}>
                {characterCount}/200 characters
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.loginPrompt}>
          Please log in to leave a review.
        </div>
      )}
      
      <div className={styles.reviewsList}>
        <h3>Recent Reviews</h3>
        
        {reviews.length === 0 ? (
          <div className={styles.noReviews}>
            Be the first to review this book!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewerInfo}>
                  {review.userImage ? (
                    <img 
                      src={review.userImage} 
                      alt={review.userName} 
                      className={styles.reviewerImage} 
                    />
                  ) : (
                    <div className={styles.reviewerPlaceholder}>
                      <FaUser />
                    </div>
                  )}
                  <span className={styles.reviewerName}>{review.userName}</span>
                </div>
                
                <div className={styles.reviewMetadata}>
                  <div className={styles.reviewDate}>
                    <FaCalendarAlt />
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  
                  {isUserReview(review) && (
                    <button 
                      onClick={() => confirmDeleteReview(review)}
                      className={styles.deleteButton}
                      disabled={deleting}
                      title="Delete your review"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
              
              <div className={styles.reviewRating}>
                {renderDisplayStars(review.rating)}
              </div>
              
              {review.comment && (
                <div className={styles.reviewText}>{review.comment}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 