const express = require('express');
const router = express.Router();
const { uploadFile, deleteFile, uploadPdf, deleteBook } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/', protect, uploadFile);
router.delete('/:publicId', protect, deleteFile);
router.post('/pdf', protect, uploadPdf);
router.delete('/book/:id', protect, deleteBook);

module.exports = router; 