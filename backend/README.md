# EbookAura Backend

This is the backend API for the EbookAura application with authentication system and Cloudinary integration.

## Features

- User authentication with JWT
- Email verification
- Password reset functionality
- Profile management
- Cloudinary integration for file uploads
- Error handling middleware

## Getting Started

### Prerequisites

- Node.js (>=14.x)
- MongoDB
- Gmail account (for sending emails)
- Cloudinary account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_gmail_email
   EMAIL_PASS=your_gmail_app_password
   NODE_ENV=development
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication

- `POST /api/users` - Register a new user
- `POST /api/users/verify-email` - Verify email with code
- `POST /api/users/login` - Login user
- `POST /api/users/forgot-password` - Request password reset
- `PUT /api/users/reset-password/:resetToken` - Reset password
- `POST /api/users/resend-verification` - Resend verification email

### User Profile

- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `PUT /api/users/profile/image` - Update profile image (protected)

### File Upload

- `POST /api/upload` - Upload a file to Cloudinary (protected)
- `DELETE /api/upload/:publicId` - Delete a file from Cloudinary (protected)

## Authentication Flow

1. User registers with email, name, and password
2. A verification code is sent to the user's email
3. User verifies email with the code
4. User can now login with email and password
5. Upon login, a JWT token is issued for authentication

## Cloudinary Integration

The backend integrates with Cloudinary for file storage:

- Profile image uploads
- General file uploads
- Automatic cleaning of temporary files
- Secure URL generation for uploaded files 