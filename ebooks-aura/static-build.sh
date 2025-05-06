#!/bin/bash

# EbookAura Static Build Shell Script
echo "===================================================="
echo "EbookAura Static Site Generator - Bash Edition"
echo "===================================================="
echo ""

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Step 1: Create critical book IDs file
echo "Step 1: Creating critical IDs file for static generation..."
echo ""

# Create directory if it doesn't exist
mkdir -p src/app/utils

# Get current timestamp
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S")

# Create the STATIC_BOOKS.js file with all critical IDs
cat > src/app/utils/STATIC_BOOKS.js << EOL
/**
 * Static book IDs for EbookAura static generation
 * Generated on: $timestamp
 *
 * These IDs must be included in the static site generation
 */

const STATIC_BOOKS = [
  // Critical book IDs - ALWAYS include these
  '681859bd560ce1fd792c2745',  // Previously problematic ID - must be included
  '6807c9d24fb1873f72080fb1',  // Critical book ID
  '6807be6cf05cdd8f4bdf933c',  // Critical book ID
  '6803d0c8cd7950184b1e8cf3',  // Critical book ID
  '680735665ceba10744914991',  // Additional critical ID from logs
];

export default STATIC_BOOKS;
EOL

echo "STATIC_BOOKS.js created successfully with the following critical IDs:"
echo "- 681859bd560ce1fd792c2745 (previously problematic ID)"
echo "- 6807c9d24fb1873f72080fb1"
echo "- 6807be6cf05cdd8f4bdf933c"
echo "- 6803d0c8cd7950184b1e8cf3"
echo "- 680735665ceba10744914991"
echo ""

# Step 2: Set up environment variables for static build
echo "Step 2: Setting up environment variables for static export..."
echo ""

# Create .env.local file with required variables
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
STATIC_EXPORT=true
EOL

echo "Environment variables set up in .env.local"
echo ""

# Step 3: Clean output directories to ensure a fresh build
echo "Step 3: Cleaning previous build directories..."
echo ""

if [ -d ".next" ]; then
    echo "Cleaning .next directory..."
    rm -rf .next
fi

if [ -d "out" ]; then
    echo "Cleaning out directory..."
    rm -rf out
fi

echo "Build directories cleaned successfully"
echo ""

# Step 4: Run the build with correct environment variables
echo "Step 4: Building static site..."
echo ""

# Set environment variables for the shell session
export STATIC_EXPORT=true
export NODE_ENV=production

# Run the build
npm run build

if [ $? -ne 0 ]; then
    echo "Error: Build failed! Check the error messages above."
    exit 1
fi

# Step 5: Verify the output directory
echo ""
echo "Step 5: Verifying static build output..."
echo ""

# Array of critical IDs to check
critical_ids=(
    "681859bd560ce1fd792c2745"
    "6807c9d24fb1873f72080fb1"
    "6807be6cf05cdd8f4bdf933c"
    "6803d0c8cd7950184b1e8cf3"
    "680735665ceba10744914991"
)

all_found=true

for id in "${critical_ids[@]}"; do
    if [ -d "out/books/$id" ]; then
        echo "✓ Found book directory for ID: $id"
    else
        echo "✗ Missing book directory for ID: $id"
        all_found=false
    fi
done

if $all_found; then
    echo ""
    echo "===================================================="
    echo "Static site generation completed successfully!"
    echo "===================================================="
    echo ""
    echo "The static site has been generated in the 'out' directory."
    echo "All critical book IDs are included in the build."
    echo ""
    echo "You can deploy these files to any static hosting service."
else
    echo ""
    echo "Warning: Some critical book directories were not created."
    echo "This might be due to API errors during the build process."
    echo "The static site is still usable but may be missing some book pages."
fi

echo ""
echo "Press Enter to continue..."
read 