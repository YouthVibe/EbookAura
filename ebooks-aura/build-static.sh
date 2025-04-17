#!/bin/bash

# EbookAura Static Site Builder for Unix Systems
# This script builds a static version of the EbookAura frontend

# Print with colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting EbookAura static site build process...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
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

# Check if required packages are installed and install if needed
echo -e "${YELLOW}Checking for required packages...${NC}"
if ! grep -q "cross-env" package.json; then
  echo "Installing cross-env..."
  npm install --save-dev cross-env
fi

if ! grep -q "rimraf" package.json; then
  echo "Installing rimraf..."
  npm install --save-dev rimraf
fi

# Create or update .env file
echo -e "${YELLOW}Setting up environment variables...${NC}"
echo "NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api" > .env
echo "STATIC_EXPORT=true" >> .env

echo -e "${YELLOW}Environment variables set:${NC}"
echo "NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api"
echo "STATIC_EXPORT=true"

# Install dependencies if node_modules doesn't exist or is empty
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Build the static site
echo -e "${YELLOW}Building static site...${NC}"
npx cross-env NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api STATIC_EXPORT=true next build

# Check if build was successful
if [ -d "out" ]; then
  # Count files in the output directory
  FILE_COUNT=$(find out -type f | wc -l)
  
  echo -e "${GREEN}Build completed successfully!${NC}"
  echo -e "Generated ${FILE_COUNT} files in the 'out' directory."
  echo -e "${YELLOW}To test the static site locally:${NC}"
  echo -e "  npx serve out"
  echo -e "${YELLOW}To deploy:${NC}"
  echo -e "  - Upload the contents of the 'out' directory to your web server"
  echo -e "  - Or deploy to GitHub Pages, Netlify, Vercel, etc."
else
  echo -e "${RED}Build failed!${NC}"
  echo -e "Please check the error messages above."
  exit 1
fi 