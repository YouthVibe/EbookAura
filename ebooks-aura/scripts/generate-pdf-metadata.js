/**
 * PDF Metadata and Enhanced Sitemap Generator
 * 
 * This script:
 * 1. Fetches all books from the API
 * 2. Generates enhanced metadata for each PDF
 * 3. Creates metadata files for each PDF
 * 4. Enhances the sitemap with book details and structured data
 */

const fs = require('fs');
const path = require('path');
let fetch, format;

// Dynamically import dependencies to support both CommonJS and ESM
async function importDependencies() {
  try {
    // Try to import node-fetch
    try {
      fetch = require('node-fetch');
    } catch (err) {
      console.log('Failed to load node-fetch with require, attempting dynamic import...');
      const nodeFetch = await import('node-fetch');
      fetch = nodeFetch.default;
    }

    // Try to import date-fns
    try {
      const dateFns = require('date-fns');
      format = dateFns.format;
    } catch (err) {
      console.log('Failed to load date-fns with require, attempting dynamic import...');
      const dateFns = await import('date-fns');
      format = dateFns.format;
    }

    return true;
  } catch (error) {
    console.error(`Error importing dependencies: ${error.message}`);
    console.error('Please ensure node-fetch@2 and date-fns are installed:');
    console.error('  npm install --no-save node-fetch@2 date-fns');
    return false;
  }
}

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ebookaura.onrender.com/api';
const OUTPUT_DIR = path.join(__dirname, '../public/pdf-metadata');
const SITEMAP_FILE = path.join(__dirname, '../public/sitemap.xml');
const STATIC_BOOKS_PATH = path.join(__dirname, '../src/app/utils/STATIC_BOOKS.js');

// Log with timestamp
const logWithTime = (message) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
};

// Create output directory if it doesn't exist
const ensureOutputDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logWithTime(`Created output directory: ${OUTPUT_DIR}`);
  }
};

// Function to extract book IDs from the STATIC_BOOKS.js file
const getStaticBookIds = () => {
  try {
    const fileContent = fs.readFileSync(STATIC_BOOKS_PATH, 'utf8');
    const regex = /'([a-f0-9]{24})'/g;
    const matches = Array.from(fileContent.matchAll(regex));
    return matches.map(match => match[1]);
  } catch (error) {
    logWithTime(`Error reading STATIC_BOOKS.js: ${error.message}`);
    return [];
  }
};

// Fetch all books from the API
const fetchAllBooks = async () => {
  try {
    logWithTime(`Fetching books from API: ${API_URL}/books?limit=500`);
    const response = await fetch(`${API_URL}/books?limit=500`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }
    
    const data = await response.json();
    let books = [];
    
    // Handle different response formats
    if (Array.isArray(data)) {
      books = data;
      logWithTime(`Found ${books.length} books from API (array format)`);
    } else if (data.books && Array.isArray(data.books)) {
      books = data.books;
      logWithTime(`Found ${books.length} books from API (object format)`);
    }
    
    return books;
  } catch (error) {
    logWithTime(`Error fetching books from API: ${error.message}`);
    return [];
  }
};

