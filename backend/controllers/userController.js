/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const Review = require('../models/Review');
const Bookmark = require('../models/Bookmark');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, fullName, bio } = req.body;

    // Validation
    if (!name || !email || !password || !fullName) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Check if permanent user exists with this email
    const permanentUser = await User.findOne({ email });
    if (permanentUser) {
      return res.status(400).json({ message: 'Email already registered. Please login instead.' });
    }

    // Check if there's a pending verification for this email
    let tempUser = await TempUser.findOne({ email });
    
    if (tempUser) {
      // Update existing temp user info
      tempUser.name = name;
      tempUser.fullName = fullName;
      tempUser.password = password;
      
      // Generate new verification code
      const verificationCode = tempUser.generateVerificationCode();
      
      await tempUser.save();
      
      // Send verification email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: tempUser.email,
        subject: 'Email Verification - EbookAura',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
              <div style="background-color: #f8f8f8; padding: 20px;">
                <h2 style="color: #333;">Hello ${tempUser.fullName},</h2>
                <p style="color: #555;">Please use the verification code below to verify your email address:</p>
                <div style="background-color: #e9f7ef; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0; text-align: center;">
                  <p style="color: #155724; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${verificationCode}</p>
                </div>
                <p style="color: #555;">This code will expire in 24 hours.</p>
                <p style="color: #555; margin-top: 20px;">If you did not create an account, please ignore this email.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
                  <p>EbookAura - Your e-book platform</p>
                </div>
              </div>
            </body>
          </html>
        `
      };
      
      await transporter.sendMail(mailOptions);
      
      return res.status(201).json({ 
        message: 'Registration successful. Please check your email for verification code.', 
        email
      });
    } else {
      // Create new temporary user
      tempUser = new TempUser({
        name,
        fullName,
        email,
        password,
      });
      
      // Generate verification code
      const verificationCode = tempUser.generateVerificationCode();
      
      await tempUser.save();
      
      // Send verification email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification - EbookAura',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
              <div style="background-color: #f8f8f8; padding: 20px;">
                <h2 style="color: #333;">Hello ${fullName},</h2>
                <p style="color: #555;">Please use the verification code below to verify your email address:</p>
                <div style="background-color: #e9f7ef; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0; text-align: center;">
                  <p style="color: #155724; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${verificationCode}</p>
                </div>
                <p style="color: #555;">This code will expire in 24 hours.</p>
                <p style="color: #555; margin-top: 20px;">If you did not create an account, please ignore this email.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
                  <p>EbookAura - Your e-book platform</p>
                </div>
              </div>
            </body>
          </html>
        `
      };
      
      await transporter.sendMail(mailOptions);
      
      res.status(201).json({ message: 'Registration successful. Please check your email for verification code.', email });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify email with code
