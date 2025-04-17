#!/bin/bash

# EbookAura Static Site Build Script
echo "🚀 Building EbookAura static site..."

# Remove old build files
echo "🧹 Cleaning up old build files..."
rm -rf .next out

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install required build dependencies
echo "📦 Installing build dependencies..."
npm install cross-env rimraf --save-dev

# Build the static site
echo "🔨 Building static site..."
export NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
export STATIC_EXPORT=true
npm run clean
next build

# Success message
echo "✅ Static site built successfully!"
echo "📂 The static site files are in the 'out' directory"
echo ""
echo "🌐 To test the site locally, run: npm run serve"
echo "🚀 To deploy, upload the contents of the 'out' directory to your hosting provider" 