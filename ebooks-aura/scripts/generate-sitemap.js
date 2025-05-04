/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Sitemap Generator Script
 * 
 * This script generates a sitemap.xml file for the EbookAura website
 * It includes:
 * - Main pages (home, search, etc.)
 * - Book pages from STATIC_BOOKS list
 * - Book pages from the API (if available)
 * - Category pages
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { format } = require('date-fns');

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ebookaura.onrender.com/api';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml');
const STATIC_BOOKS_PATH = path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js');

// Categories to include in the sitemap
const CATEGORIES = [
  'fiction',
  'non-fiction',
  'science',
  'technology',
  'biography',
  'history',
  'programming',
  'self-development',
  'philosophy'
];

// Main pages with their priorities and change frequencies
const MAIN_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/search', priority: '0.9', changefreq: 'daily' },
  { path: '/bookmarks', priority: '0.7', changefreq: 'weekly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/coins', priority: '0.6', changefreq: 'monthly' },
  { path: '/plans', priority: '0.6', changefreq: 'monthly' }
];

// Log with timestamp
const logWithTime = (message) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
};

// Function to extract book IDs from the STATIC_BOOKS.js file
const getStaticBookIds = () => {
  try {
    // Read the STATIC_BOOKS.js file
    const fileContent = fs.readFileSync(STATIC_BOOKS_PATH, 'utf8');
    
    // Extract book IDs using regex
    const regex = /'([a-f0-9]{24})'/g;
    const matches = Array.from(fileContent.matchAll(regex));
    
    // Return array of book IDs
    return matches.map(match => match[1]);
  } catch (error) {
    logWithTime(`Error reading STATIC_BOOKS.js: ${error.message}`);
    return [];
  }
};

// Function to fetch books from the API
const fetchApiBooks = async () => {
  try {
    logWithTime(`Fetching books from API: ${API_URL}/books?limit=500`);
    const response = await fetch(`${API_URL}/books?limit=500`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      logWithTime(`Found ${data.length} books from API (array format)`);
      return data;
    } else if (data.books && Array.isArray(data.books)) {
      logWithTime(`Found ${data.books.length} books from API (object format)`);
      return data.books;
    }
    
    return [];
  } catch (error) {
    logWithTime(`Error fetching books from API: ${error.message}`);
    return [];
  }
};

// Function to get book details from the API
const getBookDetails = async (id) => {
  try {
    logWithTime(`Fetching details for book ${id}`);
    const response = await fetch(`${API_URL}/books/${id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch book details: ${response.status}`);
    }
    
    const book = await response.json();
    return book;
  } catch (error) {
    logWithTime(`Error fetching book details: ${error.message}`);
    return null;
  }
};

// Get book cover URL (with fallback)
const getBookCoverUrl = (book) => {
  if (!book) return `${SITE_URL}/images/default-cover.jpg`;
  
  if (book.coverImage) {
    if (book.coverImage.startsWith('http')) {
      return book.coverImage;
    } else {
      return `${SITE_URL}${book.coverImage.startsWith('/') ? '' : '/'}${book.coverImage}`;
    }
  }
  
  return `${SITE_URL}/images/default-cover.jpg`;
};

// Function to generate the sitemap XML
const generateSitemap = async () => {
  logWithTime('Starting sitemap generation...');
  
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Start XML content
  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

  // 1. Add main pages
  logWithTime('Adding main pages to sitemap...');
  MAIN_PAGES.forEach(page => {
    xmlContent += `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // 2. Add category pages
  logWithTime('Adding category pages to sitemap...');
  CATEGORIES.forEach(category => {
    xmlContent += `
  <url>
    <loc>${SITE_URL}/search?category=${encodeURIComponent(category)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // 3. Get book data
  // Start with static books
  const staticBookIds = getStaticBookIds();
  logWithTime(`Found ${staticBookIds.length} books in static list`);
  
  // Try to fetch books from API with full details
  const apiBooks = await fetchApiBooks();
  
  // Create a map of books by ID
  const booksMap = new Map();
  
  // Add API books to the map
  apiBooks.forEach(book => {
    const id = book._id || book.id;
    if (id) {
      booksMap.set(id, book);
    }
  });
  
  // Make sure all static books are included
  for (const id of staticBookIds) {
    if (!booksMap.has(id)) {
      // Try to fetch details for this book
      const bookDetails = await getBookDetails(id);
      if (bookDetails) {
        booksMap.set(id, bookDetails);
      } else {
        // Add minimal book entry
        booksMap.set(id, { _id: id, title: `Book ${id}` });
      }
    }
  }
  
  logWithTime(`Total unique books: ${booksMap.size}`);
  
  // 4. Add book pages with enhanced metadata
  logWithTime('Adding book pages to sitemap with enhanced metadata...');
  
  for (const [id, book] of booksMap.entries()) {
    // Basic properties with fallbacks
    const title = book.title || `Book ${id}`;
    const author = book.author || 'Unknown Author';
    const description = book.description || `Read ${title} by ${author} online at EbookAura.`;
    const coverUrl = getBookCoverUrl(book);
    const pdfMetadataUrl = `${SITE_URL}/pdf-metadata/${id}.html`;
    
    // Add the main book URL
    xmlContent += `
  <url>
    <loc>${SITE_URL}/books/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${coverUrl}</image:loc>
      <image:title>${title} by ${author}</image:title>
      <image:caption>Cover image for ${title}</image:caption>
    </image:image>
    <xhtml:link 
      rel="alternate" 
      hreflang="en" 
      href="${pdfMetadataUrl}" 
    />
  </url>`;
    
    // Add the PDF metadata URL
    xmlContent += `
  <url>
    <loc>${pdfMetadataUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <image:image>
      <image:loc>${coverUrl}</image:loc>
      <image:title>${title} by ${author}</image:title>
      <image:caption>Cover image for ${title}</image:caption>
    </image:image>
    <news:news>
      <news:publication>
        <news:name>EbookAura</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${today}</news:publication_date>
      <news:title>${title} by ${author}</news:title>
    </news:news>
  </url>`;
  }

  // Close XML
  xmlContent += `
</urlset>`;

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, xmlContent);
  logWithTime(`Sitemap written to: ${OUTPUT_FILE}`);
};

// Run the generator
(async () => {
  try {
    await generateSitemap();
    logWithTime('Sitemap generation completed successfully');
  } catch (error) {
    logWithTime(`Error generating sitemap: ${error.message}`);
    process.exit(1);
  }
})(); 