# EbookAura Frontend Deployment Guide

This document provides comprehensive instructions for deploying the EbookAura frontend application to various environments, including development, staging, and production.

## Deployment Options

EbookAura's frontend can be deployed in two primary ways:

1. **Standard Next.js Deployment**: Server-side rendering with a Node.js server
2. **Static Export**: Pre-rendered static files that can be served from any static hosting service

Each option has different advantages depending on your infrastructure and requirements.

## Prerequisites

Before deploying EbookAura, ensure you have:

- Node.js 18.x or newer
- npm 8.x or newer
- Access to your deployment target (server credentials, cloud access, etc.)
- Environment variables configured
- Backend API available and accessible

## Environment Configuration

### Environment Variables

EbookAura uses environment variables for configuration. Create appropriate `.env` files:

- `.env.local` - Local development (not committed to version control)
- `.env.development` - Development build configuration
- `.env.production` - Production build configuration

Required variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-url.com/api

# Authentication
NEXT_PUBLIC_AUTH_DOMAIN=your-auth-domain.com

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# PDF Viewer
NEXT_PUBLIC_PDF_WORKER_URL=/pdf.worker.min.js

# Feature Flags
NEXT_PUBLIC_ENABLE_SUBSCRIPTION=true
NEXT_PUBLIC_ENABLE_SOCIAL_SHARING=true
```

### Multi-Environment Setup

For different environments, use different configuration files:

```bash
# Local development
npm run dev # Uses .env.local or .env.development

# Production build
npm run build # Uses .env.production
```

## Build Process

### Standard Next.js Build

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the production server
npm start
```

### Static Export

For static export (no server-side rendering at runtime):

```bash
# Install dependencies
npm install

# Generate static export
npm run build:static

# The static files will be in the 'out' directory
```

## Deployment Targets

### Vercel (Recommended)

Vercel is the simplest deployment option for Next.js applications:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy with automatic CI/CD

Example GitHub Action workflow for Vercel:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install -g vercel
        
      - name: Deploy to Vercel
        run: |
          vercel --token ${VERCEL_TOKEN} --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
```

### Netlify

Netlify is excellent for static exports:

1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run build:static`
3. Set the publish directory to `out`
4. Configure environment variables in the Netlify dashboard

Example `netlify.toml` configuration:

```toml
[build]
  command = "npm run build:static"
  publish = "out"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### AWS S3 + CloudFront

For high-performance static deployment:

1. Build the static export
2. Upload the `out` directory to an S3 bucket
3. Configure CloudFront to serve the S3 bucket
4. Set up appropriate caching and routing

```bash
# Build static export
npm run build:static

# Upload to S3
aws s3 sync out/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Docker Deployment

For containerized deployment:

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Start the app
CMD ["npm", "start"]
```

Build and run the Docker container:

```bash
# Build the Docker image
docker build -t ebookaura-frontend:latest .

# Run the Docker container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.example.com ebookaura-frontend:latest
```

## Static Asset Optimization

### Image Optimization

For optimal performance, optimize images in the `public` directory:

```bash
# Install image optimization tools
npm install -g sharp

# Create an image optimization script
# scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, '../public/images');
const files = fs.readdirSync(imageDir);

files.forEach(file => {
  if (file.match(/\.(jpg|jpeg|png)$/i)) {
    const filePath = path.join(imageDir, file);
    sharp(filePath)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(path.join(imageDir, `optimized-${file}`))
      .then(() => console.log(`Optimized ${file}`))
      .catch(err => console.error(`Error optimizing ${file}:`, err));
  }
});
```

### PDF Worker Configuration

Ensure PDF.js workers are properly configured:

```javascript
// In your webpack configuration (next.config.mjs)
config.resolve.alias = {
  ...config.resolve.alias,
  'pdfjs-dist': path.join(__dirname, 'node_modules/pdfjs-dist'),
};

// Copy worker file to public directory during build
// In package.json scripts
{
  "scripts": {
    "prepare-pdf-worker": "cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/",
    "build": "npm run prepare-pdf-worker && next build"
  }
}
```

## Automated Deployments

### Continuous Integration

Set up GitHub Actions for automated testing and building:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
```

### Continuous Deployment

For deploying to different environments:

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PROD_API_URL }}
          # Other production environment variables
          
      - name: Deploy
        # Deployment steps specific to your hosting platform
