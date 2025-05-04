# EbookAura Utilities and Middleware

This document provides detailed information about the utility functions and middleware components used in the EbookAura backend.

## Middleware

Middleware functions intercept incoming requests before they reach the route handlers, providing cross-cutting functionality across the application.

### Authentication Middleware

**File**: `middleware/auth.js`

Handles user authentication and authorization for protected routes.

#### Functions

| Function | Description |
|----------|-------------|
| `protect` | Verifies JWT token and attaches user to request |
| `authorize` | Restricts access based on user roles |

#### Usage Example

```javascript
// Protect a route (require authentication)
router.get('/profile', protect, userController.getUserProfile);

// Restrict to specific roles
router.post('/admin/users', protect, authorize('admin'), adminController.createUser);
```

#### Implementation Details

- Extracts JWT token from cookies or authorization header
- Verifies token validity and expiration
- Attaches user object to request for downstream handlers
- Returns appropriate error responses for unauthorized requests

### API Key Authentication

**File**: `middleware/apiKeyAuth.js`

Provides API key-based authentication for external integrations.

#### Functions

| Function | Description |
|----------|-------------|
| `apiKeyAuth` | Authenticates requests using API key |

#### Usage Example

```javascript
// Apply to specific routes
router.get('/public-data', apiKeyAuth, dataController.getPublicData);
```

#### Implementation Details

- Extracts API key from request header
- Verifies key against database
- Tracks usage for rate limiting
- Attaches API permissions to request

### Subscription Verification

**File**: `middleware/subscriptionVerification.js`

Verifies user subscription status for premium content access.

#### Functions

| Function | Description |
|----------|-------------|
| `verifySubscription` | Checks user subscription status |

#### Usage Example

```javascript
// Apply globally or to specific routes
app.use('/api/premium', verifySubscription);
```

#### Implementation Details

- Checks if user has an active subscription
- Verifies subscription expiration date
- Attaches subscription status to request
- Updates subscription status if needed

### Error Handler

**File**: `utils/errorHandler.js`

Provides centralized error handling for the application.

#### Functions

| Function | Description |
|----------|-------------|
| `errorHandler` | Express error handling middleware |
| `ErrorResponse` | Custom error class with status code |

#### Usage Example

```javascript
// In route handlers
if (!user) {
  return next(new ErrorResponse('User not found', 404));
}

// At the application level
app.use(errorHandler);
```

#### Implementation Details

- Formats consistent error responses
- Handles different error types (Mongoose, JWT, validation)
- Includes stack traces in development environment
- Logs errors for monitoring

## Utility Functions

Utility functions provide reusable functionality across different parts of the application.

### Cloudinary Integration

**File**: `config/cloudinary.js`

Handles file uploads and management in Cloudinary.

#### Functions

| Function | Description |
|----------|-------------|
| `initCloudinary` | Initializes Cloudinary configuration |
| `uploadToCloudinary` | Uploads a file to Cloudinary |
| `getSecureUrl` | Generates a secure URL with expiration |
| `deleteFromCloudinary` | Deletes a file from Cloudinary |
| `testCloudinaryConnection` | Tests Cloudinary connectivity |

#### Usage Example

```javascript
// Initialize
initCloudinary();

// Upload a file
const result = await uploadToCloudinary(filePath, 'books');

// Generate secure URL
const secureUrl = getSecureUrl(publicId, 3600); // expires in 1 hour
```

#### Implementation Details

- Configures Cloudinary with environment variables
- Handles different file types (images, PDFs)
- Manages resource types and folders
- Implements secure URL generation with signed tokens

### Email Service

**File**: `config/email.js`

Manages email notifications and communications.

#### Functions

| Function | Description |
|----------|-------------|
| `createTransporter` | Creates a nodemailer transporter |
| `sendEmail` | Sends an email with template |
| `sendVerificationEmail` | Sends account verification email |
| `sendPasswordResetEmail` | Sends password reset email |
| `sendPurchaseConfirmation` | Sends purchase confirmation |

#### Usage Example

```javascript
// Send a verification email
await sendVerificationEmail(user.email, verificationUrl);

// Send a custom email
await sendEmail({
  to: user.email,
  subject: 'Welcome to EbookAura',
  text: 'Thank you for joining...',
  html: '<h1>Welcome!</h1>...'
});
```

#### Implementation Details

- Configures email provider using environment variables
- Implements HTML email templates
- Handles email sending failures
- Provides both text and HTML versions of emails

### Database Connection

**File**: `config/db.js`

Manages MongoDB database connection.

#### Functions

