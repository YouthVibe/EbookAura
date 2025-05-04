# EbookAura Controllers Documentation

This document provides details about the controller files that handle the business logic for the EbookAura application.

## Overview

Controllers are organized by resource type and contain methods that handle specific API endpoints. They implement the application's business logic, interact with models, and format API responses.

## User Controller

**File**: `controllers/userController.js`

The User Controller handles user account management and profile operations.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `registerUser` | Registers a new user | `POST /api/auth/register` |
| `loginUser` | Authenticates a user and returns JWT | `POST /api/auth/login` |
| `logoutUser` | Logs out a user by clearing the token cookie | `GET /api/auth/logout` |
| `getUserProfile` | Retrieves the authenticated user's profile | `GET /api/users/profile` |
| `updateUserProfile` | Updates user profile information | `PUT /api/users/profile` |
| `changePassword` | Updates a user's password | `PUT /api/users/change-password` |
| `forgotPassword` | Initiates password reset process | `POST /api/auth/forgot-password` |
| `resetPassword` | Resets password with token | `PUT /api/auth/reset-password/:resetToken` |
| `verifyEmail` | Verifies a user's email address | `GET /api/auth/verify-email/:verificationToken` |
| `getUserLibrary` | Gets books in user's library | `GET /api/users/library` |
| `addToLibrary` | Adds a book to user's library | `POST /api/users/library/:bookId` |
| `removeFromLibrary` | Removes a book from library | `DELETE /api/users/library/:bookId` |
| `getUserPurchases` | Gets user's purchase history | `GET /api/users/purchases` |
| `updateProfilePicture` | Updates user's profile picture | `PUT /api/users/profile-picture` |
| `updatePreferences` | Updates user preferences | `PUT /api/users/preferences` |
| `deleteAccount` | Deletes user account | `DELETE /api/users/account` |

### Authentication Logic

- Password hashing using bcrypt
- JWT token generation and validation
- Token storage in HTTP-only cookies
- Role-based access control

### Error Handling

- Validation of request data
- Proper error responses with HTTP status codes
- Secure handling of authentication errors

## Book Controller

**File**: `controllers/bookController.js`

The Book Controller handles operations related to retrieving, creating, and managing books.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `getBooks` | Gets books with filtering and pagination | `GET /api/books` |
| `getBookById` | Gets a specific book by ID | `GET /api/books/:id` |
| `createBook` | Creates a new book | `POST /api/books` |
| `updateBook` | Updates book information | `PUT /api/books/:id` |
| `deleteBook` | Deletes a book | `DELETE /api/books/:id` |
| `getBookPDF` | Gets book PDF for viewing | `GET /api/books/:id/pdf` |
| `getBookPDFContent` | Gets raw PDF content for download | `GET /api/books/:id/pdf-content` |
| `incrementBookViews` | Increments view count | `POST /api/books/:id/view` |
| `incrementBookDownloads` | Increments download count | `POST /api/books/:id/download` |
| `getFeaturedBooks` | Gets featured books | `GET /api/books/featured` |
| `getPopularBooks` | Gets popular books | `GET /api/books/popular` |
| `getRecentBooks` | Gets recently added books | `GET /api/books/recent` |
| `searchBooks` | Searches books by query | `GET /api/books/search` |
| `getCategories` | Gets book categories | `GET /api/books/categories` |
| `getTags` | Gets book tags | `GET /api/books/tags` |
| `toggleFeatured` | Toggles featured status | `PUT /api/books/:id/featured` |
| `purchaseBook` | Handles premium book purchase | `POST /api/books/:id/purchase` |

### Book Filtering

The book controller implements sophisticated filtering:
- Category filtering
- Tag filtering
- Free/premium filtering
- Search by title, author, or description
- Sorting by popularity, date, or price
- Pagination support

### PDF Handling

- Secure PDF URL generation with expiration
- Content-type and disposition headers
- Access control for premium content
- Download tracking

## Upload Controller

