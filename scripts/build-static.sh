#!/bin/bash

# EbookAura Static Site Builder for Unix-based systems
# This script builds a static version of the EbookAura frontend

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting EbookAura static site build process...${NC}"

# Check if we're in the right directory
if [ ! -f package.json ]; then
  echo -e "${RED}Error: package.json not found!${NC}"
  echo -e "${YELLOW}Please run this script from the ebooks-aura directory.${NC}"
  exit 1
fi

# Clean up previous build
echo -e "${YELLOW}Cleaning up previous build files...${NC}"
if [ -d ".next" ]; then
  rm -rf .next
  echo "Removed .next directory"
fi

if [ -d "out" ]; then
  rm -rf out
  echo "Removed out directory"
fi

# Create or update .env file
echo -e "${YELLOW}Setting up environment variables...${NC}"
echo "NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api" > .env
echo "STATIC_EXPORT=true" >> .env

echo -e "${YELLOW}Environment variables set:${NC}"
echo "NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api"
echo "STATIC_EXPORT=true"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies!${NC}"
    exit 1
  fi
fi

# Generate static book IDs
echo -e "${YELLOW}Generating static book IDs list...${NC}"
node scripts/generate-static-books.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to generate static book IDs list!${NC}"
  echo "Please check the error messages above."
  exit 1
fi

# Verify static parameters include all critical book IDs
echo -e "${YELLOW}Verifying static parameters...${NC}"
node scripts/verify-static-params.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Verification failed! Some critical book IDs are missing.${NC}"
  echo "Please check the error messages above."
  exit 1
fi

# Build the static site
echo -e "${YELLOW}Building static site...${NC}"
NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api STATIC_EXPORT=true npm run clean
NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api STATIC_EXPORT=true npx next build

# Verify output directory contains book pages
echo -e "${YELLOW}Verifying build output...${NC}"
if [ -d "out/books/6807c9d24fb1873f72080fb1" ]; then
  echo -e "${GREEN}✅ Critical book page found in output!${NC}"
else
  echo -e "${YELLOW}⚠️ Warning: Critical book page not found in output.${NC}"
  echo "The build may have completed but is missing expected pages."
fi

# Check if build was successful
if [ -d "out" ]; then
  echo -e "${GREEN}Build completed successfully!${NC}"
  echo -e "${YELLOW}To test the static site locally:${NC}"
  echo "  npx serve out"
  echo -e "${YELLOW}To deploy:${NC}"
  echo "  - Upload the contents of the 'out' directory to your web server"
  echo "  - Or deploy to GitHub Pages, Netlify, Vercel, etc."
else
  echo -e "${RED}Build output directory not found!${NC}"
  echo "Build may have failed. Please check the error messages above."
  exit 1
fi 