| Function | Description |
|----------|-------------|
| `connectDB` | Establishes MongoDB connection |
| `closeConnection` | Closes database connection |
| `checkConnection` | Verifies database connectivity |

#### Usage Example

```javascript
// Connect to database
await connectDB();

// Check connection status
const isConnected = await checkConnection();
```

#### Implementation Details

- Connects to MongoDB using environment variables
- Implements connection pooling
- Handles connection errors
- Sets up Mongoose configuration (strict query, etc.)

### Model Preparation

**File**: `utils/prepareModels.js`

Ensures model files exist with correct casing for deployment.

#### Functions

| Function | Description |
|----------|-------------|
| `prepareModels` | Ensures model files exist with correct casing |
| `checkModelImports` | Validates model import statements |

#### Usage Example

```javascript
// Run before server start
await prepareModels();
```

#### Implementation Details

- Checks for model files with correct casing
- Creates necessary files if missing
- Logs model preparation status
- Fixes common case sensitivity issues

### Static File Management

**File**: `utils/prepareStaticFiles.js`

Prepares static files for serving from the backend.

#### Functions

| Function | Description |
|----------|-------------|
| `prepareStaticFiles` | Ensures static file directories exist |
| `copyStaticFiles` | Copies frontend files to backend |
| `verifyStaticStructure` | Verifies static file structure |

#### Usage Example

```javascript
// Prepare static files before server start
await prepareStaticFiles();
```

#### Implementation Details

- Creates necessary directories
- Copies frontend build files if available
- Verifies index.html exists
- Generates placeholder files if needed

### Validation

**File**: `utils/validation.js`

Provides input validation utilities.

#### Functions

| Function | Description |
|----------|-------------|
| `validateEmail` | Validates email format |
| `validatePassword` | Validates password strength |
| `sanitizeInput` | Sanitizes user input |
| `validateBookData` | Validates book submission data |

#### Usage Example

```javascript
// Validate user input
if (!validateEmail(email)) {
  return next(new ErrorResponse('Invalid email format', 400));
}
```

#### Implementation Details

- Implements regex validation patterns
- Checks password complexity requirements
- Sanitizes input to prevent injection attacks
- Validates specific data types (ISBN, etc.)

### File Type Validation

**File**: `utils/fileValidation.js`

Validates uploaded files.

#### Functions

| Function | Description |
|----------|-------------|
| `isValidImage` | Checks if file is a valid image |
| `isValidPDF` | Checks if file is a valid PDF |
| `getFileExtension` | Gets file extension |
| `getFileMimeType` | Gets file MIME type |

#### Usage Example

```javascript
// Validate uploaded file
if (!isValidPDF(req.files.bookFile)) {
  return next(new ErrorResponse('Invalid PDF file', 400));
}
```

#### Implementation Details

- Checks file signatures and magic numbers
- Validates file extensions
- Verifies MIME types
- Sets size limits for different file types

### Session Management

**File**: `utils/sessionManager.js`

Manages user sessions and JWT tokens.

#### Functions

| Function | Description |
|----------|-------------|
| `generateToken` | Generates a JWT token |
| `setTokenCookie` | Sets a secure cookie with token |
| `clearTokenCookie` | Clears authentication cookie |
| `refreshToken` | Refreshes an existing token |

#### Usage Example

```javascript
// Generate and set token
const token = generateToken(user);
setTokenCookie(res, token);

// Clear token on logout
clearTokenCookie(res);
```

#### Implementation Details

- Generates secure JWT tokens
- Sets HTTP-only cookies with appropriate flags
- Manages token expiration
- Handles token refresh logic

## Middleware Chaining

EbookAura uses middleware chaining for complex request processing.

### Example: Protected Route with Validation

```javascript
router.post('/books/:id/review',
  [
    protect,                 // Authenticate user
    validateReviewInput,     // Validate review data
    checkBookExists,         // Verify book exists
    preventDuplicateReview   // Prevent multiple reviews
  ],
  reviewController.createReview
);
```

### Example: Admin Route with Multiple Checks

```javascript
router.delete('/books/:id',
  [
    protect,                  // Authenticate user
    authorize('admin'),       // Verify admin role
    checkBookExists,          // Verify book exists
    removeBookReferences      // Clean up references
  ],
  bookController.deleteBook
);
```

## Custom Middleware Development

When creating new middleware for EbookAura, follow these guidelines:

1. **Single Responsibility Principle**: Each middleware should do one thing well
2. **Error Handling**: Use `next(error)` for error propagation
3. **Async Support**: Use `express-async-handler` for async middleware
4. **Documentation**: Add JSDoc comments to document parameters and behavior
5. **Testing**: Create unit tests for middleware functions 