**File**: `controllers/uploadController.js`

The Upload Controller handles file uploads and Cloudinary integration.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `uploadImage` | Uploads an image to Cloudinary | `POST /api/upload/image` |
| `uploadPDF` | Uploads a PDF to Cloudinary | `POST /api/upload/pdf` |
| `uploadBook` | Uploads a book with files and metadata | `POST /api/upload/book` |
| `deleteUpload` | Deletes a file from Cloudinary | `DELETE /api/upload/:publicId` |
| `getUploadSignature` | Gets a signed upload payload for direct uploads | `GET /api/upload/signature` |

### File Handling Features

- File size and type validation
- Temporary file storage
- Secure upload to Cloudinary
- Progress tracking
- Error handling for failed uploads

## Review Controller

**File**: `controllers/reviewController.js`

The Review Controller manages book reviews and ratings.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `getReviews` | Gets reviews for a book | `GET /api/reviews/book/:bookId` |
| `createReview` | Creates a new review | `POST /api/reviews/book/:bookId` |
| `updateReview` | Updates an existing review | `PUT /api/reviews/:id` |
| `deleteReview` | Deletes a review | `DELETE /api/reviews/:id` |
| `getUserReviews` | Gets reviews by the current user | `GET /api/reviews/user` |
| `getAverageRating` | Gets average rating for a book | `GET /api/books/:bookId/rating` |

### Review Features

- Rating validation (1-5 stars)
- Prevention of duplicate reviews
- Author verification for updates
- Average rating calculation
- Pagination for reviews

## Bookmark Controller

**File**: `controllers/bookmarkController.js`

The Bookmark Controller manages user bookmarks for books.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `getBookmarks` | Gets user's bookmarks | `GET /api/bookmarks` |
| `createBookmark` | Creates a new bookmark | `POST /api/bookmarks/book/:bookId` |
| `updateBookmark` | Updates bookmark details | `PUT /api/bookmarks/:id` |
| `deleteBookmark` | Deletes a bookmark | `DELETE /api/bookmarks/:id` |
| `getBookBookmarks` | Gets user's bookmarks for a specific book | `GET /api/bookmarks/book/:bookId` |

### Bookmark Features

- Page number tracking
- Custom bookmark naming
- Optional notes
- Multiple bookmarks per book
- Pagination support

## Admin Controller

**File**: `controllers/adminController.js`

The Admin Controller provides administrative functions for managing the platform.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `getDashboard` | Gets admin dashboard data | `GET /api/admin/dashboard` |
| `getUsers` | Gets all users with filtering | `GET /api/admin/users` |
| `updateUser` | Updates a user as admin | `PUT /api/admin/users/:id` |
| `deleteUser` | Deletes a user | `DELETE /api/admin/users/:id` |
| `changeUserRole` | Changes a user's role | `PUT /api/admin/users/:id/role` |
| `getUserStats` | Gets user statistics | `GET /api/admin/stats/users` |
| `getBookStats` | Gets book statistics | `GET /api/admin/stats/books` |
| `getSystemLogs` | Gets system logs | `GET /api/admin/logs` |
| `toggleMaintenanceMode` | Toggles maintenance mode | `POST /api/admin/maintenance/toggle` |
| `setMaintenanceMessage` | Sets maintenance message | `POST /api/admin/maintenance/message` |
| `getUserActivity` | Gets user activity reports | `GET /api/admin/user-activity` |

### Admin Features

- User management
- Book management
- Platform statistics
- System maintenance
- Activity monitoring

## API Key Controller

**File**: `controllers/apiKeyController.js`

The API Key Controller manages API keys for integration with external systems.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `getApiKeys` | Gets user's API keys | `GET /api/api-keys` |
| `createApiKey` | Creates a new API key | `POST /api/api-keys` |
| `updateApiKey` | Updates API key details | `PUT /api/api-keys/:id` |
| `deleteApiKey` | Deletes an API key | `DELETE /api/api-keys/:id` |
| `getApiKeyUsage` | Gets API key usage statistics | `GET /api/api-keys/:id/usage` |

