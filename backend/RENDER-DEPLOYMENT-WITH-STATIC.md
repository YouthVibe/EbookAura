# Deploying EbookAura to Render.com with Static Frontend

This guide provides step-by-step instructions for deploying the EbookAura application to Render.com, serving both the API and static frontend from a single server.

## Prerequisites

Before deployment, ensure you have:
- A GitHub repository with your EbookAura code
- A Render.com account
- The frontend built and ready for static serving

## Deployment Steps

### 1. Build the Frontend

First, build the Next.js frontend with static export:

```bash
# Navigate to the frontend directory
cd ebooks-aura

# Install dependencies
npm install

# Build with static export enabled
npm run build:static:prod
```

This will create an `out` directory containing all static files.

### 2. Prepare the Backend

There are two ways to include the static files in your backend deployment:

#### Option A: Copy Static Files to Backend (Recommended)

```bash
# In the backend directory
cd ../backend

# Run the copy script
npm run copy-static
```

This script will:
- Find the built static files
- Copy them to the backend's `out` directory
- Prepare them for serving

#### Option B: Push Everything to Git

Alternatively, commit both the backend and the frontend's `out` directory to your Git repository:

```bash
# Add the static files to Git
git add ebooks-aura/out
git add backend
git commit -m "Prepare deployment with static files"
git push
```

### 3. Set Up Render.com Web Service

1. Log in to your [Render.com dashboard](https://dashboard.render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:

   - **Name**: `ebook-aura` (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the closest to your users
   - **Branch**: main (or your deployment branch)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `/` (root of your repo)

5. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: Leave empty (Render will set this)
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your secret for JWT tokens
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `RENDER`: `true` (helps detect Render environment)

6. Click "Create Web Service"

### 4. Verify Deployment

After deployment completes:

1. Visit your Render.com service URL
2. Verify the frontend is displayed correctly
3. Test API endpoints (e.g., `/api/books`)
4. Check logs in the Render dashboard for any errors

## Troubleshooting

### Static Files Not Found

If your static site isn't appearing:

1. Use the Render.com Shell to check for the static files:
   ```bash
   cd backend
   ls -la out
   ```

2. If files are missing, you can manually copy them:
   ```bash
   # On your local machine
   cd ebooks-aura
   npm run build:static:prod
   
   # Then in Render.com Shell
   mkdir -p backend/out
   # (Use Render's file upload feature to upload the out directory)
   ```

3. Check server logs for path-related errors.

### Environment Variables in Windows

If you're developing on Windows, the `NODE_ENV=production node server.js` command might not work. Update your package.json to use cross-env:

```json
{
  "scripts": {
    "start": "cross-env NODE_ENV=production node server.js"
  },
  "devDependencies": {
    "cross-env": "^7.0.3"
  }
}
```

### API Routes Not Working

If API routes aren't working but the frontend is:

1. Check your API routes are correctly prefixed with `/api`
2. Verify the Express routes are registered before the static file handler
3. Check for CORS issues if calling from a different origin

## Maintenance Mode

If for some reason your static files aren't available or the frontend needs maintenance, the server will automatically create a simple maintenance page that informs users that the site is undergoing maintenance but the API is still operational.

## Updating Your Deployment

To update your deployment:

1. Make changes to your code
2. For frontend changes:
   - Rebuild the frontend: `npm run build:static:prod`
   - Copy static files: `npm run copy-static` (in backend directory)
3. Commit and push changes
4. Render will automatically redeploy your application 