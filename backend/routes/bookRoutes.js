const express = require('express');
const router = express.Router();
const {
  getBooks,
  getCategories,
  getTags,
  getBook,
  incrementDownloads
} = require('../controllers/bookController');
const {
  getBookReviews,
  getBookRating,
  createBookReview
} = require('../controllers/reviewController');
const { protect, admin, validateAuth, checkProPlanBookAccess } = require('../middleware/auth');
const { 
  apiKeyAuth, 
  apiKeyReadPermission,
  apiKeyGetPdfPermission,
  apiKeyPostReviewsPermission,
  trackBookSearchUsage,
  trackReviewPostingUsage 
} = require('../middleware/apiKeyAuth');
const Book = require('../models/Book');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to safely get a Subscription model
const getSubscriptionModel = () => {
  // First check if the model is already registered with mongoose
  if (mongoose.models.Subscription) {
    return mongoose.models.Subscription;
  }
  
  // If not found, try to require one of the models
  try {
    return require('../models/Subscription');
  } catch (mainErr) {
    try {
      return require('../models/subscriptionModel');
    } catch (altErr) {
      console.error('Could not load any Subscription model:', altErr);
      return null;
    }
  }
};

// Authentication middleware that supports both JWT and API key auth
const flexAuth = async (req, res, next) => {
  // Allow request to proceed without authentication for public routes
  // We'll check for auth only when needed for premium content
  next();
};

// Public routes - no authentication required
router.get('/', flexAuth, getBooks);
router.get('/categories', getCategories);
router.get('/tags', getTags);

// Get single book - flex auth (will check auth if needed for premium)
// Note that checkProPlanBookAccess middleware is added to scan for pro plan access
router.get('/:id', flexAuth, checkProPlanBookAccess, getBook);

// Increment download count - no authentication needed
router.post('/:id/download', incrementDownloads);

// Review routes
router.get('/:bookId/reviews', getBookReviews);
router.get('/:bookId/rating', getBookRating);

// Create review route - requires authentication and checks permissions for API keys
router.post('/:bookId/reviews', flexAuth, async (req, res, next) => {
  // If using API key, check for review posting permission and track usage
  if (req.apiKey) {
    return apiKeyPostReviewsPermission(req, res, async (err) => {
      if (err) return next(err);
      trackReviewPostingUsage(req, res, async (err) => {
        if (err) return next(err);
        // Call the actual controller
        createBookReview(req, res, next);
      });
    });
  } else {
    // JWT authenticated user without limits
    createBookReview(req, res, next);
  }
});

// PDF routes - public access without authentication
router.get('/:id/pdf', servePdf);

// Proxy endpoint to fetch PDF content - public access
router.get('/:id/pdf-content', servePdfContent);

