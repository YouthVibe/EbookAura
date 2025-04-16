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
const axios = require('axios');

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
    console.log(`PDF request received for book ID: ${req.params.id}, download: ${req.query.download}, counted: ${req.query.counted}`);
    
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      console.error(`Book not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Book not found' });
    }
    
    console.log(`Found book: ${book.title}, PDF URL: ${book.pdfUrl}, PDF ID: ${book.pdfId}`);
    
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
    
    // Get the PDF URL from the database and add .pdf extension if needed
    let pdfUrl = book.pdfUrl;
    if (!pdfUrl.endsWith('.pdf')) {
      pdfUrl = `${pdfUrl}.pdf`;
    }
    
    console.log(`Using original PDF URL with .pdf extension: ${pdfUrl}`);
    
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
});

// Diagnostic endpoint to test PDF URL parsing
router.get('/test-pdf-url/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Original URL information
    const pdfUrl = book.pdfUrl;
    const pdfId = book.pdfId;
    
    // Create download URL (original + .pdf)
    const downloadUrl = pdfUrl.endsWith('.pdf') ? pdfUrl : `${pdfUrl}.pdf`;
    
    // Create filename
    const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Return diagnostic information
    res.json({
      bookId: book._id,
      title: book.title,
      originalUrl: pdfUrl,
      pdfId: pdfId,
      downloadUrl: downloadUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('Error in PDF URL test endpoint:', error);
    res.status(500).json({ message: 'Error testing PDF URL', error: error.message });
  }
});

// Add a proxy endpoint to fetch PDF content
router.get('/:id/pdf-content', async (req, res) => {
  try {
    console.log(`PDF content request received for book ID: ${req.params.id}`);
    
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      console.error(`Book not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Book not found' });
    }
    
    console.log(`Found book: ${book.title}, fetching PDF content from: ${book.pdfUrl}`);
    
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
      const pdfResponse = await axios.get(book.pdfUrl, {
        responseType: 'arraybuffer'
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
});

module.exports = router; 