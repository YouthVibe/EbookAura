# EbookAura Database Models

This document provides detailed information about the database models used in the EbookAura application.

## Overview

EbookAura uses MongoDB as its database, with Mongoose as the Object-Document Mapper (ODM). The database schema is divided into several collections that represent different entities in the application.

## User Model

**File**: `models/User.js`

The User model stores information about registered users including authentication details and profile information.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `username` | String | Unique username | None | Yes |
| `email` | String | User's email address | None | Yes |
| `password` | String | Hashed password | None | Yes |
| `firstName` | String | User's first name | None | No |
| `lastName` | String | User's last name | None | No |
| `role` | String | User role (user, admin) | "user" | Yes |
| `profilePicture` | String | URL to profile image | Default avatar | No |
| `bio` | String | User biography | None | No |
| `isEmailVerified` | Boolean | Email verification status | false | Yes |
| `verificationToken` | String | Email verification token | None | No |
| `resetPasswordToken` | String | Password reset token | None | No |
| `resetPasswordExpire` | Date | Password reset expiration | None | No |
| `createdAt` | Date | Account creation date | Current date | Yes |
| `updatedAt` | Date | Last update date | Current date | Yes |
| `lastLogin` | Date | Last login timestamp | None | No |
| `preferences` | Object | User preferences | Default settings | No |
| `purchases` | Array | References to purchased books | [] | No |
| `library` | Array | Book IDs saved to library | [] | No |
| `coinBalance` | Number | Virtual currency balance | 0 | Yes |
| `dailyRewardLastClaimed` | Date | Last daily reward claim | None | No |

### Methods

- `comparePassword(password)`: Compares a plaintext password with the stored hash
- `getResetPasswordToken()`: Generates a password reset token
- `getVerificationToken()`: Generates an email verification token
- `getSignedJwtToken()`: Generates a JWT token for authentication

### Indexes

- Unique index on `email`
- Unique index on `username`
- Index on `role` for faster admin queries

## TempUser Model

**File**: `models/TempUser.js`

The TempUser model stores temporary user information during the registration process.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `email` | String | User's email address | None | Yes |
| `username` | String | Desired username | None | Yes |
| `password` | String | Hashed password | None | Yes |
| `firstName` | String | User's first name | None | No |
| `lastName` | String | User's last name | None | No |
| `verificationToken` | String | Verification token | None | Yes |
| `tokenExpire` | Date | Token expiration date | +24 hours | Yes |
| `createdAt` | Date | Record creation date | Current date | Yes |

## Book Model

**File**: `models/Book.js`

The Book model stores information about books including metadata and file references.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `title` | String | Book title | None | Yes |
| `author` | String | Book author | None | Yes |
| `description` | String | Book description | None | Yes |
| `category` | String | Book category | None | Yes |
| `tags` | [String] | List of tags | [] | No |
| `coverImage` | String | URL to cover image | Default cover | No |
| `coverImageId` | String | Cloudinary image ID | None | No |
| `pdfUrl` | String | URL to PDF file | None | Yes |
| `pdfPublicId` | String | Cloudinary PDF ID | None | Yes |
| `price` | Number | Price in coins | 0 | Yes |
| `isPremium` | Boolean | Premium status | false | Yes |
| `isPublished` | Boolean | Publication status | true | Yes |
| `isFeatured` | Boolean | Featured status | false | Yes |
| `language` | String | Book language | "English" | Yes |
| `pageCount` | Number | Number of pages | 0 | No |
| `publisher` | String | Publisher name | None | No |
| `publishedDate` | Date | Publication date | None | No |
| `isbn` | String | ISBN number | None | No |
| `viewCount` | Number | Number of views | 0 | Yes |
| `downloadCount` | Number | Number of downloads | 0 | Yes |
| `createdAt` | Date | Record creation date | Current date | Yes |
| `updatedAt` | Date | Last update date | Current date | Yes |
| `createdBy` | ObjectId | Reference to User | None | Yes |

### Indexes

- Text index on `title`, `author`, `description` for search
- Index on `category` and `tags` for filtering
- Index on `isPremium` and `isFeatured` for quick filtering

## Review Model

**File**: `models/Review.js`

The Review model stores book reviews and ratings.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `user` | ObjectId | Reference to User | None | Yes |
| `book` | ObjectId | Reference to Book | None | Yes |
| `rating` | Number | Rating (1-5) | None | Yes |
| `comment` | String | Review text | None | No |
| `createdAt` | Date | Review date | Current date | Yes |
| `updatedAt` | Date | Last update date | Current date | Yes |

### Indexes

- Compound index on `book` and `user` (unique) to prevent multiple reviews
- Index on `book` for quick retrieval of book reviews

## Bookmark Model

**File**: `models/Bookmark.js`