// Format file size for display
const formatFileSize = (sizeInBytes) => {
  if (!sizeInBytes) return 'Unknown size';
  
  const kb = sizeInBytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb * 10) / 10} KB`;
  }
  const mb = kb / 1024;
  return `${Math.round(mb * 10) / 10} MB`;
};

// Get book covers (if available)
const getBookCover = async (book, bookId) => {
  // If book already has a cover image URL
  if (book.coverImage && book.coverImage.startsWith('http')) {
    return book.coverImage;
  }
  
  // If book has a local cover image
  if (book.coverImage) {
    return `${SITE_URL}${book.coverImage.startsWith('/') ? '' : '/'}${book.coverImage}`;
  }
  
  // Try to fetch book cover from API
  try {
    const coverUrl = `${API_URL}/books/${bookId}/cover`;
    const response = await fetch(coverUrl, { method: 'HEAD' });
    
    if (response.ok) {
      return coverUrl;
    }
  } catch (error) {
    // Silently fail for cover check, will use default
  }
  
  // Return default cover
  return `${SITE_URL}/images/default-cover.jpg`;
};

// Generate PDF metadata for a book
const generatePdfMetadata = async (book) => {
  const id = book._id || book.id;
  
  // Skip if no ID
  if (!id) {
    logWithTime(`Skipping book without ID: ${book.title || 'Unknown title'}`);
    return null;
  }
  
  try {
    const coverUrl = await getBookCover(book, id);
    
    // Generate metadata for the PDF
    const metadata = {
      id: id,
      title: book.title || 'Untitled Book',
      author: book.author || 'Unknown Author',
      description: book.description || `Read ${book.title || 'this book'} online or download as PDF.`,
      coverImage: coverUrl,
      fileSize: book.fileSize ? formatFileSize(book.fileSize) : 'Unknown size',
      pageCount: book.pageCount || null,
      language: book.language || 'en',
      isbn: book.isbn || null,
      publicationDate: book.publicationDate || null,
      publisher: book.publisher || null,
      categories: book.categories || [],
      tags: book.tags || [],
      rating: book.averageRating || null,
      downloadUrl: `${SITE_URL}/books/${id}/download`,
      viewUrl: `${SITE_URL}/books/${id}`,
      lastModified: format(new Date(), 'yyyy-MM-dd'),
    };
    
    return metadata;
  } catch (error) {
    logWithTime(`Error generating metadata for book ${id}: ${error.message}`);
    return null;
  }
};

// Save metadata to JSON file
const saveMetadataToFile = (metadata) => {
  const filePath = path.join(OUTPUT_DIR, `${metadata.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  return filePath;
};

