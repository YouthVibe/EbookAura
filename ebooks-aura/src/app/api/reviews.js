/**
 * API functions for handling book reviews
 */

// Get all reviews for a specific book
export const getBookReviews = async (bookId) => {
  try {
    if (!bookId) {
      throw new Error('Book ID is required');
    }
    
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    const response = await fetch(`/api/books/${bookId}/reviews`, {
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
    
    const response = await fetch(`/api/books/${bookId}/rating`);

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
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('You must be logged in to submit a review');
    }

    const response = await fetch(`/api/books/${bookId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
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
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('You must be logged in to view your reviews');
    }

    const response = await fetch(`/api/reviews/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
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
    const apiKey = localStorage.getItem('apiKey');
    
    if (!token || !apiKey) {
      throw new Error('You must be logged in to delete a review');
    }

    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': apiKey
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