// Function to serve PDF
async function servePdf(req, res) {
  try {
    console.log(`PDF request received for book ID: ${req.params.id}, download: ${req.query.download}, counted: ${req.query.counted}`);
    
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      console.error(`Book not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Book not found' });
    }
    
    console.log(`Found book: ${book.title}, PDF URL: ${book.pdfUrl}, PDF ID: ${book.pdfId}, isCustomUrl: ${book.isCustomUrl}, isPremium: ${book.isPremium}`);
    
    // Check if the book is premium and require authentication
    if (book.isPremium) {
      // Check if user is authenticated via token or API key
      const token = req.headers.authorization?.split(' ')[1];
      const apiKey = req.headers['x-api-key'];
      
      if (!token && !apiKey) {
        console.log('Premium content access denied: No authentication provided');
        return res.status(401).json({ 
          message: 'Authentication required to access premium content',
          isPremium: true
        });
      }
      
      // If token is provided, verify it
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = decoded;
          console.log(`User ${decoded._id} accessing premium content`);
          
          // Check if user has purchased the book or has Pro plan access
          const user = await User.findById(decoded._id);
          
          if (user) {
            // Check for book in user's purchased books
            const hasPurchased = user.purchasedBooks && user.purchasedBooks.some(id => 
              id.toString() === book._id.toString()
            );
            
            // If user hasn't purchased this specific book, check for Pro plan access
            if (!hasPurchased) {
              // Get the Subscription model
              const SubscriptionToUse = getSubscriptionModel();
              
              if (!SubscriptionToUse) {
                console.error('Could not find valid Subscription model');
                return res.status(403).json({
                  message: 'You need to purchase this book to access it',
                  isPremium: true
                });
              }
              
              // Check for active Pro subscription
              const subscription = await SubscriptionToUse.findOne({
                user: decoded._id,
                status: 'active'
              }).populate('plan');
              
              // Check for expired/canceled Pro subscription
              const pastProSubscription = !subscription ? await SubscriptionToUse.findOne({
                user: decoded._id,
                status: { $in: ['expired', 'canceled'] }
              }).populate('plan') : null;
              
              // Check if current or past subscription is a Pro plan
              const hasProAccess = (subscription && subscription.plan && 
                                    subscription.plan.name && 
                                    subscription.plan.name.toLowerCase().includes('pro') || 
                                    (subscription.plan.benefits && 
                                     subscription.plan.benefits.maxPremiumBooks === Infinity)) ||
                                  (pastProSubscription && pastProSubscription.plan && 
                                   pastProSubscription.plan.name && 
                                   pastProSubscription.plan.name.toLowerCase().includes('pro') || 
                                   (pastProSubscription.plan.benefits && 
                                    pastProSubscription.plan.benefits.maxPremiumBooks === Infinity));
              
              if (hasProAccess) {
                console.log(`User ${decoded._id} granted access to premium book through Pro plan`);
              } else if (!hasPurchased) {
                console.log(`User ${decoded._id} has not purchased this premium book and has no Pro access`);
                return res.status(403).json({
                  message: 'You need to purchase this book or have a Pro subscription to access it',
                  isPremium: true
                });
              }
            }
          }
        } catch (error) {
          console.log('Premium content access denied: Invalid token');
          return res.status(401).json({ 
            message: 'Invalid authentication token',
            isPremium: true
          });
        }
      }
      
      // If API key is provided, verify it
      if (apiKey && !req.user) {
        try {
          // This would need the actual API key verification logic
          // For now, we'll assume it's handled by a middleware
          // but we'd need to implement the check here
          console.log('API key authentication for premium content not fully implemented');
          return res.status(401).json({ 
            message: 'Premium content requires full authentication',
            isPremium: true
          });
        } catch (error) {
          console.log('Premium content access denied: Invalid API key');
          return res.status(401).json({ 
            message: 'Invalid API key',
            isPremium: true
          });
        }
      }
    }
    
    // Get filename
    const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Check if this is a download request
    const isDownload = req.query.download === 'true';
    
    // Only increment download count if this is a direct access and not counted yet
    const alreadyCounted = req.query.counted === 'true';
    if (!alreadyCounted && isDownload) {
      book.downloads += 1;
      await book.save();
      console.log(`Incremented download count for book: ${book.title} to ${book.downloads}`);
    }
    
    // Get the PDF URL based on whether it's a custom URL or standard upload
    let pdfUrl;
    if (book.isCustomUrl && book.customURLPDF) {
      // Use the custom URL directly without modification
      pdfUrl = book.customURLPDF;
      console.log(`Using custom PDF URL: ${pdfUrl}`);
    } else {
      // Standard Cloudinary URL
      pdfUrl = book.pdfUrl;
      // Add .pdf extension if needed for standard uploads
      if (!pdfUrl.endsWith('.pdf')) {
        pdfUrl = `${pdfUrl}.pdf`;
      }
      console.log(`Using standard PDF URL with .pdf extension: ${pdfUrl}`);
    }
    
    // Set appropriate headers based on whether this is a download or view request
    res.setHeader('Content-Type', 'application/pdf');
    
    if (isDownload) {
      // For downloads, use attachment disposition
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      console.log(`Set for download: ${fileName}`);
    } else {
      // For viewing, use inline disposition
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      console.log(`Set for viewing: ${fileName}`);
    }
    
    // Redirect to the processed PDF URL
    console.log(`Redirecting to: ${pdfUrl}`);
    res.redirect(pdfUrl);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ message: 'Error serving PDF', error: error.message });
  }
}

// Function to serve PDF content
async function servePdfContent(req, res) {
  try {
    console.log(`PDF content request received for book ID: ${req.params.id}`);
    
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      console.error(`Book not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Enhanced logging for premium books
    if (book.isPremium) {
      console.log(`Premium book accessed: "${book.title}" (ID: ${book._id}), isPremium: ${book.isPremium}`);
    }
    
    // Check if the book is premium and require authentication
    if (book.isPremium) {
      // Check if user is authenticated via token or API key
      const token = req.headers.authorization?.split(' ')[1];
      const apiKey = req.headers['x-api-key'];
      
      if (!token && !apiKey) {
        console.log('Premium content access denied: No authentication provided');
        return res.status(401).json({ 
          message: 'Authentication required to access premium content',
          isPremium: true
        });
      }
      
      // If token is provided, verify it
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = decoded;
          console.log(`User ${decoded._id} accessing premium content`);
          
          // Check if user has purchased the book or has Pro plan access
          const user = await User.findById(decoded._id);
          
          if (user) {
            // Check for book in user's purchased books
            const hasPurchased = user.purchasedBooks && user.purchasedBooks.some(id => 
              id.toString() === book._id.toString()
            );
            
            // If user hasn't purchased this specific book, check for Pro plan access
            if (!hasPurchased) {
              // Get the Subscription model
              const SubscriptionToUse = getSubscriptionModel();
              
              if (!SubscriptionToUse) {
                console.error('Could not find valid Subscription model');
                return res.status(403).json({
                  message: 'You need to purchase this book to access it',
                  isPremium: true
                });
              }
              
              // Check for active Pro subscription
              const subscription = await SubscriptionToUse.findOne({
                user: decoded._id,
                status: 'active'
              }).populate('plan');
              
              // Check for expired/canceled Pro subscription
              const pastProSubscription = !subscription ? await SubscriptionToUse.findOne({
                user: decoded._id,
                status: { $in: ['expired', 'canceled'] }
              }).populate('plan') : null;
              
              // Check if current or past subscription is a Pro plan
              const hasProAccess = (subscription && subscription.plan && 
                                    subscription.plan.name && 
                                    subscription.plan.name.toLowerCase().includes('pro') || 
                                    (subscription.plan.benefits && 
                                     subscription.plan.benefits.maxPremiumBooks === Infinity)) ||
                                  (pastProSubscription && pastProSubscription.plan && 
                                   pastProSubscription.plan.name && 
                                   pastProSubscription.plan.name.toLowerCase().includes('pro') || 
                                   (pastProSubscription.plan.benefits && 
                                    pastProSubscription.plan.benefits.maxPremiumBooks === Infinity));
              
              if (hasProAccess) {
                console.log(`User ${decoded._id} granted access to premium book through Pro plan`);
              } else if (!hasPurchased) {
                console.log(`User ${decoded._id} has not purchased this premium book and has no Pro access`);
                return res.status(403).json({
                  message: 'You need to purchase this book or have a Pro subscription to access it',
                  isPremium: true
                });
              }
            }
          }
        } catch (error) {
          console.log('Premium content access denied: Invalid token');
          return res.status(401).json({ 
            message: 'Invalid authentication token',
            isPremium: true
          });
        }
      }
      
      // If API key is provided, verify it
      if (apiKey && !req.user) {
        // Similar logic as above - would need verification
        console.log('API key authentication for premium content not fully implemented');
        return res.status(401).json({ 
          message: 'Premium content requires full authentication',
          isPremium: true
        });
      }
    }
    
    // Get the PDF URL based on whether it's a custom URL or standard upload
    let pdfUrl;
    if (book.isCustomUrl && book.customURLPDF) {
      // Use the custom URL directly without modification
      pdfUrl = book.customURLPDF;
      console.log(`Using custom PDF URL: ${pdfUrl}`);
    } else {
      // Standard Cloudinary URL
      pdfUrl = book.pdfUrl;
      // Add .pdf extension if needed for standard uploads
      if (!pdfUrl.endsWith('.pdf')) {
        pdfUrl = `${pdfUrl}.pdf`;
      }
      console.log(`Using standard PDF URL: ${pdfUrl}`);
    }
    
    console.log(`Found book: ${book.title}, fetching PDF content from: ${pdfUrl}`);
    
    // Check if this is a download request (for download counter)
    const isDownload = req.query.download === 'true';
    
    // Only increment download count if this is a direct access and not counted yet
    const alreadyCounted = req.query.counted === 'true';
    if (!alreadyCounted && isDownload) {
      book.downloads += 1;
      await book.save();
      console.log(`Incremented download count for book: ${book.title} to ${book.downloads}`);
    }
    
    // Fetch the PDF content
    try {
      const pdfResponse = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        headers: {
          // Add common headers to help with various services
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/pdf,*/*'
        },
        // Increase timeout for large files or slow servers
        timeout: 30000
      });
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfResponse.data.length);
      
      // Return the PDF content
      return res.send(pdfResponse.data);
    } catch (fetchError) {
      console.error('Error fetching PDF content:', fetchError);
      return res.status(500).json({ 
        message: 'Error fetching PDF content', 
        error: fetchError.message 
      });
    }
  } catch (error) {
    console.error('Error in PDF content endpoint:', error);
    res.status(500).json({ message: 'Error serving PDF content', error: error.message });
  }
}

// Diagnostic endpoint to test PDF URL parsing
router.get('/test-pdf-url/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Get the PDF URL based on the URL type
    let pdfUrl;
    let pdfType;
    
    if (book.isCustomUrl && book.customURLPDF) {
      // Custom URL
      pdfUrl = book.customURLPDF;
      pdfType = "custom";
    } else {
      // Standard Cloudinary URL
      pdfUrl = book.pdfUrl;
      // Add .pdf extension if needed for standard uploads
      if (!pdfUrl.endsWith('.pdf')) {
        pdfUrl = `${pdfUrl}.pdf`;
      }
      pdfType = "standard";
    }
    
    // Create filename
    const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Return diagnostic information
    res.json({
      bookId: book._id,
      title: book.title,
      originalUrl: book.pdfUrl,
      pdfId: book.pdfId,
      isCustomUrl: book.isCustomUrl || false,
      customURLPDF: book.customURLPDF || '',
      effectiveUrl: pdfUrl,
      urlType: pdfType,
      fileName: fileName
    });
  } catch (error) {
    console.error('Error in PDF URL test endpoint:', error);
    res.status(500).json({ message: 'Error testing PDF URL', error: error.message });
  }
});

module.exports = router; 