# EbookAura Deployment Guide for Render.com

This guide provides comprehensive instructions for deploying EbookAura on Render.com and fixing common deployment issues.

## Quick Fix Instructions

If you're seeing the "Cannot find module '../models/Book'" error or the maintenance page at https://ebookaura.onrender.com/, follow these steps:

1. **Log into your Render.com dashboard**
2. **Navigate to your Web Service (ebookaura)**
3. **Go to the "Shell" tab** 
4. **Run the quick fix script:**
   ```
   cd /opt/render/project/src/ && node backend/render-fix.js
   ```
5. **Go to the "Settings" tab**
6. **Update your Start Command:**
   ```
   cd backend && npm run deploy:render
   ```
7. **Save changes and redeploy:**
   - Click "Save Changes"
   - Click "Manual Deploy" > "Clear build cache & deploy"

## Common Issues and Solutions

### Issue 1: "Cannot find module '../models/Book'"

**Problem:** This is a case sensitivity issue. Windows is case-insensitive for file names (both `Book.js` and `book.js` are treated as the same file), but Linux (which Render.com uses) is case-sensitive.

**Solution:** Our `render-fix.js` script ensures that the `Book.js` file exists with exactly the correct casing.

### Issue 2: Maintenance Page Showing Instead of Website

**Problem:** The backend can't find the static files for the frontend.

**Solution:** Our enhanced `server.js` now:
1. Searches multiple directories for static files
2. Provides detailed logging on Render.com
3. Shows a professional maintenance page when static files aren't found

## What Files We've Created/Modified

1. **render-fix.js** - One-click script to fix all deployment issues
2. **utils/prepareModels.js** - Ensures model files exist with correct casing
3. **utils/prepareStaticFiles.js** - Ensures static file directories exist
4. **package.json** - Added deployment scripts
5. **server.js** - Enhanced static file detection and maintenance page
6. **FIX-MODULE-NOT-FOUND.md** - Guide for fixing module not found errors
7. **FIX-RENDER-MAINTENANCE.md** - Guide for fixing the maintenance page issue

## Deployment Options

### Option 1: Deploy Backend Only (Recommended for Quick Start)

1. Connect your GitHub repository to Render.com
2. Create a Web Service pointing to your repository
3. Configure these settings:
   - **Environment:** Node
   - **Build Command:**
     ```
     cd backend && npm install
     ```
   - **Start Command:**
     ```
     cd backend && npm run deploy:render
     ```
   - **Environment Variables:**
     - `RENDER=true`
     - `NODE_ENV=production`
     - `MONGODB_URI=your_mongodb_connection_string`
     - `JWT_SECRET=your_jwt_secret`
     - `CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name`
     - `CLOUDINARY_API_KEY=your_cloudinary_api_key`
     - `CLOUDINARY_API_SECRET=your_cloudinary_api_secret`

### Option 2: Deploy Full-Stack (Frontend + Backend)

For this approach, you need to:

1. Build your frontend first:
   ```
   cd ebooks-aura && npm run build
   ```

2. Copy the build output to the backend's static directory:
   ```
   cp -r ebooks-aura/out backend/out
   ```

3. Deploy the backend following Option 1 above

## Troubleshooting

### Check Logs

Always check the logs in the Render dashboard for detailed error messages:

1. Go to your Web Service in Render
2. Click on the "Logs" tab
3. Look for error messages

### Run The Fix Script Again

If issues persist, you can run the fix script again from the Render Shell:

```
cd /opt/render/project/src/ && node backend/render-fix.js
```

### Verify File Structure

Make sure your repository has the correct structure:

```
EbookAura/
├── backend/
│   ├── models/
│   │   ├── Book.js  <- Case sensitive!
│   │   └── ...
│   ├── routes/
│   ├── controllers/
│   ├── utils/
│   ├── server.js
│   └── package.json
└── ebooks-aura/ (frontend)
    ├── src/
    ├── public/
    └── ...
```

## Maintaining Your Deployment

### Updating Your Application

When you make changes to your code:

1. Push changes to your GitHub repository
2. Render will automatically redeploy

### Debugging Deployment Issues

If you're experiencing issues:

1. Test locally first
2. Check environment variables
3. Verify that your start command is correct
4. Remember that case sensitivity matters on Linux

## Need More Help?

If you continue to experience issues:

1. Check the [Render documentation](https://render.com/docs)
2. Refer to the error-specific fix files in the repository:
   - `FIX-MODULE-NOT-FOUND.md`
   - `FIX-RENDER-MAINTENANCE.md`
3. Reach out to the Render.com support team 