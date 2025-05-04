# EbookAura Troubleshooting Guide

This guide provides solutions for common issues you might encounter when developing, deploying, or maintaining the EbookAura application.

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Database Issues](#database-issues)
3. [API Endpoint Errors](#api-endpoint-errors)
4. [Authentication Problems](#authentication-problems)
5. [File Upload Issues](#file-upload-issues)
6. [Premium Book Functionality](#premium-book-functionality)
7. [Performance Issues](#performance-issues)
8. [Integration Issues](#integration-issues)

## Deployment Issues

### Module Not Found Errors

**Problem**: Server fails to start with `Cannot find module '../models/Book'` or similar errors.

**Solution**:
1. This is likely a case sensitivity issue (Windows vs Linux)
2. Run the fix script:
   ```
   node backend/fix-module-not-found.js
   ```
3. Manually verify the file exists with the exact case:
   ```
   Book.js not book.js
   ```
4. Update imports to match the correct case

### Static Files Not Found

**Problem**: The API works but frontend shows "Site Maintenance" page.

**Solution**:
1. Verify static files are properly built:
   ```
   npm run copy-static
   ```
2. Check server logs for the detected static directory paths
3. Ensure the `out` directory exists with an `index.html` file
4. Run the render-fix script:
   ```
   node backend/render-fix.js
   ```
5. Update the start command to use `deploy:render`:
   ```
   cd backend && npm run deploy:render
   ```

### Environment Variable Issues

**Problem**: Server crashes with environment variable errors.

**Solution**:
1. Verify `.env` file exists with all required variables
2. Check for typos in variable names
3. Ensure environment variables are correctly set in your deployment platform
4. Use the `.env.example` file as a reference
5. Check for deprecated environment variable names

### Render.com Deployment Fails

**Problem**: Deployment to Render.com fails during build.

**Solution**:
1. Check build logs for specific errors
2. Verify build command is correct:
   ```
   cd backend && npm install
   ```
3. Ensure start command is correct:
   ```
   cd backend && npm run deploy:render
   ```
4. Verify Node.js version compatibility (should be 14+)
5. Check for large files that might exceed deployment limits

## Database Issues

### Connection Failures

**Problem**: Server fails to connect to MongoDB.

**Solution**:
1. Verify `MONGO_URI` is correct in your environment variables
2. Check if MongoDB Atlas IP whitelist includes your server IP
3. Verify MongoDB user credentials are correct
4. Check for MongoDB service health issues
5. Try a direct connection test:
   ```javascript
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGO_URI)
     .then(() => console.log('Connected'))
     .catch(err => console.error('Connection error:', err));
   ```

### Data Integrity Issues

**Problem**: Missing or inconsistent data in the database.

**Solution**:
1. Run the appropriate fix script:
   ```
   node backend/fix-premium-books.js
   ```
   or
   ```
   node backend/fix-purchase-premium-books.js
   ```
2. Check for duplicate data with MongoDB queries
3. Verify data validation in models is working correctly
4. Check for case sensitivity issues in queries
5. Look for race conditions in concurrent update operations

### Schema Version Mismatches

**Problem**: Errors about missing fields or incorrect types.

**Solution**:
1. Check Mongoose model definitions against database
2. Look for recent schema changes that might need migration
3. Consider creating a database migration script
4. Verify indexes are properly set up
5. Check for deprecated Mongoose syntax

## API Endpoint Errors

### 404 Not Found Errors

**Problem**: API endpoints return 404 errors.

**Solution**:
1. Verify route paths in the server.js file
2. Check for proper route registration
3. Verify API prefix is correctly used (`/api/...`)
4. Check for conflicting route definitions
5. Look for typos in route paths
6. Run the API fix script:
   ```
   node backend/fix-api-404-issues.js
   ```

### 500 Internal Server Errors

**Problem**: Endpoints return 500 errors with no clear cause.

**Solution**:
1. Check server logs for detailed error messages
2. Look for unhandled exceptions or promise rejections
3. Verify your error handling middleware is working
4. Check for synchronous errors in async functions
5. Verify database operations have proper error handling
6. Look for issues with third-party services (Cloudinary, etc.)

### Rate Limiting Issues

**Problem**: Receiving too many rate limit errors.

**Solution**:
1. Check API usage patterns for excessive requests
2. Verify rate limit settings in the API
3. Implement client-side caching to reduce requests
4. Consider adjusting rate limits for specific users or routes
5. Implement exponential backoff for retries

## Authentication Problems

### Login Failures

**Problem**: Users cannot log in despite correct credentials.

**Solution**:
1. Verify password hashing is working correctly
2. Check for case sensitivity in email/username comparisons
3. Look for expired or corrupted JWT secret keys
4. Verify cookie settings if using cookie-based auth
5. Check CORS settings for cross-origin requests
6. Look for password salt issues

### JWT Token Issues

**Problem**: Authentication fails with token-related errors.

**Solution**:
1. Verify JWT_SECRET environment variable is set
2. Check token expiration settings
3. Look for client-side token storage issues
4. Verify token is being passed correctly in requests
5. Check for clock sync issues between servers
6. Look for JWT format errors

### Permissions Problems

**Problem**: Users receiving 403 Forbidden despite being logged in.

**Solution**:
1. Verify user roles are correctly assigned in the database
2. Check authorization middleware logic
3. Look for incorrect role checks in routes
4. Verify the `authorize` middleware is used correctly
5. Check if user permissions were recently changed

## File Upload Issues

### Cloudinary Upload Failures

**Problem**: Files fail to upload to Cloudinary.

**Solution**:
1. Verify Cloudinary credentials in environment variables
2. Check file size limits (default is 300MB)
3. Verify file types are supported
4. Look for network connectivity issues
5. Check Cloudinary service status
6. Run the Cloudinary connection test:
   ```javascript
   const { testCloudinaryConnection } = require('./config/cloudinary');
   testCloudinaryConnection().then(console.log);
   ```

### PDF Processing Issues

**Problem**: PDF files can't be viewed or downloaded.

**Solution**:
1. Check if the file was correctly uploaded to Cloudinary
2. Verify the PDF URL is correctly generated
3. Look for CORS issues with PDF viewing
4. Check for PDF format compatibility issues
5. Verify file permissions in Cloudinary
6. Check Content-Type headers for PDF responses

### Temporary File Cleanup

**Problem**: Temporary files accumulating in the `temp` directory.

**Solution**:
1. Verify cleanup logic in file upload controller
2. Check for errors during file processing that skip cleanup
3. Implement a scheduled cleanup job
4. Restart the server to trigger cleanup
5. Manually clear the temp directory:
   ```
   rm -rf backend/temp/*
   ```

## Premium Book Functionality

### Premium Book Access Issues

**Problem**: Users can't access premium books they purchased.

**Solution**:
1. Run the purchase fix script:
   ```
   node backend/fix-purchase-premium-books.js
   ```
2. Verify the purchase records in the database
3. Check for subscription verification issues
4. Verify the book's premium status is correctly set
5. Look for permission checking issues in the book controller

### Coin Balance Problems

**Problem**: User coin balance is incorrect or transactions fail.

**Solution**:
1. Check transaction logs in the database
2. Verify coin award and deduction logic
3. Look for concurrency issues during transactions
4. Check for missing transaction records
5. Run the fix-user-purchases script:
   ```
   node backend/fix-user-purchases.bat
   ```

### Subscription Verification Issues

**Problem**: Active subscriptions not being recognized.

**Solution**:
1. Check subscription records in the database
2. Verify subscription expiration dates
3. Run the subscription verification middleware manually
4. Look for issues with subscription plan references
5. Check for clock/time zone issues affecting expiration checks

## Performance Issues

### Slow API Responses

**Problem**: API endpoints have high response times.

**Solution**:
1. Check database query performance
2. Look for missing indexes on frequently queried fields
3. Verify N+1 query problems are avoided
4. Implement caching for expensive operations
5. Check for slow network calls to external services
6. Optimize file size for uploads/downloads

### High Server Load

**Problem**: Server CPU or memory usage is excessive.

**Solution**:
1. Check for memory leaks in long-running processes
2. Look for unoptimized queries that might cause high CPU usage
3. Verify file handling is efficient
4. Check for infinite loops or recursion issues
5. Implement rate limiting for resource-intensive endpoints
6. Consider scaling the server resources

### Database Performance

**Problem**: Database operations are slow.

**Solution**:
1. Check for missing indexes
2. Look for large result sets without pagination
3. Verify query patterns are optimized
4. Consider adding database caching
5. Check for database connection pool issues
6. Monitor query execution plans

## Integration Issues

### Email Sending Failures

**Problem**: Email notifications not being sent.

**Solution**:
1. Verify email service credentials
2. Check for rate limiting from the email provider
3. Look for network issues affecting email delivery
4. Verify email templates are valid
5. Check spam filters not blocking outgoing emails
6. Consider switching to a different email provider

### External API Integration Issues

**Problem**: Problems with third-party API integrations.

**Solution**:
1. Verify API credentials and tokens
2. Check for API version compatibility issues
3. Look for rate limiting from external APIs
4. Verify request/response formats are correct
5. Implement better error handling for API calls
6. Check API provider status pages for outages

## Using the Fix Scripts

EbookAura includes several utility scripts to fix common issues. Here's how to use them:

### fix-module-not-found.js

Fixes case sensitivity and module import issues:

```
node backend/fix-module-not-found.js
```

This script:
- Scans for incorrect imports
- Creates necessary model files with correct casing
- Updates import references

### render-fix.js

Comprehensive fix for Render.com deployment issues:

```
node backend/render-fix.js
```

This script:
- Fixes model file casing
- Ensures directories exist
- Sets up maintenance page
- Checks environment

### fix-premium-books.js

Repairs premium book functionality:

```
node backend/fix-premium-books.js
```

This script:
- Updates premium book flags
- Corrects price information
- Fixes book purchase records

### fix-purchase-premium-books.js

Fixes user purchase records for premium books:

```
node backend/fix-purchase-premium-books.js
```

This script:
- Repairs user purchase records
- Updates user libraries
- Corrects transaction history

### copy-static-files.js

Copies frontend static files for serving:

```
node backend/copy-static-files.js
```

This script:
- Locates frontend build files
- Copies them to the backend's static directory
- Verifies the copy was successful

## Diagnostic Logging

To enable detailed diagnostic logging:

1. Set the `DEBUG` environment variable:
   ```
   DEBUG=true
   ```

2. Check logs for detailed information about:
   - Database operations
   - File uploads
   - Authentication processes
   - API request handling
   - Static file serving

## Getting Further Help

If you're still experiencing issues:

1. Check the existing fix scripts and documentation in the `backend` directory
2. Look for recently added troubleshooting guides
3. Check the issue tracker in the repository
4. Enable detailed logging to diagnose the specific issue
5. Consider reaching out to the development team with:
   - Detailed error logs
   - Steps to reproduce
   - Environment information 