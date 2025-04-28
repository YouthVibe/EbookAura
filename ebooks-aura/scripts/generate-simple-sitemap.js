/**
 * Simple Sitemap Generator for EbookAura
 * 
 * This script generates a sitemap.xml file without external dependencies.
 * It only includes static pages and paths from STATIC_BOOKS.js.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml');
const STATIC_BOOKS_PATH = path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js');

// Log with timestamp
const logWithTime = (message) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
};

// Categories to include
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

// Main static pages
const MAIN_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/search', priority: '0.9', changefreq: 'daily' },
  { path: '/bookmarks', priority: '0.7', changefreq: 'weekly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/coins', priority: '0.6', changefreq: 'monthly' },
  { path: '/plans', priority: '0.6', changefreq: 'monthly' }
];

// Function to get today's date in YYYY-MM-DD format
const getFormattedDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Extract book IDs from STATIC_BOOKS.js
const getStaticBookIds = () => {
  try {
    // If the file doesn't exist, return empty array
    if (!fs.existsSync(STATIC_BOOKS_PATH)) {
      logWithTime(`Warning: STATIC_BOOKS.js not found at ${STATIC_BOOKS_PATH}`);
      return [];
    }
    
    const fileContent = fs.readFileSync(STATIC_BOOKS_PATH, 'utf8');
    const regex = /'([a-f0-9]{24})'/g;
    const matches = Array.from(fileContent.matchAll(regex));
    const bookIds = matches.map(match => match[1]);
    
    logWithTime(`Found ${bookIds.length} book IDs in STATIC_BOOKS.js`);
    return bookIds;
  } catch (error) {
    logWithTime(`Error reading STATIC_BOOKS.js: ${error.message}`);
    return [];
  }
};

// Generate the sitemap
const generateSitemap = () => {
  logWithTime('Starting simple sitemap generation...');
  
  const today = getFormattedDate();
  
  // Start XML content
  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add main pages
  logWithTime('Adding main pages to sitemap...');
  
  for (const page of MAIN_PAGES) {
    xmlContent += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Add category pages
  logWithTime('Adding category pages to sitemap...');
  
  for (const category of CATEGORIES) {
    xmlContent += `  <url>
    <loc>${SITE_URL}/search?category=${encodeURIComponent(category)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  // Add book pages from STATIC_BOOKS.js
  const bookIds = getStaticBookIds();
  
  logWithTime(`Adding ${bookIds.length} book pages to sitemap...`);
  
  for (const id of bookIds) {
    xmlContent += `  <url>
    <loc>${SITE_URL}/books/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Close XML
  xmlContent += `</urlset>`;

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, xmlContent);
  logWithTime(`Sitemap generated successfully: ${OUTPUT_FILE}`);
};

// Run the generator
try {
  generateSitemap();
} catch (error) {
  logWithTime(`Error generating sitemap: ${error.message}`);
  process.exit(1);
} 