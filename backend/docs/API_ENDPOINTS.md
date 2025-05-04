# EbookAura API Endpoints Documentation

This document provides comprehensive documentation for all the API endpoints available in the EbookAura backend.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication Endpoints

### User Registration and Login

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and receive JWT token | No |
| `GET` | `/auth/logout` | Logout and clear token | Yes |
| `GET` | `/auth/me` | Get current user profile | Yes |
| `POST` | `/auth/refresh-token` | Refresh JWT token | Yes |
| `POST` | `/auth/forgot-password` | Request password reset | No |
| `PUT` | `/auth/reset-password/:resetToken` | Reset password with token | No |
| `PUT` | `/auth/verify-email/:verificationToken` | Verify email address | No |
| `POST` | `/auth/resend-verification` | Resend verification email | No |

## User Management Endpoints

### User Profile and Settings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/users/profile` | Get detailed user profile | Yes |
| `PUT` | `/users/profile` | Update user profile | Yes |
| `PUT` | `/users/change-password` | Change password | Yes |
| `PUT` | `/users/preferences` | Update user preferences | Yes |
| `GET` | `/users/purchases` | List user's purchased books | Yes |
| `GET` | `/users/library` | Get user's book library | Yes |
| `PUT` | `/users/profile-picture` | Update profile picture | Yes |
| `DELETE` | `/users/account` | Delete user account | Yes |

### Admin User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/admin/users` | List all users (with pagination) | Yes (Admin) |
| `GET` | `/admin/users/:id` | Get specific user details | Yes (Admin) |
| `PUT` | `/admin/users/:id` | Update a user | Yes (Admin) |
| `DELETE` | `/admin/users/:id` | Delete a user | Yes (Admin) |
| `PUT` | `/admin/users/:id/role` | Change user role | Yes (Admin) |
| `GET` | `/admin/stats/users` | Get user statistics | Yes (Admin) |

## Book Management Endpoints

### Book Browsing and Search

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/books` | List all books (with filters and pagination) | No |
| `GET` | `/books/:id` | Get a specific book by ID | No |
| `GET` | `/books/search` | Search books by query | No |
| `GET` | `/books/featured` | Get featured books | No |
| `GET` | `/books/popular` | Get popular books | No |
| `GET` | `/books/recent` | Get recently added books | No |
| `GET` | `/books/free` | Get free books | No |
| `GET` | `/books/premium` | Get premium books | No |
| `GET` | `/books/categories` | Get list of book categories | No |
| `GET` | `/books/tags` | Get list of book tags | No |

### Book Viewing and Download

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/books/:id/pdf` | View or download a book PDF | Conditional* |
| `GET` | `/books/:id/pdf-content` | Get PDF content for reader | Conditional* |
| `POST` | `/books/:id/view` | Increment view count | No |
| `POST` | `/books/:id/download` | Increment download count | Conditional* |

*Authentication required for premium books

### Book Administration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/books` | Create a new book | Yes (Admin) |
| `PUT` | `/books/:id` | Update book details | Yes (Admin) |
| `DELETE` | `/books/:id` | Delete a book | Yes (Admin) |
| `PUT` | `/books/:id/cover` | Update book cover | Yes (Admin) |
| `PUT` | `/books/:id/pdf` | Update book PDF file | Yes (Admin) |
| `PUT` | `/books/:id/featured` | Toggle featured status | Yes (Admin) |
| `PUT` | `/books/:id/status` | Change book status | Yes (Admin) |

## Review and Rating Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/reviews/book/:bookId` | Get reviews for a book | No |
| `POST` | `/reviews/book/:bookId` | Create a new review | Yes |
| `PUT` | `/reviews/:id` | Update a review | Yes (Owner) |
| `DELETE` | `/reviews/:id` | Delete a review | Yes (Owner/Admin) |
| `GET` | `/reviews/user` | Get reviews by current user | Yes |
| `GET` | `/books/:bookId/rating` | Get average rating | No |