The Bookmark model stores user bookmarks for books.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `user` | ObjectId | Reference to User | None | Yes |
| `book` | ObjectId | Reference to Book | None | Yes |
| `page` | Number | Bookmarked page | 1 | Yes |
| `name` | String | Bookmark name | None | No |
| `notes` | String | User notes | None | No |
| `createdAt` | Date | Bookmark date | Current date | Yes |

### Indexes

- Compound index on `user` and `book` for quick user bookmarks retrieval

## Purchase Model

**File**: `models/Purchase.js`

The Purchase model records book purchases by users.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `user` | ObjectId | Reference to User | None | Yes |
| `book` | ObjectId | Reference to Book | None | Yes |
| `price` | Number | Price paid in coins | None | Yes |
| `transactionId` | String | Unique transaction ID | Generated UUID | Yes |
| `purchaseDate` | Date | Purchase date | Current date | Yes |
| `status` | String | Transaction status | "completed" | Yes |

### Indexes

- Index on `user` for quick retrieval of user purchases
- Index on `transactionId` for transaction lookups

## Subscription Model

**File**: `models/Subscription.js`

The Subscription model tracks premium subscription details.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `user` | ObjectId | Reference to User | None | Yes |
| `plan` | ObjectId | Reference to SubscriptionPlan | None | Yes |
| `startDate` | Date | Subscription start date | Current date | Yes |
| `endDate` | Date | Subscription end date | None | Yes |
| `isActive` | Boolean | Subscription status | true | Yes |
| `autoRenew` | Boolean | Auto-renewal setting | false | Yes |
| `transactionId` | String | Payment transaction ID | None | Yes |
| `price` | Number | Price paid | None | Yes |
| `cancelDate` | Date | Date subscription was canceled | None | No |
| `renewalHistory` | Array | Record of renewals | [] | No |

### Indexes

- Index on `user` and `isActive` for quick subscription checks

## SubscriptionPlan Model

**File**: `models/subscriptionPlanModel.js`

The SubscriptionPlan model defines the available subscription plans.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `name` | String | Plan name | None | Yes |
| `description` | String | Plan description | None | Yes |
| `duration` | Number | Duration in days | None | Yes |
| `price` | Number | Price in currency | None | Yes |
| `features` | Array | List of features | [] | Yes |
| `isActive` | Boolean | Plan availability | true | Yes |
| `displayOrder` | Number | Order in UI | 0 | Yes |
| `createdAt` | Date | Plan creation date | Current date | Yes |

## ApiKey Model

**File**: `models/ApiKey.js`

The ApiKey model manages API keys for external access to the API.

### Schema

| Field | Type | Description | Default | Required |
|-------|------|-------------|---------|----------|
| `user` | ObjectId | Reference to User | None | Yes |
| `key` | String | Hashed API key | None | Yes |
| `name` | String | API key name | None | Yes |
| `permissions` | Array | Granted permissions | ["read"] | Yes |
| `isActive` | Boolean | Key status | true | Yes |
| `lastUsed` | Date | Last usage timestamp | None | No |
| `expiresAt` | Date | Expiration date | +1 year | Yes |
| `createdAt` | Date | Creation date | Current date | Yes |
| `ipRestrictions` | Array | Allowed IP addresses | [] | No |
| `usageCount` | Number | Number of uses | 0 | Yes |
| `rateLimit` | Number | Rate limit per minute | 60 | Yes |

### Methods

- `generateApiKey()`: Creates a new API key
- `verifyKey(plainKey)`: Verifies a provided API key against the hash
- `incrementUsage()`: Increments the usage counter

## Relationships Between Models

### User Relationships
- User → Books (many-to-many through Purchase)
- User → Reviews (one-to-many)
- User → Bookmarks (one-to-many)
- User → Subscription (one-to-one)
- User → ApiKeys (one-to-many)

### Book Relationships
- Book → User (many-to-one, created by)
- Book → Reviews (one-to-many)
- Book → Bookmarks (one-to-many)
- Book → Purchases (one-to-many)

### Subscription Relationships
- Subscription → User (many-to-one)
- Subscription → SubscriptionPlan (many-to-one)

## Database Indexing Strategy

The database uses strategic indexing to optimize common queries:

1. **Text Indexes** for full-text search functionality
2. **Compound Indexes** for complex queries combining multiple fields
3. **Single-Field Indexes** for frequently filtered fields
4. **Unique Indexes** to enforce data integrity

## Data Validation

Mongoose schemas include built-in validation:

- **Required Fields**: Ensures critical data is always present
- **Min/Max Values**: Enforces range constraints (ratings 1-5)
- **Regex Patterns**: Validates email formats, usernames, etc.
- **Custom Validators**: Complex validation logic

## Timestamps

Most models include automatic timestamp fields:
- `createdAt`: When the document was created
- `updatedAt`: When the document was last modified

These are managed automatically by Mongoose. 