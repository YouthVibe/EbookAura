const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const bookId = process.argv[2] || '681647e41a7f345409452ab2'; // Example book ID
const token = process.argv[3] || 'YOUR_AUTH_TOKEN'; // JWT Token

if (token === 'YOUR_AUTH_TOKEN') {
  console.error('Please provide a valid JWT token as the third argument');
  console.log('Usage: node test-review-post.js [bookId] [jwtToken]');
  process.exit(1);
}

// Test data
const reviewData = {
  rating: 5,
  comment: 'This is a test review from the test script. Great book!'
};

async function testPostReview() {
  try {
    console.log(`Testing POST review for book ID: ${bookId}`);
    console.log(`Using API URL: ${API_URL}`);
    
    const response = await axios.post(
      `${API_URL}/books/${bookId}/reviews`,
      reviewData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Review posted successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`Review ID: ${response.data._id}`);
    return true;
  } catch (error) {
    console.error('Error posting review:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return false;
  }
}

// Run the test
testPostReview()
  .then(success => {
    if (success) {
      console.log('Test completed successfully');
    } else {
      console.log('Test failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
    process.exit(1);
  }); 