## Bookmark Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/bookmarks` | Get user's bookmarks | Yes |
| `POST` | `/bookmarks/book/:bookId` | Add a bookmark | Yes |
| `DELETE` | `/bookmarks/:id` | Remove a bookmark | Yes |
| `PUT` | `/bookmarks/:id` | Update bookmark details | Yes |

## Upload Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/upload/image` | Upload an image | Yes (Admin) |
| `POST` | `/upload/pdf` | Upload a PDF file | Yes (Admin) |
| `POST` | `/upload/book` | Upload a book with metadata and files | Yes (Admin) |
| `DELETE` | `/upload/:publicId` | Delete an uploaded file | Yes (Admin) |

## Coin and Purchase Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/coins/balance` | Get user's coin balance | Yes |
| `POST` | `/coins/purchase` | Purchase coins | Yes |
| `POST` | `/coins/award` | Award coins to user (admin) | Yes (Admin) |
| `GET` | `/coins/transactions` | View coin transaction history | Yes |
| `POST` | `/coins/daily-reward` | Claim daily coin reward | Yes |
| `POST` | `/books/:id/purchase` | Purchase a premium book | Yes |
| `GET` | `/coins/prices` | Get coin package prices | No |

## Subscription Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/subscriptions/plans` | Get available subscription plans | No |
| `GET` | `/subscriptions/current` | Get current subscription | Yes |
| `POST` | `/subscriptions/purchase` | Purchase a subscription | Yes |
| `PUT` | `/subscriptions/cancel` | Cancel subscription | Yes |
| `GET` | `/subscriptions/history` | View subscription history | Yes |
| `POST` | `/subscriptions/verify` | Verify subscription status | Yes |

## API Key Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/api-keys` | List user's API keys | Yes |
| `POST` | `/api-keys` | Create a new API key | Yes |
| `PUT` | `/api-keys/:id` | Update API key | Yes (Owner) |
| `DELETE` | `/api-keys/:id` | Delete API key | Yes (Owner) |
| `GET` | `/api-keys/:id/usage` | Get API key usage stats | Yes (Owner) |

## Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/admin/dashboard` | Get admin dashboard data | Yes (Admin) |
| `GET` | `/admin/stats` | Get platform statistics | Yes (Admin) |
| `GET` | `/admin/logs` | View system logs | Yes (Admin) |
| `POST` | `/admin/maintenance/toggle` | Toggle maintenance mode | Yes (Admin) |
| `POST` | `/admin/maintenance/message` | Set maintenance message | Yes (Admin) |
| `GET` | `/admin/user-activity` | Get user activity reports | Yes (Admin) |

## Request and Response Formats

### Authentication Requests

#### Register User

**Request:**
```json
POST /api/auth/register
{
  "username": "bookworm",
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "bookworm",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2023-08-15T12:30:45.123Z"
  }
}
```

#### Login User

**Request:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "bookworm",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isEmailVerified": true
  }
}
```

### Book Requests

#### Get Books

**Request:**
```
GET /api/books?page=1&limit=10&category=fiction&sort=popular
```

**Response:**
```json
{
  "success": true,
  "count": 120,
  "pagination": {
    "current": 1,
    "total": 12,
    "hasNext": true,
    "hasPrev": false
  },
  "books": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "title": "The Lost City",
      "author": "Jane Smith",
      "description": "An adventure through ancient ruins...",
      "category": "Fiction",
      "tags": ["Adventure", "Mystery"],
      "coverImage": "https://res.cloudinary.com/demo/image/upload/v1631781324/covers/lost-city.jpg",
      "price": 0,
      "isPremium": false,
      "averageRating": 4.5,
      "reviewCount": 28,
      "downloadCount": 350,
      "createdAt": "2023-05-12T15:24:12.123Z"
    },
    // Additional books...
  ]
}
```

## Error Handling

All API endpoints return consistent error responses with HTTP status codes:

```json
{
  "success": false,
  "error": "Error message here",
  "stack": "Error stack trace (development only)"
}
```

Common status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error (unexpected issue)

## Rate Limiting

API requests are subject to rate limiting to prevent abuse:
- Anonymous users: 60 requests per minute
- Authenticated users: 120 requests per minute
- Admin users: 300 requests per minute 