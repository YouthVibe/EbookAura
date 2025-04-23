# EbookAura

EbookAura is a full-stack web application for discovering, managing, and reading ebooks. The platform offers a user-friendly interface for browsing books, creating bookmarks, purchasing premium content with a virtual currency system, and downloading content.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up the Backend](#setting-up-the-backend)
  - [Setting Up the Frontend](#setting-up-the-frontend)
- [Architecture](#architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [User Flows](#user-flows)
- [User Authentication](#user-authentication)
- [File Storage](#file-storage)
- [Premium Content System](#premium-content-system)
- [Virtual Currency System](#virtual-currency-system)
- [Review System](#review-system)
- [Deployment](#deployment)
  - [Static Site Generation](#static-site-generation)
  - [Windows Deployment](#windows-deployment)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

EbookAura is designed to provide users with a seamless experience for discovering, accessing, and managing ebooks. The application combines modern frontend technologies with a robust backend to deliver features such as user authentication, book browsing, bookmarking, ratings and reviews, premium content access, and a virtual currency system.

## Features

- **User Authentication**
  - Registration with email verification
  - Secure login with JWT
  - Password recovery/reset
  - User profile management

- **Book Management**
  - Browse book catalog with filtering and sorting options
  - Search functionality by title, author, or content
  - View book details including ratings and reviews
  - Bookmark favorite books
  - Download PDF books

- **Premium Content**
  - Premium books with restricted access
  - Purchase system using virtual coins
  - User ownership tracking

- **Virtual Currency (Coins)**
  - Daily login rewards
  - Ad-watching rewards
  - Purchasing premium content
  - Transaction history

- **Social Features**
  - Rate books (1-5 stars)
  - Write and read reviews
  - See average ratings and review counts
  - User-friendly review management (show user's existing review)
  - Prevention of duplicate reviews from the same user

- **Content Upload** (Admin/Author)
  - Upload PDF books with cover images
  - Set books as premium with pricing
  - Add book metadata (title, author, description, tags)

- **Responsive Design**
  - Mobile-friendly interface
  - Adaptive layout for different screen sizes

## Project Structure

This repository contains both the frontend and backend components of the EbookAura application:

### Frontend (`ebooks-aura/`)

```
ebooks-aura/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API client functions
│   │   ├── books/          # Book pages
│   │   │   └── [id]/       # Book details page
│   │   ├── bookmarks/      # Bookmarks page
│   │   ├── coins/          # Virtual currency page
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── login/          # Login page
│   │   ├── profile/        # User profile pages
│   │   │   └── upload-pdf/ # PDF upload page
│   │   ├── register/       # Registration page
│   │   ├── search/         # Search page
│   │   ├── settings/       # User settings page
│   │   ├── utils/          # Utility functions
│   │   ├── globals.css     # Global styles
│   │   └── layout.js       # Root layout
│   └── pages/              # Additional pages (if any)
├── .env                    # Environment variables
├── .env.example            # Example environment file
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
└── README.md               # Frontend documentation
```

### Backend

```
backend/
├── config/                 # Configuration files
├── controllers/            # API controllers
│   ├── authController.js   # Authentication logic
│   ├── bookController.js   # Book management logic
│   ├── coinController.js   # Virtual currency logic
│   ├── reviewController.js # Reviews logic
│   ├── uploadController.js # File upload logic
│   └── userController.js   # User management logic
├── middleware/             # Custom middleware
│   ├── auth.js             # Authentication middleware
│   └── error.js            # Error handling middleware
├── models/                 # Database models
│   ├── Book.js             # Book schema
│   ├── Review.js           # Review schema
│   └── User.js             # User schema
├── routes/                 # API routes
│   ├── authRoutes.js       # Authentication routes
│   ├── bookRoutes.js       # Book management routes
│   ├── coinRoutes.js       # Virtual currency routes
│   ├── reviewRoutes.js     # Reviews routes
│   ├── uploadRoutes.js     # File upload routes
│   └── userRoutes.js       # User management routes
├── scripts/                # Utility scripts
│   └── awardDailyCoins.js  # Daily coin rewards script
├── utils/                  # Utility functions
├── .env                    # Environment variables
├── server.js               # Main application entry
└── package.json            # Dependencies and scripts
```

## Technology Stack

### Frontend
- **Next.js** - React framework for server-side rendering and static site generation
- **React** - JavaScript library for building user interfaces
- **Context API** - For state management
- **CSS Modules** - For component-scoped styling
- **React Icons** - Icon library
- **Axios/Fetch** - For API requests

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Cloud storage for images and PDFs
- **Nodemailer** - Email sending functionality

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- MongoDB (local instance or MongoDB Atlas account)
- Cloudinary account (for file storage)

### Setting Up the Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_SERVICE=your_email_service
   EMAIL_USERNAME=your_email_username
   EMAIL_PASSWORD=your_email_password
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the server:
   - **Windows**: Run the batch file
     ```
     start-server.bat
     ```
   - **Unix/Mac**: 
     ```
     node start-server.js
     ```

The backend server will start on http://localhost:5000 (or the port specified in your .env file).

### Setting Up the Frontend

1. Navigate to the frontend directory:
   ```
   cd ebooks-aura
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Run the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:3000.

## Architecture

### Frontend Architecture

The frontend is built with Next.js using the App Router architecture. It follows a component-based approach where UI elements are broken down into reusable components.

#### Key Components:

- **Layout Component**: Provides the base structure for all pages with the Navbar and common UI elements
- **AuthContext**: Manages user authentication state throughout the application
- **Navbar**: Global navigation component with responsive design
- **BookPageClient**: Renders book details and handles PDF viewing/downloading
- **BookReview**: Manages the review system for books
- **CoinsPage**: Handles the virtual currency transactions and display
- **SearchPage**: Implements the book search and filtering functionality

#### Client-side API Functions:

The `api` directory contains functions that interface with the backend API:
- `auth.js`: Authentication-related API calls
- `books.js`: Book retrieval and management
- `bookmarks.js`: Bookmark management
- `coins.js`: Virtual currency transactions
- `reviews.js`: Book review operations
- `users.js`: User profile management

### Backend Architecture

The backend follows the MVC (Model-View-Controller) pattern:

- **Models**: Define the data structure and business logic
- **Controllers**: Handle the application logic and interact with models
- **Routes**: Define API endpoints and connect them to controllers
- **Middleware**: Handle cross-cutting concerns like authentication

## Data Models

### User Model

```javascript
{
  name: String,            // Username
  fullName: String,        // User's full name
  bio: String,             // User biography
  email: String,           // User email (unique)
  phoneNumber: String,     // User phone number (optional)
  password: String,        // Hashed password
  avatar: String,          // Profile image URL
  isEmailVerified: Boolean, // Email verification status
  coins: Number,           // Virtual currency balance
  lastCoinReward: Date,    // Last daily reward timestamp
  purchasedBooks: [ObjectId], // Books purchased by the user
  emailVerificationToken: String, // For email verification
  emailVerificationExpires: Date, // Token expiration
  resetPasswordToken: String, // For password reset
  resetPasswordExpires: Date, // Token expiration
  profileImage: String,    // Profile image URL
  profileImageId: String,  // Cloudinary image ID
  isAdmin: Boolean,        // Admin status
  isBanned: Boolean,       // Account status
  createdAt: Date          // Account creation timestamp
}
```

### Book Model

```javascript
{
  title: String,           // Book title
  author: String,          // Book author
  description: String,     // Book description
  coverImage: String,      // Cover image URL
  coverImageId: String,    // Cloudinary image ID
  pdfUrl: String,          // PDF file URL
  pdfId: String,           // Cloudinary PDF ID
  isCustomUrl: Boolean,    // Flag for external PDF URLs
  customURLPDF: String,    // External PDF URL if applicable
  isPremium: Boolean,      // Premium content flag
  price: Number,           // Price in coins (if premium)
  pageSize: Number,        // Number of pages
  fileSizeMB: Number,      // File size in MB
  category: String,        // Book category
  tags: [String],          // Book tags
  averageRating: Number,   // Average review rating
  views: Number,           // View count
  downloads: Number,       // Download count
  uploadedBy: ObjectId     // Reference to User who uploaded
}
```

### Review Model

```javascript
{
  user: ObjectId,          // Reference to User
  book: ObjectId,          // Reference to Book
  rating: Number,          // Rating (1-5)
  text: String,            // Review text
  createdAt: Date          // Review timestamp
}
```

## API Endpoints

### Authentication

- **`POST /api/auth/register`**: Register a new user
  - Body: `{ name, fullName, email, password }`
  - Response: User data and JWT token

- **`POST /api/auth/login`**: Log in an existing user
  - Body: `{ email, password }`
  - Response: User data and JWT token

- **`POST /api/auth/verify-email`**: Verify email address
  - Body: `{ email, token }`
  - Response: Success message

- **`POST /api/auth/forgot-password`**: Request password reset
  - Body: `{ email }`
  - Response: Success message

- **`POST /api/auth/reset-password`**: Reset password with token
  - Body: `{ token, password }`
  - Response: Success message

### Books

- **`GET /api/books`**: Get all books
  - Query params: `category`, `tag`, `search`, `sort`, `page`, `limit`, `premium`
  - Response: Books array with pagination

- **`GET /api/books/:id`**: Get a specific book
  - Response: Book details

- **`GET /api/books/categories`**: Get all book categories
  - Response: Categories array

- **`GET /api/books/tags`**: Get all book tags
  - Response: Tags array

- **`POST /api/books/:id/download`**: Increment download counter
  - Response: Updated download count

### User Management

- **`GET /api/users/profile`**: Get current user's profile
  - Auth: Required
  - Response: User profile data

- **`PUT /api/users/profile`**: Update user profile
  - Auth: Required
  - Body: Profile update data
  - Response: Updated user data

- **`PUT /api/users/profile/image`**: Update profile image
  - Auth: Required
  - Body: Form data with image
  - Response: Updated image URL

- **`DELETE /api/users/profile`**: Delete user account
  - Auth: Required
  - Response: Success message

- **`GET /api/users/check-purchase/:bookId`**: Check if user has purchased a book
  - Auth: Required
  - Response: Purchase status

### Bookmarks

- **`GET /api/users/bookmarks`**: Get user's bookmarks
  - Auth: Required
  - Response: Bookmarked books array

- **`POST /api/users/bookmarks/:bookId`**: Toggle bookmark status
  - Auth: Required
  - Response: Updated bookmark status

- **`DELETE /api/users/bookmarks/:bookId`**: Remove a bookmark
  - Auth: Required
  - Response: Success message

### Reviews

- **`GET /api/books/:bookId/reviews`**: Get reviews for a book
  - Query params: `sort`, `rating`, `page`, `limit`
  - Response: Reviews array with pagination

- **`GET /api/books/:bookId/rating`**: Get average rating for a book
  - Response: Average rating and count

- **`POST /api/books/:bookId/reviews`**: Create a review
  - Auth: Required
  - Body: `{ rating, comment }`
  - Response: Created review

- **`GET /api/reviews/user`**: Get user's reviews
  - Auth: Required
  - Response: User's reviews array

- **`DELETE /api/reviews/:id`**: Delete a review
  - Auth: Required
  - Response: Success message

### Virtual Currency (Coins)

- **`GET /api/coins`**: Get user's coin balance
  - Auth: Required
  - Response: Coin balance

- **`POST /api/coins/daily`**: Claim daily coin reward
  - Auth: Required
  - Response: Updated coin balance

- **`POST /api/coins/ad-reward`**: Claim ad-watching reward
  - Auth: Required
  - Response: Updated coin balance

- **`POST /api/coins/purchase/:bookId`**: Purchase a book with coins
  - Auth: Required
  - Response: Purchase confirmation and updated balance

- **`POST /api/coins/reward-all`**: Award daily coins to all users
  - Auth: Admin only
  - Response: Users rewarded count

### File Upload

- **`POST /api/upload/image`**: Upload an image
  - Auth: Required
  - Body: Form data with image
  - Response: Image URL and ID

- **`POST /api/upload/pdf`**: Upload a PDF file
  - Auth: Required
  - Body: Form data with PDF and metadata
  - Response: Book data

- **`DELETE /api/upload/:id`**: Delete an uploaded file
  - Auth: Required
  - Response: Success message

## User Flows

This section outlines the main user journeys through the EbookAura application.

### User Registration and Authentication

1. **New User Registration**
   - User navigates to the registration page
   - Enters required information (name, email, password)
   - Submits the form
   - Receives verification email
   - Clicks verification link or enters code
   - Account is activated

2. **User Login**
   - User navigates to login page
   - Enters email and password
   - System authenticates and redirects to homepage
   - Auth state is maintained via localStorage

3. **Password Recovery**
   - User clicks "Forgot Password" on login page
   - Enters email address
   - Receives password reset email
   - Clicks reset link or enters code
   - Sets new password

### Book Discovery and Reading

1. **Browsing Books**
   - User lands on homepage or navigates to search page
   - Browses books by scrolling through the catalog
   - Can filter by category, tags, or premium status
   - Can sort by newest, popularity, or rating
   - Can search for specific titles, authors, or keywords

2. **Viewing Book Details**
   - User clicks on a book from the catalog
   - Views book details (title, author, description, ratings)
   - Sees review section and statistics
   - Option to bookmark the book for later

3. **Reading/Downloading Free Books**
   - From book details page, user clicks "View PDF" or "Download PDF"
   - For viewing: PDF opens in the built-in viewer
   - For downloading: File is saved to user's device

### Premium Content Purchasing

1. **Discovering Premium Books**
   - User browses books and identifies premium content by the crown icon
   - Premium books show their price in coins
   - User can filter specifically for premium content

2. **Purchasing a Premium Book**
   - User navigates to a premium book's detail page
   - If enough coins, clicks "Purchase with Coins" button
   - Confirmation dialog appears showing price and current balance
   - User confirms purchase
   - System processes transaction:
     - Deducts coins from user's balance
     - Adds book to user's purchased books
     - Updates UI to show ownership and allow access to content

3. **Insufficient Coins Flow**
   - User attempts to purchase a premium book without enough coins
   - Purchase button is disabled
   - Message shows how many more coins are needed
   - Link to coins page is provided

### Virtual Currency (Coins) Management

1. **Viewing Coin Balance**
   - User can see current coin balance in the navbar
   - Can also view detailed information on the coins page

2. **Earning Daily Coins**
   - User navigates to coins page
   - Clicks "Claim 10 Coins" once per day
   - Coin balance is updated
   - Button becomes disabled until next day

3. **Earning Ad Reward Coins**
   - User navigates to coins page
   - Clicks "Watch Ad & Earn 25 Coins"
   - After ad completion, coins are awarded
   - Transaction appears in history

### Review and Rating System

1. **Submitting a Review**
   - User navigates to a book's detail page
   - Scrolls to the review section
   - If not logged in, sees prompt to log in
   - If logged in and hasn't reviewed:
     - Selects star rating (1-5)
     - Optionally enters review text (up to 200 characters)
     - Submits review
     - Review appears in the list

2. **Managing Existing Review**
   - If user has already reviewed the book:
     - Instead of the review form, sees their existing review
     - Can delete their review
     - After deletion, review form reappears

3. **Browsing Reviews**
   - User can filter reviews by star rating
   - Can sort by newest, oldest, highest rated, or lowest rated
   - Can filter to see only their own reviews
   - Reviews are paginated for better performance

### Book Upload (Admin/Author)

1. **Uploading a New Book**
   - Admin navigates to upload page
   - Enters book metadata (title, author, description)
   - Uploads cover image
   - Uploads PDF file or provides external URL
   - Selects category and adds tags
   - For premium content, checks "Premium" and sets price
   - Submits the form

## User Authentication

EbookAura uses JWT (JSON Web Tokens) for authentication. The authentication flow works as follows:

1. **Registration**: Users register with email, username, password
2. **Email Verification**: Verification code is sent to the user's email
3. **Login**: After email verification, users can log in
4. **JWT**: Server issues a JWT token upon successful login
5. **Auth State**: Frontend stores the token in localStorage and maintains auth state
6. **Protected Routes**: API routes are protected by auth middleware
7. **Token Validation**: Backend validates tokens for protected routes

The `AuthContext` in the frontend manages authentication state, providing:
- Login/logout functionality
- Current user information
- Authentication status
- Token management

## File Storage

EbookAura uses Cloudinary for storing book covers and PDF files:

1. **Image Upload**: Book covers and user avatars are uploaded to Cloudinary
2. **PDF Storage**: Book PDFs are securely stored in Cloudinary
3. **Optimized Delivery**: Images are served through Cloudinary's CDN
4. **Secure URLs**: PDFs are accessed through secure URLs with authentication

The `uploadController` handles file uploads and Cloudinary integration.

## Premium Content System

The premium content system allows monetization through virtual currency:

1. **Premium Books**: Books can be marked as premium with a price in coins
2. **Purchase Flow**: Users can purchase premium books using their coin balance
3. **Access Control**: PDFs are only accessible to users who have purchased them
4. **Ownership Tracking**: User model tracks purchased books
5. **Purchase Verification**: Backend verifies ownership before allowing access

## Virtual Currency System

The virtual currency (coins) system provides incentives for user engagement:

1. **Daily Rewards**: Users can claim 10 coins daily
2. **Ad Rewards**: Users can earn 25 coins by watching ads
3. **Premium Purchases**: Coins can be spent to buy premium books
4. **Balance Management**: Backend tracks user coin balances
5. **Transaction History**: Coin transactions are recorded (earning and spending)

## Review System

The review system provides users with the ability to rate and review books while maintaining data integrity:

1. **Star Ratings**: Users can rate books from 1 to 5 stars
2. **Written Reviews**: Optional text reviews (up to 200 characters)
3. **Review Management**: Users can see, manage, and delete their own reviews
4. **Prevention of Duplicate Reviews**: The system prevents users from submitting multiple reviews for the same book
   - Backend validation checks if a user has already reviewed a book
   - Frontend hides the review form when a user has already submitted a review
   - Users can see their existing review and have the option to delete it
5. **Filtering & Sorting**:
   - Filter reviews by star rating (1-5 stars)
   - Sort reviews by newest, oldest, highest rated, or lowest rated
   - View only your own reviews
6. **Rating Statistics**:
   - Average rating calculation
   - Total review count
   - Distribution of ratings (count of each star rating)
7. **Pagination**: Reviews are paginated for better performance and user experience

The review component intelligently checks if the current user has already reviewed the book and conditionally renders either:
- The user's existing review with a delete option
- A review form if they haven't reviewed yet
- A login prompt if they're not authenticated

This approach enhances user experience by providing clear feedback on their review status and prevents database pollution from duplicate reviews.

## Deployment

### Static Site Generation

To build a static version of the frontend:

1. Navigate to the frontend directory:
   ```
   cd ebooks-aura
   ```

2. Create a `.env` file with:
   ```
   NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
   STATIC_EXPORT=true
   ```

3. Run the build command:
   ```
   npx next build
   ```

4. The static site will be generated in the `out` directory.

### Windows Deployment

Windows users can use the provided batch files to simplify the deployment process:

- `build-static-windows.bat`: Generate a static build of the frontend
- `start-server.bat`: Start the backend server
- `award-daily-coins.bat`: Run the daily coin reward script

## Troubleshooting

This section addresses common issues that might be encountered during development or deployment of the EbookAura application.

### Backend Issues

#### MongoDB Connection Errors

**Issue**: Backend fails to connect to MongoDB.
**Solution**:
- Check that MongoDB URI in `.env` is correct
- Ensure MongoDB service is running
- Verify network settings and firewall permissions
- For Atlas, check IP whitelist settings

#### Cloudinary Upload Failures

**Issue**: Files fail to upload to Cloudinary.
**Solution**:
- Verify API credentials in `.env`
- Check file size limitations
- Ensure proper file formats are being used
- Verify upload preset configuration in Cloudinary dashboard

#### JWT Authentication Problems

**Issue**: Authentication not working or tokens being rejected.
**Solution**:
- Ensure JWT_SECRET is properly set in `.env`
- Check token expiration settings
- Clear browser localStorage if testing
- Verify token format in requests

### Frontend Issues

#### API Connection Errors

**Issue**: Frontend cannot connect to backend API.
**Solution**:
- Check that `NEXT_PUBLIC_API_URL` is correctly set in `.env`
- Ensure backend server is running
- Verify CORS settings on backend
- Check browser console for specific errors

#### PDF Viewer Issues

**Issue**: PDF viewer not loading or displaying properly.
**Solution**:
- Check browser console for PDF.js errors
- Verify PDF URL is accessible
- Clear browser cache
- Check if PDF format is supported

#### State Management Problems

**Issue**: UI not updating or reflecting changes.
**Solution**:
- Check React component lifecycles
- Verify state updates are being properly handled
- Ensure context providers are wrapping components correctly
- Check for missing dependency arrays in useEffect hooks

### Deployment Issues

#### Static Export Failures

**Issue**: Static export fails or produces incomplete site.
**Solution**:
- Check `next.config.mjs` settings
- Ensure all dynamic routes are included in `getStaticPaths`
- Verify `STATIC_EXPORT=true` is set in `.env`
- Check for client-side only code that's causing SSG issues

#### API 404 Errors in Production

**Issue**: API routes return 404 in production deployment.
**Solution**:
- Check server routing configuration
- Verify API base URL in production environment
- Ensure all API routes are properly registered
- Check for case sensitivity issues in route paths

## Future Enhancements

This section outlines planned improvements and potential new features for future releases of EbookAura.

### User Experience Enhancements

- **Personalized Recommendations**: Implement an AI-based recommendation system based on user reading history and preferences
- **Reading Progress Tracking**: Allow users to track their reading progress across multiple books
- **Dark Mode Support**: Add theme switching functionality with dark mode option
- **Reading Time Estimates**: Display estimated reading time for books based on word count and average reading speed
- **Social Sharing**: Add ability to share books or reading progress on social media platforms

### Content Management Improvements

- **Content Collections**: Allow users to create and organize books into custom collections
- **Reading Lists**: Implement reading lists feature for users to plan their reading journey
- **Enhanced Search**: Implement full-text search within book content
- **Bulk Upload**: Add support for admin/authors to upload multiple books at once
- **Enhanced Metadata**: Support for additional book metadata like publisher, publication date, ISBN

### Monetization Features

- **Subscription Models**: Implement subscription tiers for premium content access
- **Gift Coins**: Allow users to gift coins to other users
- **Referral System**: Reward users for referring new users to the platform
- **Coin Bundles**: Offer coin bundle purchases at discounted rates
- **Author Revenue Sharing**: Implement revenue sharing for authors who upload premium content

### Technical Improvements

- **Offline Support**: Implement Progressive Web App (PWA) features for offline reading
- **Real-time Features**: Add WebSocket support for real-time notifications and chat
- **Performance Optimization**: Optimize for Core Web Vitals and improve loading performance
- **Internationalization**: Add multi-language support
- **Accessibility Improvements**: Enhance accessibility features to ensure WCAG compliance

### Mobile Experience

- **Mobile App Versions**: Develop native mobile apps for iOS and Android
- **Mobile-specific Features**: Implement features optimized for mobile reading
- **Sync Across Devices**: Enable seamless synchronization of reading progress across devices

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License. 