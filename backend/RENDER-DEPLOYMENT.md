# Deploying to Render.com with Static File Serving

This document provides updated instructions for deploying the EbookAura application to Render.com, ensuring the backend serves both the API and static frontend files.

## Deployment Options

You have two deployment options:

1. **Combined Deployment**: Backend serves both API and static files (recommended)
2. **Separate Deployments**: Backend API and frontend deployed separately

This guide focuses on the combined deployment option.

## Combined Deployment Steps

### 1. Prepare Your Repository

Ensure your repository contains both the backend and frontend code:

```
/
├── backend/             # Backend code
├── ebooks-aura/         # Frontend code
└── ...
```

### 2. Update Environment Variables

In your backend `.env` file, verify these variables are set:

```
NODE_ENV=production
RENDER=true
FORCE_STATIC_GENERATION=true
```

### 3. Set Up Web Service on Render.com

1. Log in to your [Render.com dashboard](https://dashboard.render.com/)
2. Click "New" and select "Web Service"
3. Connect to your GitHub repository
4. Configure the service:

   - **Name**: `ebookaura` (or your preferred name)
   - **Root Directory**: `/` (root of repository)
   - **Environment**: `Node`
   - **Branch**: `main` (or your deployment branch)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm run start:render`
   - **Plan**: Free or paid based on your needs

5. Click "Advanced" and add these environment variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary secret
   - `RENDER`: `true`
   - `FORCE_STATIC_GENERATION`: `true`

6. Click "Create Web Service"

### 4. Monitor Deployment

After deployment starts:

1. Watch the logs for any errors
2. Verify the build and start process complete successfully

### 5. Verify Deployment

Once deployed:

1. Visit your Render URL (e.g., `https://ebookaura.onrender.com`)
2. During initial setup, you may see a maintenance page - this is expected
3. The server will automatically create the necessary static files directory
4. You should see the maintenance page with a loading animation and dynamic timestamp

### 6. Copy Static Files (Optional)

To serve your actual frontend instead of the maintenance page:

1. Build your frontend locally:
   ```
   cd ebooks-aura
   npm run build:static:prod
   ```

2. Copy the static files to your backend's out directory in one of two ways:

   **Option A: Upload via Render.com Shell**
   1. Navigate to your Web Service in the Render.com dashboard
   2. Click on the "Shell" tab
   3. Use commands to prepare directory:
      ```
      cd backend
      mkdir -p out
      ```
   4. Use Render's file upload feature to upload your local `out` directory contents

   **Option B: Push to Repository**
   1. Copy your frontend build to backend/out
   2. Commit and push changes
   3. Render will automatically redeploy

### 7. Debugging Static File Issues

If you're having trouble with static file serving:

1. **Check Directory Structure**:
   Run these commands in Render Shell:
   ```
   cd backend
   ls -la
   ls -la out
   ```

2. **Force Static Generation**:
   ```
   cd backend
   npm run prepare-static
   ```

3. **Verify Environment**:
   ```
   cd backend
   echo $RENDER
   echo $FORCE_STATIC_GENERATION
   ```

4. **View Logs**:
   Check Render.com logs for any errors in static file detection or serving

## Updating the Application

To update your application:

1. Make changes to your code
2. For backend changes, commit and push to your repository
3. For frontend changes:
   - Build the frontend: `npm run build:static:prod`
   - Copy the build to your backend/out directory
   - Commit and push changes
4. Render will automatically redeploy your application

## Troubleshooting

### Maintenance Page Showing Instead of Frontend

This means the server cannot find your static files. Solutions:

1. Verify the `out` directory exists in backend
2. Make sure it contains an `index.html` file
3. Use the Render Shell to manually check the directory structure
4. Run the `prepare-static` script to create the necessary files

### API Endpoints Not Working

Check the following:

1. Ensure all API endpoints are prefixed with `/api`
2. Verify your routes are registered before the static file handler
3. Check server logs for any routing errors

### Persistent Issues

If problems persist:

1. In the Render.com dashboard, click on your service
2. Go to the "Settings" tab
3. Under "General", find "Clear Build Cache" and click it
4. Then redeploy your service 