### API Key Features

- Secure key generation
- Permission-based access control
- Usage tracking
- Rate limiting
- IP restrictions

## Coin Controller

**File**: `controllers/coinController.js`

The Coin Controller manages the virtual currency system.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `getBalance` | Gets user's coin balance | `GET /api/coins/balance` |
| `purchaseCoins` | Processes coin purchase | `POST /api/coins/purchase` |
| `awardCoins` | Awards coins to a user (admin) | `POST /api/coins/award` |
| `getTransactions` | Gets transaction history | `GET /api/coins/transactions` |
| `claimDailyReward` | Processes daily coin reward | `POST /api/coins/daily-reward` |
| `getCoinPrices` | Gets coin package prices | `GET /api/coins/prices` |

### Coin System Features

- Balance tracking
- Transaction history
- Daily rewards
- Purchase processing
- Admin coin awards

## Subscription Controller

**File**: `controllers/subscriptionController.js`

The Subscription Controller manages premium subscriptions.

### Key Methods

| Method | Description | Route |
|--------|-------------|-------|
| `getSubscriptionPlans` | Gets available plans | `GET /api/subscriptions/plans` |
| `getCurrentSubscription` | Gets user's subscription | `GET /api/subscriptions/current` |
| `purchaseSubscription` | Processes subscription purchase | `POST /api/subscriptions/purchase` |
| `cancelSubscription` | Cancels a subscription | `PUT /api/subscriptions/cancel` |
| `getSubscriptionHistory` | Gets subscription history | `GET /api/subscriptions/history` |
| `verifySubscription` | Verifies subscription status | `POST /api/subscriptions/verify` |

### Subscription Features

- Multiple subscription plans
- Subscription tracking
- Auto-renewal management
- Access control integration
- Subscription history

## Common Controller Patterns

### Response Format

All controllers follow a consistent response format:

```javascript
{
  success: true,          // Operation status
  message: "Success message",  // Human-readable message
  data: { ... }           // Response data
}
```

### Error Handling

Controllers implement centralized error handling:

```javascript
try {
  // Controller logic
} catch (error) {
  // Log the error
  console.error(`Error in methodName: ${error.message}`);
  
  // Pass to error handler middleware
  next(error);
}
```

### Authentication

Controllers use middleware for authentication:

```javascript
// Route protected with auth middleware
router.get('/protected-route', protect, controllerMethod);

// Route with additional role check
router.post('/admin-route', protect, authorize('admin'), adminMethod);
```

### Pagination

Controllers implement a consistent pagination pattern:

```javascript
const page = parseInt(req.query.page, 10) || 1;
const limit = parseInt(req.query.limit, 10) || 10;
const skip = (page - 1) * limit;

const results = await Model.find(query)
  .skip(skip)
  .limit(limit);

const pagination = {
  current: page,
  total: Math.ceil(count / limit),
  hasNext: page * limit < count,
  hasPrev: page > 1
};
```

### Filtering

Controllers implement consistent filtering:

```javascript
const queryObj = { ...req.query };
const excludedFields = ['page', 'sort', 'limit', 'fields'];
excludedFields.forEach(el => delete queryObj[el]);

// Advanced filtering
let queryString = JSON.stringify(queryObj);
queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

let query = Model.find(JSON.parse(queryString));

// Sorting
if (req.query.sort) {
  const sortBy = req.query.sort.split(',').join(' ');
  query = query.sort(sortBy);
} else {
  query = query.sort('-createdAt');
}

// Return results with pagination
const results = await query.skip(skip).limit(limit);
```

## Controller Dependencies

Controllers rely on several utilities and services:

- **Mongoose Models**: For database operations
- **JWT**: For authentication
- **Cloudinary**: For file storage
- **Email Service**: For notifications
- **Error Handler**: For consistent error responses 