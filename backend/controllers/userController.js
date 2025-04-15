const User = require('../models/User');
const TempUser = require('../models/TempUser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

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
    const newUser = new User({
      name: tempUser.name,
      fullName: tempUser.fullName,
      email: tempUser.email,
      password: tempUser.password, // Already hashed in the TempUser model
      isEmailVerified: true
    });
    
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
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
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
    
    // Delete previous profile image if it exists
    if (user.profileImageId) {
      await cloudinary.uploader.destroy(user.profileImageId);
    }
    
    const file = req.files.image;
    
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'ebook_aura/profile_images',
      width: 500,
      crop: 'scale'
    });
    
    // Update user profile image
    user.profileImage = result.secure_url;
    user.profileImageId = result.public_id;
    
    await user.save();
    
    // Remove temp file
    fs.unlinkSync(file.tempFilePath);
    
    res.status(200).json({ 
      message: 'Profile image updated successfully',
      profileImage: user.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    // Generate reset password token
    const resetToken = user.generateResetPasswordToken();
    await user.save();
    
    // Send email with reset link
    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - EbookAura',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
            <div style="background-color: #f8f8f8; padding: 20px;">
              <h2 style="color: #333;">Hello ${user.fullName},</h2>
              <p style="color: #555;">You have requested to reset your password. Please click the link below to reset your password:</p>
              <div style="margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
              </div>
              <p style="color: #555;">This link will expire in 1 hour.</p>
              <p style="color: #555; margin-top: 20px;">If you did not request a password reset, please ignore this email.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
                <p>EbookAura - Your e-book platform</p>
              </div>
            </div>
          </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/users/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;
    
    if (!password) {
      return res.status(400).json({ message: 'Please provide a new password' });
    }
    
    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    // Find user with the hashed token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
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

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  forgotPassword,
  resetPassword,
  resendVerificationEmail
}; 