// @route   POST /api/users/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Please provide email and verification code' });
    }
    
    // Find the temporary user
    const tempUser = await TempUser.findOne({ email });
    
    if (!tempUser) {
      return res.status(404).json({ message: 'User not found or verification expired' });
    }
    
    // Check if the code is correct
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
      
    if (hashedCode !== tempUser.verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Check if the code is expired
    if (Date.now() > tempUser.verificationExpires) {
      return res.status(400).json({ message: 'Verification code expired' });
    }
    
    // Create a permanent user account
    // Set the password directly without pre-save hook (it's already hashed in TempUser)
    const newUser = new User({
      name: tempUser.name,
      fullName: tempUser.fullName,
      email: tempUser.email,
      isEmailVerified: true,
    });
    
    // Set the password directly to avoid double hashing
    newUser.password = tempUser.password;
    
    // Disable password hashing for this save only
    newUser.$skipPasswordHashing = true;
    
    await newUser.save();
    
    // Delete the temporary user
    await TempUser.findByIdAndDelete(tempUser._id);
    
    // Generate JWT token
    const token = generateToken(newUser._id);
    
    res.status(200).json({
      _id: newUser._id,
      name: newUser.name,
      fullName: newUser.fullName,
      email: newUser.email,
      isEmailVerified: newUser.isEmailVerified,
      isAdmin: newUser.isAdmin,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user and get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support for assistance.' });
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      isAdmin: user.isAdmin,
      coins: user.coins,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      isAdmin: user.isAdmin,
      coins: user.coins,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Update user fields
    user.name = req.body.name || user.name;
    user.fullName = req.body.fullName || user.fullName;
    user.bio = req.body.bio || user.bio;
    
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      bio: updatedUser.bio,
      isEmailVerified: updatedUser.isEmailVerified,
      profileImage: updatedUser.profileImage,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update profile image
// @route   PUT /api/users/profile/image
// @access  Private
const updateProfileImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const file = req.files.image;
    
    // Check if file is an image
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid image type. Please upload a JPEG, PNG, GIF, or WebP image.' 
      });
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size should be less than 5MB' });
    }
    
    // Delete previous profile image if it exists
    if (user.profileImageId) {
      try {
        await cloudinary.uploader.destroy(user.profileImageId);
      } catch (cloudinaryError) {
        console.error('Error deleting previous image from Cloudinary:', cloudinaryError);
        // Continue with upload even if delete fails
      }
    }
    
    // Upload image to cloudinary
    try {
      console.log('Attempting to upload file to Cloudinary:', {
        tempFilePath: file.tempFilePath,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'ebook_aura/profile_images',
        transformation: [
          { width: 500, height: 500, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      
      console.log('Cloudinary upload successful:', result);
      
      // Update user profile image
      user.profileImage = result.secure_url;
      user.profileImageId = result.public_id;
      
      await user.save();
      
      // Remove temp file
      try {
        fs.unlinkSync(file.tempFilePath);
      } catch (unlinkError) {
        console.error('Error removing temp file:', unlinkError);
        // Don't fail the request if temp file cleanup fails
      }
      
      res.status(200).json({ 
        message: 'Profile image updated successfully',
        profileImage: user.profileImage
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      res.status(500).json({ 
        message: 'Error uploading image to cloud storage',
        error: cloudinaryError.message
      });
    }
  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }
    
    // Generate reset password token
    const resetToken = user.generateResetPasswordToken();
    await user.save();
    
    // Create reset URL
    const resetUrl = `${req.protocol}://localhost:3000/reset-password?token=${resetToken}&email=${email}`;
    
    // Send email with reset link
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - EbookAura',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
            <div style="background-color: #f8f8f8; padding: 20px;">
              <h2 style="color: #333;">Hello ${user.fullName},</h2>
              <p style="color: #555;">You have requested to reset your password. Please click the link below to set a new password:</p>
              <div style="margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #ff4444; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #555;">This link will expire in 1 hour.</p>
              <p style="color: #555; margin-top: 20px;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
                <p>EbookAura - Your e-book platform</p>
              </div>
            </div>
          </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;
    
    if (!token || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with the token
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Set the new password
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }
    
    // Check if there's a pending verification for this email
    const tempUser = await TempUser.findOne({ email });
    
    if (!tempUser) {
      return res.status(404).json({ message: 'No pending verification found for this email' });
    }
    
    // Generate new verification code
    const verificationCode = tempUser.generateVerificationCode();
    
    await tempUser.save();
    
    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tempUser.email,
      subject: 'Email Verification - EbookAura',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
            <div style="background-color: #f8f8f8; padding: 20px;">
              <h2 style="color: #333;">Hello ${tempUser.fullName},</h2>
              <p style="color: #555;">Please use the verification code below to verify your email address:</p>
              <div style="background-color: #e9f7ef; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="color: #155724; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${verificationCode}</p>
              </div>
              <p style="color: #555;">This code will expire in 24 hours.</p>
              <p style="color: #555; margin-top: 20px;">If you did not create an account, please ignore this email.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
                <p>EbookAura - Your e-book platform</p>
              </div>
            </div>
          </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot password with verification code
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPasswordWithCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the code for storage (for security)
    const hashedCode = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');
    
    // Set the reset token and expiry
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Send email with verification code
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Code - EbookAura',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
            <div style="background-color: #f8f8f8; padding: 20px;">
              <h2 style="color: #333;">Hello ${user.fullName},</h2>
              <p style="color: #555;">You requested a password reset for your EbookAura account.</p>
              <p style="color: #555;">Please use the verification code below to reset your password:</p>
              <div style="background-color: #e9f7ef; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="color: #155724; font-size: 24px; font-weight: bold; letter-spacing: 5px;">${verificationCode}</p>
              </div>
              <p style="color: #555;">This code will expire in 1 hour.</p>
              <p style="color: #555; margin-top: 20px;">If you did not request this reset, please ignore this email.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
                <p>EbookAura - Your e-book platform</p>
              </div>
            </div>
          </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Password reset code sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password with verification code
// @route   POST /api/users/reset-password-with-code
// @access  Public
const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    
    if (!email || !code || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Hash the code for comparison
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
    
    // Find user with the verification code
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Set the new password
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user profile image from Cloudinary if exists
    if (user.profileImageId) {
      try {
        await cloudinary.uploader.destroy(user.profileImageId);
        console.log(`Deleted profile image with ID ${user.profileImageId} from Cloudinary`);
      } catch (cloudinaryError) {
        console.error('Error deleting profile image from Cloudinary:', cloudinaryError);
        // Continue with account deletion even if image deletion fails
      }
    }
    
    // Delete all user reviews
    await Review.deleteMany({ user: user._id });
    
    // Delete all user bookmarks
    await Bookmark.deleteMany({ user: user._id });
    
    // Delete the user account
    await User.findByIdAndDelete(user._id);
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify user password
// @route   POST /api/users/verify-password
// @access  Private
const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    res.status(200).json({ message: 'Password verified' });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if user has purchased a book
// @route   GET /api/users/check-purchase/:bookId
// @access  Private
const checkBookPurchase = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    if (!bookId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Book ID is required' 
      });
    }

    // Find the user with populated purchased books
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if the book is in the user's purchased books array
    const hasPurchased = user.purchasedBooks.some(
      id => id.toString() === bookId
    );
    
    res.status(200).json({
      success: true,
      hasPurchased,
      bookId
    });
    
  } catch (error) {
    console.error('Error checking book purchase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
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
  resetPasswordWithCode,
  deleteAccount,
  verifyPassword,
  checkBookPurchase
}; 