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
const { protect } = require('../middleware/auth');
const Book = require('../models/Book');

// Public routes
router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/:id', getBook);
router.post('/:id/download', incrementDownloads);

// Review routes
router.get('/:bookId/reviews', getBookReviews);
router.get('/:bookId/rating', getBookRating);
router.post('/:bookId/reviews', protect, createBookReview);

// Add an endpoint to serve the PDF with proper content type
router.get('/:id/pdf', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
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
    }
    
    // Set appropriate headers based on whether this is a download or view request
    res.setHeader('Content-Type', 'application/pdf');
    
    if (isDownload) {
      // For downloads, use attachment disposition
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    } else {
      // For viewing, use inline disposition
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    }
    
    // Extract the base Cloudinary URL without any transformation parameters
    let pdfUrl = book.pdfUrl;
    // If the URL contains fl_attachment parameter, remove it to ensure proper viewing
    if (pdfUrl.includes('fl_attachment') && !isDownload) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const publicId = book.pdfId;
      pdfUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`;
    }
    
    // Redirect to the Cloudinary PDF URL
    res.redirect(pdfUrl);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ message: 'Error serving PDF', error: error.message });
  }
});

module.exports = router; 