// Generate a cover image HTML file
const generateCoverHtml = (metadata) => {
  const filePath = path.join(OUTPUT_DIR, `${metadata.id}.html`);
  
  // Create clean description for SEO (limit length and remove quotes)
  const cleanDescription = metadata.description
    ? metadata.description.substring(0, 160).replace(/"/g, '&quot;')
    : `Read ${metadata.title} by ${metadata.author} online at EbookAura.`;
  
  // Create keyword list based on book properties
  const keywordsList = [
    metadata.title,
    metadata.author,
    'PDF',
    'ebook',
    'free book',
    'online reading',
    metadata.categories?.join(', ') || '',
    metadata.tags?.join(', ') || '',
    'download pdf'
  ].filter(Boolean).join(', ');
  
  // Format the publish date properly if available
  const publishDate = metadata.publicationDate 
    ? new Date(metadata.publicationDate).toISOString().split('T')[0]
    : '';
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-WXYZABC');</script>
  <!-- End Google Tag Manager -->

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-ABCDEFGHIJ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-ABCDEFGHIJ');
  </script>
  <!-- End Google Analytics -->

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title} by ${metadata.author} | PDF Book | EbookAura</title>
  
  <!-- Standard metadata -->
  <meta name="description" content="${cleanDescription}">
  <meta name="author" content="${metadata.author}">
  <meta name="keywords" content="${keywordsList}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="book">
  <meta property="og:url" content="${metadata.viewUrl}">
  <meta property="og:title" content="${metadata.title} by ${metadata.author} | PDF Book">
  <meta property="og:description" content="${cleanDescription}">
  <meta property="og:image" content="${metadata.coverImage}">
  <meta property="og:site_name" content="EbookAura">
  <meta property="book:author" content="${metadata.author}">
  ${metadata.isbn ? `<meta property="book:isbn" content="${metadata.isbn}">` : ''}
  ${metadata.pageCount ? `<meta property="book:page_count" content="${metadata.pageCount}">` : ''}
  ${publishDate ? `<meta property="book:release_date" content="${publishDate}">` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${metadata.viewUrl}">
  <meta property="twitter:title" content="${metadata.title} by ${metadata.author}">
  <meta property="twitter:description" content="${cleanDescription}">
  <meta property="twitter:image" content="${metadata.coverImage}">
  
  <!-- Canonical link -->
  <link rel="canonical" href="${metadata.viewUrl}">
  
  <!-- Stylesheet -->
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      color: #333;
    }
    .container {
      max-width: 1000px;
      margin: 40px auto;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .book-info {
      display: flex;
      flex-direction: row;
      width: 100%;
      gap: 30px;
    }
    .cover-container {
      flex: 0 0 300px;
    }
    .cover-image {
      width: 300px;
      height: auto;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .details {
      flex: 1;
    }
    h1 {
      margin-top: 0;
      color: #333;
      font-size: 32px;
    }
    .author {
      color: #666;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .description {
      color: #444;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .metadata {
      display: grid;
      grid-template-columns: 120px 1fr;
      row-gap: 10px;
      column-gap: 20px;
      margin-bottom: 30px;
    }
    .label {
      font-weight: bold;
      color: #777;
    }
    .value {
      color: #333;
    }
    .buttons {
      display: flex;
      gap: 15px;
      margin-top: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4a6fa5;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #385d8a;
    }
    .visit-button {
      background-color: #47a8bd;
    }
    .visit-button:hover {
      background-color: #3a8a9e;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .seo-text {
      margin-top: 30px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: #555;
    }
    .related-info {
      margin-top: 30px;
      width: 100%;
    }
    .related-info h3 {
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      color: #555;
    }
    .breadcrumbs {
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
    }
    .breadcrumbs a {
      color: #4a6fa5;
      text-decoration: none;
    }
    .breadcrumbs a:hover {
      text-decoration: underline;
    }
    @media (max-width: 768px) {
      .book-info {
        flex-direction: column;
      }
      .cover-container {
        margin-bottom: 20px;
        width: 100%;
        display: flex;
        justify-content: center;
      }
      .cover-image {
        width: 200px;
      }
    }
  </style>
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WXYZABC"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <div class="container">
    <div class="breadcrumbs">
      <a href="${SITE_URL}">Home</a> &gt; 
      <a href="${SITE_URL}/search">Books</a> &gt; 
      ${metadata.categories && metadata.categories.length ? 
        `<a href="${SITE_URL}/search?category=${encodeURIComponent(metadata.categories[0])}">${metadata.categories[0]}</a> &gt; ` : 
        ''}
      <span>${metadata.title}</span>
    </div>
  
    <div class="book-info">
      <div class="cover-container">
        <img class="cover-image" src="${metadata.coverImage}" alt="Cover of ${metadata.title} by ${metadata.author}" title="${metadata.title} by ${metadata.author}">
      </div>
      <div class="details">
        <h1>${metadata.title}</h1>
        <div class="author">by ${metadata.author}</div>
        <div class="description">${metadata.description}</div>
        
        <div class="metadata">
          ${metadata.fileSize ? `<div class="label">Size:</div><div class="value">${metadata.fileSize}</div>` : ''}
          ${metadata.pageCount ? `<div class="label">Pages:</div><div class="value">${metadata.pageCount}</div>` : ''}
          ${metadata.language ? `<div class="label">Language:</div><div class="value">${metadata.language}</div>` : ''}
          ${metadata.publisher ? `<div class="label">Publisher:</div><div class="value">${metadata.publisher}</div>` : ''}
          ${metadata.publicationDate ? `<div class="label">Published:</div><div class="value">${metadata.publicationDate}</div>` : ''}
          ${metadata.isbn ? `<div class="label">ISBN:</div><div class="value">${metadata.isbn}</div>` : ''}
          ${metadata.rating ? `<div class="label">Rating:</div><div class="value">${metadata.rating} / 5</div>` : ''}
          ${metadata.categories && metadata.categories.length ? `<div class="label">Categories:</div><div class="value">${metadata.categories.join(', ')}</div>` : ''}
          ${metadata.tags && metadata.tags.length ? `<div class="label">Tags:</div><div class="value">${metadata.tags.join(', ')}</div>` : ''}
        </div>
        
        <div class="buttons">
          <a href="${metadata.viewUrl}" class="button visit-button" onclick="gtag('event', 'click', {'event_category': 'PDF', 'event_label': '${metadata.title}'});">Visit PDF</a>
        </div>
      </div>
    </div>
    
    <div class="seo-text">
      <h2>About "${metadata.title}" PDF</h2>
      <p>Download or read "${metadata.title}" by ${metadata.author} in PDF format. This ${metadata.categories && metadata.categories.length ? metadata.categories.join(' and ') : ''} book is available online at EbookAura. ${metadata.fileSize ? `The file size is ${metadata.fileSize}` : ''} ${metadata.pageCount ? `and contains ${metadata.pageCount} pages` : ''}.</p>
      <p>EbookAura offers a wide selection of free PDF books that you can read online or download. Our digital library includes popular titles in various categories including fiction, non-fiction, academic, and reference books.</p>
    </div>
    
    <div class="related-info">
      <h3>Related Information</h3>
      <p>To access this PDF and more books by ${metadata.author}, visit <a href="${SITE_URL}">EbookAura</a>. We provide a user-friendly interface for reading ${metadata.categories && metadata.categories.length ? metadata.categories.join(', ') : 'various'} books online.</p>
      <p>Looking for similar books? Browse our <a href="${SITE_URL}/search">complete collection</a> or check out the ${metadata.categories && metadata.categories.length ? `<a href="${SITE_URL}/search?category=${encodeURIComponent(metadata.categories[0])}">${metadata.categories[0]} category</a>` : 'various categories'}.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} EbookAura - Your Digital Library Companion</p>
    </div>
  </div>
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": "${metadata.title}",
    "author": {
      "@type": "Person",
      "name": "${metadata.author}"
    },
    "url": "${metadata.viewUrl}",
    "workExample": {
      "@type": "Book",
      "bookFormat": "http://schema.org/EBook",
      "potentialAction": {
        "@type": "ReadAction",
        "target": "${metadata.viewUrl}"
      }
    },
    ${metadata.isbn ? `"isbn": "${metadata.isbn}",` : ''}
    ${publishDate ? `"datePublished": "${publishDate}",` : ''}
    ${metadata.publisher ? `"publisher": { "@type": "Organization", "name": "${metadata.publisher}" },` : ''}
    ${metadata.pageCount ? `"numberOfPages": ${metadata.pageCount},` : ''}
    "description": "${cleanDescription}",
    "image": "${metadata.coverImage}"
    ${metadata.categories && metadata.categories.length ? `,"genre": "${metadata.categories[0]}"` : ''}
  }
  </script>
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${metadata.title} by ${metadata.author} | PDF Book | EbookAura",
    "description": "${cleanDescription}",
    "publisher": {
      "@type": "Organization",
      "name": "EbookAura",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/images/logo.png"
      }
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "EbookAura",
      "url": "${SITE_URL}"
    }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "${SITE_URL}"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Books",
        "item": "${SITE_URL}/search"
      }${metadata.categories && metadata.categories.length ? `,
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${metadata.categories[0]}",
        "item": "${SITE_URL}/search?category=${encodeURIComponent(metadata.categories[0])}"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "${metadata.title}",
        "item": "${metadata.viewUrl}"
      }` : `,
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${metadata.title}",
        "item": "${metadata.viewUrl}"
      }`}
    ]
  }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(filePath, html);
  return filePath;
};

