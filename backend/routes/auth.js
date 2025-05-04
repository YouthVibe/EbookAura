const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createTransporter } = require('../config/email');
const { protect, validateAuth } = require('../middleware/auth');
const { loginUser } = require('../controllers/userController');

// Add login endpoint
router.post('/login', loginUser);

// Auth check route - returns 200 if authenticated, 401 if not
router.get('/check', protect, (req, res) => {
  res.status(200).json({ 
    isAuthenticated: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// Enhanced auth check route - validates both token and API key
router.get('/validate', validateAuth, (req, res) => {
  res.status(200).json({ 
    isAuthenticated: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin
    }
  });
});

// Password reset routes - using verification code
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code hash and expiry (15 minutes from now)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 900000; // 15 minutes
    
    await user.save();
    
    // Send email with verification code
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'EbookAura Password Reset Code',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your EbookAura account.</p>
        <p>Your verification code is:</p>
        <h2 style="font-size: 28px; background-color: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 5px;">${verificationCode}</h2>
        <p>Enter this code on the password reset page to continue.</p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this reset, please ignore this email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Verification code sent to your email',
      email: email // Return email for frontend to use in reset form
    });
  } catch (error) {
    console.error('Request reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify code separate from actual password reset
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    
    // Hash the provided code to compare with stored token
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
    
    // Find user by email and valid token
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Code is valid, return success (but don't reset password yet)
    res.status(200).json({ 
      message: 'Verification code validated',
      isValid: true,
      email: email
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    
    if (!email || !code || !password) {
      return res.status(400).json({ message: 'Email, verification code, and new password are required' });
    }
    
    // Hash the provided code to compare with stored token
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
    
    // Find user by email and valid token
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Set new password (model will hash it)
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 