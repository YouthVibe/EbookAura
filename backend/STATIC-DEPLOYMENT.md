# Serving Static Files in EbookAura Backend

This document explains how to properly set up and serve static files from the EbookAura backend, especially when deploying to platforms like Render.com.

## Overview

The EbookAura application now supports serving both the API and static frontend files from a single server. This is particularly useful for:
- Deployment to platforms like Render.com
- Simplifying the hosting setup to a single server
- Avoiding CORS issues by serving from the same origin

## How It Works

The backend server is configured to serve static files from the `out` directory. When you build the Next.js frontend with `next build` using the static export option, it generates this directory containing static HTML, CSS, JS, and assets.

The server looks for static files in the following locations (in order):
1. The directory specified in the `STATIC_FILES_DIR` environment variable
2. `./out` (direct subdirectory of the backend)
3. `./public` (in case you renamed the folder)
4. `../out` (one level up from the backend)
5. `./ebooks-aura/out` (if the frontend folder is included in the backend)

## Deployment Steps

### 1. Build the Frontend

In the frontend directory (`ebooks-aura`):

```bash
# Install dependencies
npm install

# Build static site
npm run build:static:prod
```

This will create an `out` directory with the compiled static files.

### 2. Copy Static Files to Backend

Copy the entire `out` directory to your backend directory:

```bash
# Assuming you're in the ebooks-aura directory
cp -r out ../backend/
```

### 3. Deploy to Render.com

When deploying to Render.com:

1. Connect your GitHub repository
2. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

The backend is already configured to:
- Detect the Render.com environment
- Look for the `out` directory
- Create a maintenance page if no static files are found

## Environment Variables

You can control how static files are served with these environment variables:

- `STATIC_FILES_DIR`: Specify a custom path to your static files
- `NODE_ENV`: Set to `production` for optimal caching and performance

## Troubleshooting

### Static Files Not Found

If your static files aren't being served:

1. Check that the `out` directory exists in your backend directory
2. Verify that it contains an `index.html` file
3. Make sure the server has read permissions for these files
4. Check the server logs for any path-related errors

### Manual Verification on Render.com

You can verify your file structure on Render.com by using the Shell feature:

```bash
# Check if out directory exists
ls -la

# Check contents of out directory
ls -la out

# Verify index.html exists
cat out/index.html | head -n 10
```

### Maintenance Mode

If the static files are not found in production, the server will automatically create a basic maintenance page to inform users that the site is undergoing maintenance but the API is still operational.

## For Local Development

For local development, you can:

1. Run the frontend dev server (`npm run dev` in the frontend dir)
2. Run the backend server (`npm run dev` in the backend dir)
3. Use the frontend dev server for UI development

Or to test the static file serving locally:

1. Build the frontend (`npm run build:static:prod`)
2. Copy `out` to the backend
3. Run the backend (`npm start`) 