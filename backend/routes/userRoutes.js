const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  forgotPasswordWithCode,
  resetPasswordWithCode
} = require('../controllers/userController');
const { 
  getUserBookmarks, 
  toggleBookmark, 
  deleteBookmark,
  deleteAllUserBookmarks 
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');
const fileUpload = require('express-fileupload');
const path = require('path');

// Configure file upload for profile images
const fileUploadOptions = {
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '..', 'temp'),
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
};

// Public routes
router.post('/', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password-with-code', forgotPasswordWithCode);
router.post('/reset-password-with-code', resetPasswordWithCode);
router.post('/reset-password', resetPassword);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Apply fileUpload middleware only for the image upload route
router.put('/profile/image', protect, fileUpload(fileUploadOptions), updateProfileImage);

// Bookmark routes
router.get('/bookmarks', protect, getUserBookmarks);
router.post('/bookmarks', protect, toggleBookmark);
router.delete('/bookmarks', protect, deleteBookmark);
router.delete('/bookmarks/all', protect, deleteAllUserBookmarks);

module.exports = router;
 