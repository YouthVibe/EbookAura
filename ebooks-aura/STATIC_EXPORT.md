# Static Export Guide for EbookAura

This document explains how to generate a fully static version of the EbookAura application.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Understanding Static Export in Next.js

As of Next.js 13+ and especially in Next.js 15.3, static export is configured through the `output: 'export'` option in `next.config.mjs`. This replaces the older `next export` command.

In our project, we conditionally set this option based on the `STATIC_EXPORT` environment variable:

```js
// next.config.mjs (excerpt)
const nextConfig = {
  // Conditional configuration based on environment
  ...(process.env.STATIC_EXPORT === 'true' ? {
    // Static export configuration
    output: 'export',
    images: {
      unoptimized: true, // Required for static export
    },
    // ...other static config
  } : {
    // Development configuration
    // ...
  }),
};
```

## API Routes in Static Exports

For any API routes in a static export, you must configure them with either:

- `export const dynamic = "force-static"` 
- `export const revalidate = [number]` 

This ensures Next.js knows how to handle these routes during static generation.

## How to Generate Static Build

### Option 1: Using the Script

The easiest way to generate a static build is to use the provided batch script:

```bash
./static-build-fixed.bat
```

This script:
1. Sets the necessary environment variables
2. Cleans previous builds
3. Installs dependencies if needed
4. Runs the static build process

### Option 2: Using npm Scripts

Alternatively, you can use the predefined npm scripts:

```bash
# For production API
npm run build:static:prod

# For development API 
npm run build:static:dev
```

### Option 3: Manual Build

If you need more control:

```bash
# Clean previous builds
npx rimraf .next out

# Set environment variables and build
cross-env STATIC_EXPORT=true NODE_ENV=production NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api next build
```

## Testing the Static Build

After building, you can test the static site locally:

```bash
npm run serve
```

This will start a local server (typically on port 3000) serving your static files.

## Deployment

The static build will be in the `out` directory. You can deploy these files to any static hosting service like:

- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any other static file host

Just upload the contents of the `out` directory to your chosen hosting service.

## Troubleshooting

### Common Issues

1. **Missing Dynamic Configuration**:
   If you get an error about missing `dynamic` or `revalidate` configuration, you need to add it to your API route.

2. **Image Optimization**:
   Static exports require `unoptimized: true` in the images config.

3. **Server-Side Logic**:
   Remember that in a static export, server-side logic only runs at build time, not at request time.

### Getting Help

If you encounter any issues not covered here, please check the [Next.js documentation on static exports](https://nextjs.org/docs/advanced-features/static-html-export) or open an issue in the project repository. 