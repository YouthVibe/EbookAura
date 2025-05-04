/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaStar, FaRegStar, FaUser, FaCalendarAlt, FaTrash, FaTimes, FaFilter, FaSort, FaCheckCircle, FaExclamationTriangle, FaPaperPlane, FaLock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { BsStarFill, BsStarHalf, BsStar, BsSortDown, BsSortUp } from 'react-icons/bs';
import { MdFilterList, MdFilterListOff, MdSort, MdDelete, MdFilterAlt } from 'react-icons/md';
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
  const [sortOption, setSortOption] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 4,
    totalReviews: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const { user } = useAuth();
  
  // Fetch reviews and rating
  useEffect(() => {
    fetchData();
  }, [bookId, sortOption, ratingFilter, currentPage]);
  
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
      
      // Fetch reviews with sort, filter, and pagination options
      const [reviewsData, ratingData] = await Promise.all([
        getBookReviews(bookId, sortOption, ratingFilter, currentPage, 4),
        getBookRating(bookId)
      ]);
      
      let filteredReviews = reviewsData.reviews || [];
      
      // If sorting by "my-reviews", filter to show only the current user's reviews
      if (sortOption === 'my-reviews' && user) {
        filteredReviews = filteredReviews.filter(review => 
          (user.name && review.userName === user.name) || 
          (user.username && review.userName === user.username)
        );
      }
      
      setReviews(filteredReviews);
      setAverageRating(ratingData.averageRating);
      setReviewCount(ratingData.reviewCount);
      setRatingDistribution(ratingData.ratingDistribution || {});
      
      // Check if the current user has already reviewed this book
      if (user) {
        const userHasReview = filteredReviews.some(review => 
          (user.name && review.userName === user.name) || 
          (user.username && review.userName === user.username)
        );
        
        setUserHasReviewed(userHasReview);
        
        if (userHasReview) {
          const foundUserReview = filteredReviews.find(review => 
            (user.name && review.userName === user.name) || 
            (user.username && review.userName === user.username)
          );
          setUserReview(foundUserReview);
        }
      }
      
      // Save pagination data
      if (reviewsData.pagination) {
        setPagination(reviewsData.pagination);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load reviews. Please try again later.');
      console.error('Error loading review data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle sort change
  const handleSortChange = (option) => {
    setSortOption(option);
    setCurrentPage(1); // Reset to first page when sort changes
  };
  
  // Handle rating filter change
  const handleRatingFilterChange = (rating) => {
    if (ratingFilter === rating) {
      // If clicking the same rating filter, clear it
      setRatingFilter(null);
    } else {
      setRatingFilter(rating);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
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
      
      // Reset to first page to see the new review
      setCurrentPage(1);
      
      // Refetch all review data to ensure we have the latest
      fetchData();
      
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
      
      // Refetch all review data to ensure we have the latest
      fetchData();
      
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
  
  // Render pagination controls
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
      <div className={styles.pagination}>
        <button
          className={`${styles.pageButton} ${!pagination.hasPrevPage ? styles.disabled : ''}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          aria-label="Previous page"
        >
          <FaChevronLeft />
        </button>
        
        <div className={styles.pageInfo}>
          Page {pagination.page} of {pagination.totalPages}
        </div>
        
        <button
          className={`${styles.pageButton} ${!pagination.hasNextPage ? styles.disabled : ''}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!pagination.hasNextPage}
          aria-label="Next page"
        >
          <FaChevronRight />
        </button>
      </div>
    );
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

      <div className={styles.reviewHeader}>
        <div className={styles.reviewSummary}>
          <h2>{reviewCount} Reviews</h2>
          <div className={styles.totalRating}>
            <div className={styles.overallRating}>
              <div className={styles.ratingValue}>{averageRating.toFixed(1)}</div>
              <div className={styles.ratingStars}>
                {renderDisplayStars(averageRating)}
              </div>
            </div>
            <div className={styles.totalBadge}>
              <span>{reviewCount} ratings</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.reviewContent}>
        {user ? (
          userHasReviewed ? (
            <div className={styles.alreadyReviewed}>
              <h3>Your Review</h3>
              <div className={styles.userReviewBox}>
                <div className={styles.userReviewHeader}>
                  <div className={styles.userReviewRating}>
                    {renderDisplayStars(userReview?.rating || 0)}
                    <span className={styles.ratingText}>
                      {userReview?.rating || 0}/5 stars
                    </span>
                  </div>
                  <button 
                    onClick={() => confirmDeleteReview(userReview)}
                    className={styles.deleteUserReviewButton}
                    title="Delete your review"
                  >
                    <FaTrash /> Delete Review
                  </button>
                </div>
                {userReview?.comment && (
                  <div className={styles.userReviewComment}>
                    "{userReview.comment}"
                  </div>
                )}
                <div className={styles.userReviewDate}>
                  Reviewed on {formatDate(userReview?.createdAt)}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.reviewForm}>
              <h3>Write a Review</h3>
              
              {success && (
                <div className={styles.success}>
                  <FaCheckCircle style={{ marginRight: '8px' }} /> 
                  Your review has been submitted successfully!
                </div>
              )}
              
              {deleteSuccess && (
                <div className={styles.success}>
                  <FaCheckCircle style={{ marginRight: '8px' }} /> 
                  Your review has been deleted successfully!
                </div>
              )}
              
              {submitError && (
                <div className={styles.submitError}>
                  <FaExclamationTriangle style={{ marginRight: '8px' }} /> 
                  {submitError}
                </div>
              )}
              
              <form onSubmit={handleSubmitReview}>
                <div className={styles.ratingSelector}>
                  <label htmlFor="rating-stars">Your Rating:</label>
                  <div className={styles.stars} id="rating-stars" role="group" aria-label="Select a rating from 1 to 5 stars">
                    {renderRatingStars()}
                  </div>
                  {rating > 0 && (
                    <div className={styles.selectedRating}>
                      You selected: <strong>{rating} {rating === 1 ? 'star' : 'stars'}</strong>
                    </div>
                  )}
                </div>
                
                <div className={styles.commentField}>
                  <label htmlFor="review-comment">
                    Your Review: <span className={styles.optional}>(optional, max 200 characters)</span>
                  </label>
                  <textarea 
                    id="review-comment"
                    value={comment}
                    onChange={handleCommentChange}
                    placeholder="Share your thoughts about this book (optional)"
                    rows={4}
                    className={styles.textarea}
                    maxLength={200}
                  />
                  <div className={styles.characterCount}>
                    {characterCount}/200 characters
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={submitting || rating === 0}
                >
                  {submitting ? (
                    <>
                      <div className={styles.spinner}></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane style={{ marginRight: '8px' }} />
                      Submit Review
                    </>
                  )}
                </button>
              </form>
            </div>
          )
        ) : (
          <div className={styles.loginPrompt}>
            <FaLock style={{ marginRight: '8px', fontSize: '1.2rem' }} />
            Please log in to leave a review.
          </div>
        )}
        
        <div className={styles.reviewsList}>
          <div className={styles.reviewsHeader}>
            <h3>Reviews ({reviewCount})</h3>
          </div>
          
          {/* Filter and sort section - moved here from the header */}
          <div className={styles.filterSortContainer}>
            <div className={styles.ratingFilters}>
              <div className={styles.filtersHeader}>
                <h3><MdFilterAlt style={{ color: '#ef4444' }} /> <span>Filter & Sort Reviews</span></h3>
              </div>
              
              {(ratingFilter || sortOption !== 'newest') && (
                <div className={styles.activeFilterIndicator}>
                  {ratingFilter && (
                    <div className={styles.filterBadge}>
                      <div className={styles.filterBadgeContent}>
                        <strong>{ratingFilter}-star</strong> reviews only
                      </div>
                      <button
                        className={styles.clearFilterButton}
                        onClick={() => handleRatingFilterChange(null)}
                        aria-label="Clear rating filter"
                        title="Clear rating filter"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  
                  {sortOption !== 'newest' && (
                    <div className={styles.sortBadge}>
                      <span>Sorted by: <strong>
                        {sortOption === 'highest' ? 'Highest Rated' : 
                        sortOption === 'lowest' ? 'Lowest Rated' : 
                        sortOption === 'oldest' ? 'Oldest First' :
                        sortOption === 'my-reviews' ? 'My Reviews' : 'Newest First'}
                      </strong></span>
                    </div>
                  )}
                </div>
              )}
              
              <div className={styles.filterOptions}>
                <div className={styles.filterLabel}>Filter by Rating:</div>
                <div className={styles.ratingFilterButtons}>
                  <button
                    className={`${styles.ratingFilterButton} ${ratingFilter === null ? styles.activeFilter : ''}`}
                    onClick={() => handleRatingFilterChange(null)}
                    aria-label="Show all reviews"
                    title="Show all reviews"
                  >
                    All Ratings
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      className={`${styles.ratingFilterButton} ${ratingFilter === rating ? styles.activeFilter : ''}`}
                      onClick={() => handleRatingFilterChange(rating)}
                      aria-label={`Show only ${rating} star reviews`}
                      title={`Show only ${rating} star reviews`}
                    >
                      <span className={styles.filterStars}>
                        {rating} <FaStar className={styles.filterStar} />
                      </span>
                      {ratingDistribution && ratingDistribution[rating] > 0 && (
                        <span className={styles.filterCount}>({ratingDistribution[rating]})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={styles.sortOptions}>
                <div className={styles.filterLabel}>Sort Reviews By:</div>
                <div className={styles.sortButtons}>
                  <button
                    className={`${styles.sortButton} ${sortOption === 'newest' ? styles.activeSort : ''}`}
                    onClick={() => handleSortChange('newest')}
                    aria-label="Sort by newest reviews first"
                    title="Sort by newest reviews first"
                  >
                    <MdSort /> Newest First
                  </button>
                  <button
                    className={`${styles.sortButton} ${sortOption === 'oldest' ? styles.activeSort : ''}`}
                    onClick={() => handleSortChange('oldest')}
                    aria-label="Sort by oldest reviews first"
                    title="Sort by oldest reviews first"
                  >
                    <BsSortUp /> Oldest First
                  </button>
                  <button
                    className={`${styles.sortButton} ${sortOption === 'highest' ? styles.activeSort : ''}`}
                    onClick={() => handleSortChange('highest')}
                    aria-label="Sort by highest rating first"
                    title="Sort by highest rating first"
                  >
                    <BsSortDown /> Highest Rated
                  </button>
                  <button
                    className={`${styles.sortButton} ${sortOption === 'lowest' ? styles.activeSort : ''}`}
                    onClick={() => handleSortChange('lowest')}
                    aria-label="Sort by lowest rating first"
                    title="Sort by lowest rating first"
                  >
                    <BsSortUp /> Lowest Rated
                  </button>
                  {user && (
                    <button
                      className={`${styles.sortButton} ${sortOption === 'my-reviews' ? styles.activeSort : ''}`}
                      onClick={() => handleSortChange('my-reviews')}
                      aria-label="Show only my reviews"
                      title="Show only my reviews"
                    >
                      <FaUser /> My Reviews
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {reviews.length === 0 ? (
            <div className={styles.noReviews}>
              {ratingFilter 
                ? `No ${ratingFilter}-star reviews found. ${reviewCount > 0 ? 'Try a different filter.' : 'This book has no reviews yet.'}`
                : sortOption === 'my-reviews'
                  ? 'You have not reviewed this book yet.'
                  : reviewCount > 0 
                    ? 'No reviews match the current filters.' 
                    : 'Be the first to review this book!'}
            </div>
          ) : (
            <>
              <div className={styles.activeFilterIndicator}>
                <div className={styles.reviewCount}>
                  <span>
                    {sortOption === 'my-reviews' 
                      ? `Showing your ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}` 
                      : <>Showing <strong>{reviews.length}</strong> of <strong>{reviewCount}</strong> reviews</>}
                  </span>
                </div>
                
                {reviews.map((review) => (
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
                ))}
              </div>
              
              {/* Pagination controls */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 