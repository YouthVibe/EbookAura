const express = require('express');
const router = express.Router();
const { uploadFile, deleteFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/', protect, uploadFile);
router.delete('/:publicId', protect, deleteFile);

module.exports = router; 