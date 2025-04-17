# Fixing "Cannot find module '../models/Book'" Error on Render.com

This guide provides step-by-step instructions to fix the "Cannot find module '../models/Book'" error when deploying your EbookAura application to Render.com.

## Quick Solution

1. Open the Render.com dashboard
2. Navigate to your Web Service (ebookaura)
3. Go to "Settings" tab
4. Under "Build & Deploy" section, update your Start Command to:
   ```
   cd backend && npm run deploy:render
   ```
5. Click "Save Changes"
6. Click "Manual Deploy" > "Clear build cache & deploy"

## The Problem Explained

The error occurs because of case sensitivity differences between Windows (case-insensitive) and Linux (case-sensitive) file systems. On Windows, `Book.js` and `book.js` are treated as the same file, but on Linux-based systems like Render.com, they are different files.

Your code is importing `../models/Book.js` (uppercase B), but the file might exist as `../models/book.js` (lowercase b) in the repository, causing the error.

## Detailed Fix

### 1. Update Your Start Command

1. Go to the Render.com dashboard
2. Click on your Web Service
3. Go to "Settings" tab
4. Update your Start Command to use our special deployment script:
   ```
   cd backend && npm run deploy:render
   ```
5. Click "Save Changes"

### 2. Manually Run the Model Preparation Script (Optional)

If you want to fix the issue immediately without redeploying:

1. Go to the "Shell" tab in your Render.com dashboard
2. Run these commands:

```bash
cd backend
node utils/prepareModels.js
npm start
```

### 3. Verify the Fix

1. After redeploying, check the logs to ensure there are no more "Cannot find module" errors
2. The application should start successfully
3. Visit your site at https://ebookaura.onrender.com/ to verify it's working

## Understanding What Was Fixed

We've added a `prepareModels.js` script that:

1. Checks if all necessary model files exist with the correct casing
2. Creates any missing model files with the proper case
3. Runs automatically during the deployment process

The `deploy:render` npm script:
1. Runs the model preparation script
2. Prepares static files
3. Starts the server with Render-specific environment variables

## Preventing Future Issues

To prevent similar issues in the future:

1. **Be consistent with file naming**: Always use the same case convention for all files (e.g., PascalCase for models)
2. **Run pre-deployment checks**: Use `npm run pre-deploy` before pushing code to catch issues
3. **Use case-sensitive filesystem settings**: Configure your local development environment to be case-sensitive

## File System Differences

### Windows (Case-insensitive)
```
models/
  Book.js  (same as book.js)
```

### Linux/Render.com (Case-sensitive)
```
models/
  Book.js  (different from book.js)
  book.js  (different from Book.js)
```

## Need More Help?

If you're still experiencing issues:

1. Check the logs in the Render dashboard for specific errors
2. Ensure all model imports in your code use the correct case
3. Run `node utils/checkImports.js` to find potential case sensitivity issues 