// Generate enhanced sitemap with book information
const generateEnhancedSitemap = async (books) => {
  logWithTime('Generating enhanced sitemap with book information...');
  
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Start XML content
  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Homepage -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Main sections -->
  <url>
    <loc>${SITE_URL}/search</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${SITE_URL}/bookmarks</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${SITE_URL}/coins</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Category Pages -->
  <url>
    <loc>${SITE_URL}/search?category=fiction</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${SITE_URL}/search?category=non-fiction</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${SITE_URL}/search?category=science</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${SITE_URL}/search?category=technology</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${SITE_URL}/search?category=biography</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${SITE_URL}/search?category=history</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;

  // Add each book to the sitemap with enhanced information
  for (const book of books) {
    const id = book._id || book.id;
    if (!id) continue;
    
    // Ensure book has title and author
    const title = book.title || 'Untitled Book';
    const author = book.author || 'Unknown Author';
    const coverImage = book.metadata?.coverImage || `${SITE_URL}/images/default-cover.jpg`;
    
    xmlContent += `
  <!-- PDF Book: ${title} -->
  <url>
    <loc>${SITE_URL}/books/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${coverImage}</image:loc>
      <image:title>${title} by ${author}</image:title>
      <image:caption>Cover image for ${title}</image:caption>
    </image:image>`;
    
    // Add metadata pages
    xmlContent += `
    <xhtml:link 
      rel="alternate" 
      hreflang="en" 
      href="${SITE_URL}/pdf-metadata/${id}.html" 
    />`;
    
    xmlContent += `
  </url>

  <!-- PDF Metadata Page: ${title} -->
  <url>
    <loc>${SITE_URL}/pdf-metadata/${id}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <image:image>
      <image:loc>${coverImage}</image:loc>
      <image:title>${title} by ${author}</image:title>
      <image:caption>Cover image for ${title}</image:caption>
    </image:image>
  </url>`;
  }

  // Close XML
  xmlContent += `
</urlset>`;

  // Write to file
  fs.writeFileSync(SITEMAP_FILE, xmlContent);
  logWithTime(`Enhanced sitemap written to: ${SITEMAP_FILE}`);
  return true;
};