```

## Performance Optimization

### Cache Control

Configure caching headers for optimal performance:

```javascript
// next.config.mjs
module.exports = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*).js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};
```

### Content Delivery Network (CDN)

For global distribution, use a CDN:

1. Configure your CDN to point to your deployed application
2. Set appropriate cache headers
3. Enable HTTP/2 or HTTP/3 for faster delivery
4. Configure edge caching rules

## SEO Considerations

Generate a sitemap and robots.txt during build:

```bash
# Package.json scripts
{
  "scripts": {
    "build": "next build",
    "postbuild": "npm run generate-sitemap",
    "generate-sitemap": "node scripts/generate-sitemap.js"
  }
}
```

Create a sitemap generation script:

```javascript
// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function generateSitemap() {
  try {
    // Fetch all books from API
    const response = await axios.get('https://your-api-url.com/api/books');
    const books = response.data.books || [];
    
    // Base URLs
    const baseUrl = 'https://ebookaura.com';
    const staticPages = [
      '',
      '/about',
      '/login',
      '/register',
      '/books',
      '/search',
    ];
    
    // Generate XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add static pages
    staticPages.forEach(page => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}${page}</loc>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      sitemap += `  </url>\n`;
    });
    
    // Add book pages
    books.forEach(book => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/books/${book.id}</loc>\n`;
      sitemap += `    <changefreq>monthly</changefreq>\n`;
      sitemap += `    <priority>0.7</priority>\n`;
      sitemap += `  </url>\n`;
    });
    
    sitemap += '</urlset>';
    
    // Write to file
    fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully!');
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

generateSitemap();
```

## Monitoring and Logging

Set up monitoring for your deployed application:

### Error Monitoring

```javascript
// _app.js or layout.js
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
```

### Analytics

```javascript
// components/Analytics.js
import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
```

## Maintenance Mode

Create a maintenance mode that can be toggled:

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if maintenance mode is enabled via environment variable
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  // Check if the request is for an API or static asset
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isStaticAsset = request.nextUrl.pathname.startsWith('/_next/') || 
                         request.nextUrl.pathname.match(/\.(jpg|png|svg|css|js)$/);
  
  // Allow static assets during maintenance
  if (isStaticAsset) {
    return NextResponse.next();
  }
  
  // If in maintenance mode and not hitting excluded paths
  if (isMaintenanceMode && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance.html';
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!maintenance.html|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

Create a simple maintenance page:

```html
<!-- public/maintenance.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EbookAura - Maintenance</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
      background-color: #f8f9fa;
      color: #333;
    }
    .maintenance-container {
      max-width: 600px;
      padding: 40px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #4a69bd;
      margin-top: 0;
    }
    img {
      max-width: 200px;
      margin-bottom: 20px;
    }
    p {
      line-height: 1.6;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="maintenance-container">
    <img src="/logo.svg" alt="EbookAura Logo">
    <h1>We're Upgrading EbookAura</h1>
    <p>We're currently performing scheduled maintenance to improve your reading experience. We'll be back shortly!</p>
    <p>Thank you for your patience.</p>
    <p><small>Expected completion: <time id="completion-time">Soon</time></small></p>
  </div>
  <script>
    // You can update this dynamically if needed
    document.getElementById('completion-time').textContent = 'May 12, 2023 at 3:00 PM UTC';
  </script>
</body>
</html>
```

## Rollback Strategy

In case of deployment issues, have a rollback plan:

### Version Tagging

Tag each release for easy rollback:

```bash
# Before deployment
git tag v1.2.3
git push origin v1.2.3

# To rollback
git checkout v1.2.2
npm run build
# Deploy the previous version
```

### Blue-Green Deployment

For zero-downtime deployments:

1. Deploy new version to a staging environment
2. Test thoroughly
3. Switch traffic from current production (blue) to new version (green)
4. Keep blue environment ready for immediate rollback

## Post-Deployment Verification

After deploying, verify:

1. **Functionality**: Test core user flows
2. **Performance**: Check load times and Core Web Vitals
3. **Monitoring**: Ensure error tracking is working
4. **SEO**: Verify robots.txt and sitemap
5. **Security**: Run security scans

## Deployment Checklist

Use this checklist before each production deployment:

- [ ] All tests passing
- [ ] Code linting and formatting checks passed
- [ ] Built with production environment variables
- [ ] Optimized images and assets
- [ ] Generated up-to-date sitemap
- [ ] Backup of current version available
- [ ] Monitoring tools configured
- [ ] CDN cache invalidation ready
- [ ] Database migrations (if any) compatible
- [ ] API endpoints tested with new frontend
- [ ] Security headers configured

## Conclusion

This deployment guide covers the main scenarios for deploying the EbookAura frontend application. Each environment may require specific adjustments based on your infrastructure and requirements.

For support or questions, contact the development team. 