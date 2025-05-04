/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * API functions for handling book reviews
 */
import { API_ENDPOINTS, API_BASE_URL } from '../utils/config';

// Get all reviews for a specific book
export const getBookReviews = async (bookId, sort = 'newest', ratingFilter = null, page = 1, limit = 4) => {
  try {
    if (!bookId) {
      throw new Error('Book ID is required');
    }
    
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Pass sort parameter to backend
    // Note: 'my-reviews' is handled client-side in the component
    if (sort && sort !== 'my-reviews') {
      queryParams.append('sort', sort);
    } else if (sort === 'my-reviews') {
      // For my-reviews, we still want to get newest first from the API
      queryParams.append('sort', 'newest');
    }
    
    if (ratingFilter) queryParams.append('rating', ratingFilter);
    
    // Add pagination parameters
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    // Build URL with query parameters
    const url = `${API_ENDPOINTS.BOOKS.REVIEWS(bookId)}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(apiKey && { 'X-API-Key': apiKey })
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch reviews');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching book reviews:', error);
    throw error;
  }
};

// Get average rating for a specific book
export const getBookRating = async (bookId) => {
  try {
    if (!bookId) {
      throw new Error('Book ID is required');
    }
    
    const response = await fetch(API_ENDPOINTS.BOOKS.RATING(bookId));

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch book rating');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching book rating:', error);
    throw error;
  }
};

// Submit a new review for a book
export const submitBookReview = async (bookId, rating, comment = '') => {
  try {
    if (!bookId) {
      throw new Error('Book ID is required');
    }
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Validate comment length if provided
    if (comment && comment.length > 200) {
      throw new Error('Review text must be under 200 characters');
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to submit a review');
    }

    const response = await fetch(API_ENDPOINTS.BOOKS.REVIEWS(bookId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rating,
        comment: comment.trim() // Use empty string if comment is not provided
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit review');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting book review:', error);
    throw error;
  }
};

// Get all reviews for current user
export const getUserReviews = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to view your reviews');
    }

    const response = await fetch(`${API_BASE_URL}/reviews/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user reviews');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
};

// Delete a specific review
export const deleteReview = async (reviewId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to delete a review');
    }

    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete review');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}; 