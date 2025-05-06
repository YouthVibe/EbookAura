# EbookAura Static Site Generation Guide

This document provides comprehensive information about generating a static version of the EbookAura application, which can be deployed to any static hosting service like Netlify, Vercel, GitHub Pages, or AWS S3.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Static Generation Process](#static-generation-process)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Using the Automated Build Scripts](#using-the-automated-build-scripts)
- [Manual Static Build Process](#manual-static-build-process)
- [Deployment Options](#deployment-options)
- [Verifying Generated Book Pages](#verifying-generated-book-pages)

## Overview

EbookAura can be deployed as a static site without requiring a Node.js server. This approach offers several advantages:

- **Improved Performance**: Static sites load faster as they don't require server-side rendering.
- **Lower Hosting Costs**: Static hosting is typically cheaper or even free on many platforms.
- **Better Security**: Reduced attack surface with no server-side logic.
- **Global Distribution**: Easy to distribute via CDNs for better global performance.

The static generation process pre-renders all pages, including dynamic book pages with their IDs, during the build process.

## Prerequisites

Before generating a static version of EbookAura, ensure you have:

1. Node.js 16.x or newer installed
2. npm 7.x or newer installed
3. The complete EbookAura codebase
4. Access to the book API or a list of all book IDs to include in the static build

## Static Generation Process

At a high level, the static generation process works as follows:

1. **Prepare Book IDs**: Create a list of all book IDs that should be included in the static build.
2. **Configure Environment**: Set up the necessary environment variables for static export.
3. **Build Process**: Run the Next.js build process with the static export option.
4. **Verify Results**: Check that all critical book pages were successfully generated.
5. **Deploy**: Deploy the generated static files to a hosting service.

## Troubleshooting Common Issues

### Missing Book ID Issue

A common issue with static generation is that some book IDs might not be included in the static build, resulting in 404 errors when users try to access those book pages. We've provided tools to ensure that all critical book IDs are included in the build.

#### Symptoms of the Missing Book ID Issue:

- 404 errors when accessing specific book pages
- Missing book directories in the `out/books` folder
- Error messages during build about failed fetches for specific book IDs

#### Resolution:

The solution involves ensuring that the `generateStaticParams` function in the book page component (`src/app/books/[id]/page.js`) explicitly includes all critical book IDs, even if they cannot be fetched from the API during build time.

We've fixed this by:

1. Creating a `STATIC_BOOKS.js` file with critical book IDs
2. Modifying the `generateStaticParams` function to include these IDs
3. Adding fallback mechanisms to ensure the IDs are included even if API requests fail

## Using the Automated Build Scripts

We've created automated scripts to streamline the static generation process and avoid common issues.

### Windows (PowerShell)

To build the static site on Windows:

1. Open PowerShell in the project directory
2. Run the script:
   ```powershell
   .\static-build.ps1
   ```

### Unix-like Systems (Linux/Mac)

To build the static site on Linux or Mac:

1. Open a terminal in the project directory
2. Make the script executable:
   ```bash
   chmod +x static-build.sh
   ```
3. Run the script:
   ```bash
   ./static-build.sh
   ```

### Windows (Command Prompt)

To build the static site using the batch file:

1. Open Command Prompt in the project directory
2. Run the script:
   ```cmd
   static-generation-fix.bat
   ```

## Manual Static Build Process

If you prefer to manually build the static site, follow these steps:

1. Create the `src/app/utils/STATIC_BOOKS.js` file with critical book IDs:
   ```javascript
   const STATIC_BOOKS = [
     '681859bd560ce1fd792c2745',  // Previously problematic ID
     '6807c9d24fb1873f72080fb1',
     '6807be6cf05cdd8f4bdf933c',
     '6803d0c8cd7950184b1e8cf3',
     '680735665ceba10744914991',
   ];
   
   export default STATIC_BOOKS;
   ```

2. Create or update `.env.local` with:
   ```
   NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
   STATIC_EXPORT=true
   ```

3. Clean previous build directories:
   ```bash
   rm -rf .next out
   # or on Windows
   rmdir /s /q .next out
   ```

4. Set environment variables and run the build:
   ```bash
   # Unix-like systems
   export STATIC_EXPORT=true
   export NODE_ENV=production
   npm run build
   
   # Windows PowerShell
   $env:STATIC_EXPORT="true"
   $env:NODE_ENV="production"
   npm run build
   
   # Windows Command Prompt
   set STATIC_EXPORT=true
   set NODE_ENV=production
   npm run build
   ```

5. Verify that all critical book pages were generated in the `out/books` directory.

## Deployment Options

After generating the static site, you can deploy it to various hosting services:

### Netlify

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Deploy the site: `netlify deploy --dir=out --prod`

### Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy the site: `vercel --prod`

### GitHub Pages

1. Push the `out` directory to the `gh-pages` branch
2. Configure GitHub Pages to serve from this branch

### AWS S3 + CloudFront

1. Upload the contents of the `out` directory to an S3 bucket
2. Set up CloudFront distribution pointing to the S3 bucket
3. Configure CloudFront for SPA routing

## Verifying Generated Book Pages

To ensure all critical book pages have been generated:

1. Check the `out/books` directory for all critical book ID folders
2. Use the verification scripts included in the automated build process
3. Manually test accessing critical book pages in the deployed static site

The most important book IDs to verify are:

- `681859bd560ce1fd792c2745` (previously problematic ID)
- `6807c9d24fb1873f72080fb1`
- `6807be6cf05cdd8f4bdf933c`
- `6803d0c8cd7950184b1e8cf3`
- `680735665ceba10744914991`

If any of these are missing, refer to the troubleshooting section or use one of the automated build scripts. 