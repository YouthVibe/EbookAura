/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
import React from 'react';
import { FaStar, FaRegStar, FaUserCircle, FaTrash, FaPen, FaClock } from 'react-icons/fa';
import styles from './ReviewItem.module.css';
import { formatDistanceToNow } from 'date-fns';

const ReviewItem = ({ review, currentUser, onDelete, onEdit }) => {
  // Check if this review belongs to the current user
  const isOwnReview = currentUser && review.user?._id === currentUser._id;
  
  // Format the date
  const formattedDate = review.createdAt ? 
    formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 
    'recently';
  
  // Generate stars based on rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={styles.star}>
        {i < rating ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };

  return (
    <div className={`${styles.reviewItem} ${isOwnReview ? styles.ownReview : ''}`}>
      {isOwnReview && <div className={styles.ownReviewBadge}>Your Review</div>}
      
      <div className={styles.reviewHeader}>
        <div className={styles.userInfo}>
          <FaUserCircle className={styles.userIcon} />
          <div className={styles.nameContainer}>
            <span className={styles.userName}>
              {review.user?.name || "Anonymous"}
            </span>
            {isOwnReview && (
              <div className={styles.reviewActions}>
                <button 
                  onClick={() => onEdit(review)} 
                  className={styles.actionButton}
                  aria-label="Edit review"
                >
                  <FaPen />
                </button>
                <button 
                  onClick={() => onDelete(review._id)} 
                  className={styles.actionButton}
                  aria-label="Delete review"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.reviewMeta}>
          <div className={styles.rating}>
            {renderStars(review.rating)}
          </div>
          <div className={styles.dateInfo}>
            <FaClock className={styles.clockIcon} />
            <span className={styles.date}>{formattedDate}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.reviewText}>
        {review.text}
      </div>
    </div>
  );
};

export default ReviewItem; 