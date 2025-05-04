# EbookAura Deployment Guide

This comprehensive guide covers the deployment process for the EbookAura application, focusing on Render.com deployment and common issues that may arise.

## Deployment Options

EbookAura can be deployed in several ways:

1. **Backend Only**: Deploy just the API server
2. **Full-Stack**: Deploy both frontend and backend together
3. **Separate Deployments**: Deploy frontend and backend to different platforms

## Prerequisites

Before deployment, ensure:

1. **MongoDB Database**: A MongoDB database is set up and accessible
2. **Cloudinary Account**: For storing PDFs and images
3. **Environment Variables**: All required env variables are configured
4. **Node.js**: Version 14.0.0 or higher

## Environment Variables

Set the following environment variables:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_SERVICE=your_email_service
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=your_email_from_address
NODE_ENV=production
```

## Deploying to Render.com

### Option 1: Backend Only (Recommended for Quick Start)

1. **Create a New Web Service on Render.com**
   - Connect your GitHub repository
   - Select the repository and the branch to deploy

2. **Configure the Build Settings**
   - **Name**: `ebookaura-api` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**:
     ```
     cd backend && npm install
     ```
   - **Start Command**:
     ```
     cd backend && npm run deploy:render
     ```

3. **Set Environment Variables**
   - Add all the required environment variables listed above
   - Add `RENDER=true` to enable Render-specific optimizations

4. **Deploy the Service**
   - Click "Create Web Service"
   - Wait for the deployment to complete

### Option 2: Full-Stack (Frontend + Backend)

1. **Build the Frontend First**
   - Ensure the frontend build creates static files:
     ```
     cd ebooks-aura && npm run build
     ```

2. **Copy Frontend Build to Backend**
   - Copy the build output to the backend's static directory:
     ```
     cp -r ebooks-aura/out backend/out
     ```

3. **Deploy to Render.com**
   - Follow the same steps as Option 1, but include the static files

4. **Verify Static Files Detection**
   - The server will automatically detect and serve static files from the `out` directory

## Deployment Scripts

EbookAura includes several scripts to help with deployment:

### Key NPM Scripts

- **start**: Standard production start
  ```
  npm start
  ```

- **deploy:render**: Optimized for Render.com
  ```
  npm run deploy:render
  ```

- **copy-static**: Copy static files from frontend
  ```
  npm run copy-static
  ```

- **prepare-static**: Force static file preparation
  ```
  npm run prepare-static
  ```

- **prepare-models**: Ensure model files exist with correct casing
  ```
  npm run prepare-models
  ```

## Deployment Fix Scripts

Several batch and JS scripts are included to fix common deployment issues:

### render-fix.js

This script performs several automated fixes for Render.com deployment:

- Fixes case sensitivity issues with model files
- Ensures required directories exist
- Verifies static file structure
- Logs detailed environment information

To run:
```
node backend/render-fix.js
```

### setup-render.js

This script prepares the environment for Render.com:

- Creates necessary directories
- Sets up environment variables
- Prepares static files

To run:
```
node backend/setup-render.js
```

### fix-premium-production.js

Fixes issues with premium books in production:

- Repairs database references for premium books
- Corrects purchase records
- Updates subscription status

To run:
```
node backend/fix-premium-production.js
```

### copy-static-files.js

Copies static frontend files to the backend:

- Identifies frontend build directory
- Copies to the backend's `out` directory
- Verifies successful copy

To run:
```
node backend/copy-static-files.js
```

## Common Deployment Issues

### Case Sensitivity Issues

**Problem**: Files that work on Windows may not work on Linux (Render.com) due to case sensitivity.

**Solution**:
1. Ensure all imports use the exact case of the file:
   ```javascript
   // Correct
   const Book = require('../models/Book');
   
   // Incorrect (may work on Windows but fail on Linux)
   const Book = require('../models/book');
   ```

2. Run the `prepare-models.js` script:
   ```
   npm run prepare-models
   ```

### Module Not Found Errors

**Problem**: Node.js can't find certain modules during deployment.

**Solutions**:
1. Check for case sensitivity issues
2. Verify the module is in `package.json`
3. Run with the fix script:
   ```
   node backend/fix-module-not-found.js
   ```

### Maintenance Page Shows Instead of Frontend

**Problem**: The API works but the frontend isn't being served.

**Solutions**:
1. Ensure static files are in the `out` directory
2. Run the copy-static-files script:
   ```
   npm run copy-static
   ```
3. Update the start command on Render.com to:
   ```
   cd backend && npm run deploy:render
   ```

## Continuous Deployment

For continuous deployment:

1. **Set Up GitHub Integration**:
   - Connect your repository to Render.com
   - Enable automatic deployments

2. **Configure Branch Deployments**:
   - `main` branch for production
   - `staging` branch for testing

3. **Auto-Deploy Settings**:
   - Enable auto-deploy for selected branches
   - Set up deploy hooks if needed

## Deployment Checklist

Before deploying, verify:

- [ ] All dependencies are in `package.json`
- [ ] Environment variables are configured
- [ ] Database connection is tested
- [ ] Static files are built (if serving frontend)
- [ ] Case sensitivity issues are addressed
- [ ] API endpoints are tested

## Maintenance Mode

EbookAura includes a built-in maintenance mode:

1. **Enable Maintenance Mode**:
   ```
   POST /api/admin/maintenance/toggle
   ```

2. **Set Maintenance Message**:
   ```
   POST /api/admin/maintenance/message
   ```

3. **Force Maintenance Page**:
   Set `MAINTENANCE_MODE=true` in environment variables

## Monitoring and Scaling

### Monitoring

- Use Render.com's built-in logging
- Set up logging to an external service
- Monitor database performance

### Scaling

- Adjust Render.com's instance size as needed
- Consider database scaling for high traffic
- Implement caching for frequently accessed data

## Rollback Procedure

If a deployment fails:

1. **Via Render Dashboard**:
   - Go to the "Deploys" tab
   - Select a previous successful deploy
   - Click "Redeploy"

2. **Via Git**:
   - Revert to a previous commit
   - Push the change to trigger a new deploy

## Troubleshooting Scripts

Several batch files are included for common issues:

- `fix-all-premium-issues.bat`: Fixes all premium content issues
- `fix-premium-books.bat`: Repairs premium book data
- `fix-user-purchases.bat`: Corrects user purchase records
- `start-server.bat`: Starts the server with proper environment variables
- `fix-specific-book.bat`: Repairs a specific book's data
- `reset-session-time.bat`: Resets session timeouts

## Deployment Best Practices

1. **Test Locally First**:
   ```
   npm run dev
   ```

2. **Version Control**:
   Keep code in git and commit frequently

3. **Environment Separation**:
   Use different environments for development, staging, and production

4. **Database Backups**:
   Regularly back up your MongoDB data

5. **Logging**:
   Implement comprehensive logging for troubleshooting

## Additional Resources

- **Render.com Documentation**: [https://render.com/docs](https://render.com/docs)
- **MongoDB Atlas Documentation**: [https://docs.atlas.mongodb.com/](https://docs.atlas.mongodb.com/)
- **Cloudinary Documentation**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)

## Common Error Codes and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `MODULE_NOT_FOUND` | Missing module | Check imports and case sensitivity |
| `ECONNREFUSED` | Database connection failed | Verify MongoDB URI and network |
| `401 Unauthorized` | Invalid API credentials | Check environment variables |
| `EPERM` | File permission issues | Check directory permissions |
| `EADDRINUSE` | Port already in use | Change PORT env variable | 