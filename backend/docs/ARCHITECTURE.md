# EbookAura Backend Architecture

## Overview

EbookAura is a full-featured ebook management and reading platform with both frontend and backend components. The backend is built with Node.js and Express, providing a RESTful API for the frontend application. This document explains the architecture, components, and workflow of the backend system.

## System Architecture

The EbookAura backend follows a modular architecture with the following main components:

```
EbookAura/
├── backend/                  # Backend root directory
│   ├── config/               # Configuration files
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Express middleware
│   ├── models/               # Database models (Mongoose)
│   ├── routes/               # API route definitions
│   ├── scripts/              # Utility scripts
│   ├── utils/                # Helper functions
│   ├── temp/                 # Temporary file storage
│   ├── out/                  # Static frontend build files
│   ├── server.js             # Main server entry point
│   └── .env                  # Environment variables
```

## Core Technologies

The backend is built with the following technologies:

- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling tool
- **JWT**: JSON Web Tokens for authentication
- **Cloudinary**: Cloud storage for books and images
- **Nodemailer**: Email service integration
- **Socket.io**: Real-time communication

## Key Components

### Server Configuration

The main `server.js` file initializes the Express application, connects to MongoDB, configures middleware, and sets up routes. It also handles static file serving for the frontend application.

### API Routes

Routes are defined in the `routes/` directory, organized by resource type:

- **authRoutes.js**: Authentication endpoints
- **userRoutes.js**: User management endpoints
- **bookRoutes.js**: Book management endpoints
- **uploadRoutes.js**: File upload endpoints
- **reviewRoutes.js**: Book review endpoints
- **bookmarkRoutes.js**: User bookmark endpoints
- **adminRoutes.js**: Admin-only endpoints
- **apiKeyRoutes.js**: API key management
- **coinRoutes.js**: Virtual currency management
- **subscriptionRoutes.js**: Premium subscription management

### Controllers

Controllers in the `controllers/` directory implement the business logic for each endpoint:

- **userController.js**: User account management logic
- **bookController.js**: Book CRUD and search functionality
- **uploadController.js**: File handling and Cloudinary integration
- **reviewController.js**: Book reviews and ratings
- **adminController.js**: Administrative functions
- **apiKeyController.js**: API key management for integrations
- **coinController.js**: Virtual currency transactions
- **subscriptionController.js**: Premium subscription processing

### Models

Models define the database schema using Mongoose:

- **User.js**: User profile and authentication data
- **Book.js**: Book metadata and file references
- **Review.js**: Book reviews and ratings
- **Bookmark.js**: User bookmarks
- **Purchase.js**: Book purchase records
- **Subscription.js**: User subscription status
- **ApiKey.js**: API key details for external access

### Middleware

Custom middleware handles cross-cutting concerns:

- **authMiddleware.js**: Authentication and authorization
- **errorHandler.js**: Centralized error handling
- **apiKeyAuth.js**: API key validation
- **subscriptionVerification.js**: Premium content access control

## Data Flow

1. Client requests come through the Express server
2. Requests are routed to the appropriate endpoint handler
3. Middleware authenticates and authorizes the request
4. Controllers process the request and interact with models
5. Models interact with the MongoDB database
6. Controllers format the response and send it back to the client

## Authentication System

EbookAura uses a JWT-based authentication system:

1. Users register or log in to receive a JWT token
2. Tokens are stored in HTTP-only cookies for security
3. Protected routes verify the JWT token before proceeding
4. Roles (user, admin) determine access permissions

## File Storage

Book files and images are stored in Cloudinary:

1. Files are uploaded to a temporary directory
2. The upload controller processes and uploads files to Cloudinary
3. Metadata and Cloudinary references are stored in MongoDB
4. Files are served from Cloudinary with appropriate security measures

## Premium Book System

The platform supports free and premium (paid) ebooks:

1. Books can be marked as premium with a price in coins
2. Users can purchase coins with real money
3. Users spend coins to purchase premium books
4. Purchased books are added to the user's library

## Deployment

The backend is designed to be deployed to Render.com with specific optimizations:

1. Automatic static file detection and serving
2. Maintenance page for deployment transitions
3. Scripts to fix common deployment issues
4. Environment-aware configuration

## Error Handling

Errors are handled centrally with:

1. Custom error handler middleware
2. Consistent error response format
3. Detailed logging for debugging
4. User-friendly error messages 