// Main function to process all books
const processAllBooks = async () => {
  // Ensure output directory exists
  ensureOutputDir();
  
  // Get books from API
  const apiBooks = await fetchAllBooks();
  
  // Process each book to generate metadata
  const processedBooks = [];
  let successCount = 0;
  let errorCount = 0;
  
  logWithTime(`Processing ${apiBooks.length} books for metadata generation...`);
  
  for (const book of apiBooks) {
    try {
      // Generate metadata for the book
      const metadata = await generatePdfMetadata(book);
      
      if (metadata) {
        // Save metadata to file
        const jsonPath = saveMetadataToFile(metadata);
        logWithTime(`Generated metadata JSON: ${path.basename(jsonPath)}`);
        
        // Generate cover HTML
        const htmlPath = generateCoverHtml(metadata);
        logWithTime(`Generated metadata HTML: ${path.basename(htmlPath)}`);
        
        // Store metadata with the book for sitemap generation
        book.metadata = metadata;
        processedBooks.push(book);
        successCount++;
      }
    } catch (error) {
      logWithTime(`Error processing book ${book._id || book.id || 'unknown'}: ${error.message}`);
      errorCount++;
    }
  }
  
  // Generate enhanced sitemap
  await generateEnhancedSitemap(processedBooks);
  
  // Log summary
  logWithTime(`=== PDF Metadata Generation Summary ===`);
  logWithTime(`Total books processed: ${apiBooks.length}`);
  logWithTime(`Successful: ${successCount}`);
  logWithTime(`Failed: ${errorCount}`);
  logWithTime(`Metadata files stored in: ${OUTPUT_DIR}`);
  logWithTime(`Enhanced sitemap generated: ${SITEMAP_FILE}`);
};

// Main execution function
async function main() {
  try {
    logWithTime('Starting PDF metadata and enhanced sitemap generation...');
    
    // First import dependencies
    logWithTime('Importing dependencies...');
    const dependenciesLoaded = await importDependencies();
    
    if (!dependenciesLoaded) {
      process.exit(1);
    }
    
    // Process all books
    await processAllBooks();
    logWithTime('PDF metadata and enhanced sitemap generation completed successfully');
  } catch (error) {
    logWithTime(`Error in PDF metadata generation: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 