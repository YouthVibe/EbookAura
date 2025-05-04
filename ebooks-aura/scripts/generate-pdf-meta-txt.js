/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * PDF Meta.txt Generator
 * 
 * This script generates meta.txt files next to PDF metadata
 * to help search engines better index the content of your PDFs.
 * 
 * Some search engines look for adjacent meta.txt files when indexing PDFs.
 */

const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com';
const OUTPUT_DIR = path.join(__dirname, '../public/pdf-metadata');
const METADATA_FILES_PATTERN = path.join(OUTPUT_DIR, '*.json');

// Log with timestamp
const logWithTime = (message) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
};

// Ensure the output directory exists
const ensureOutputDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logWithTime(`Created output directory: ${OUTPUT_DIR}`);
  }
};

// Get all JSON metadata files
const getMetadataFiles = () => {
  try {
    // Get all .json files in the output directory
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(OUTPUT_DIR, file));
    
    logWithTime(`Found ${files.length} metadata JSON files`);
    return files;
  } catch (error) {
    logWithTime(`Error reading metadata files: ${error.message}`);
    return [];
  }
};

// Generate meta.txt for a book
const generateMetaTxt = (metadata) => {
  try {
    const bookId = metadata.id;
    const filePath = path.join(OUTPUT_DIR, `${bookId}.txt`);
    
    // Format date for metadata
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Create contents for meta.txt
    const content = `Title: ${metadata.title}
Author: ${metadata.author}
Subject: ${metadata.categories?.join(', ') || 'eBook'}
Keywords: ${metadata.title}, ${metadata.author}, PDF, eBook, ${metadata.categories?.join(', ') || ''}, ${metadata.tags?.join(', ') || ''}
Creator: EbookAura
Producer: EbookAura
CreationDate: ${metadata.publicationDate || today}
ModDate: ${today}
Tagged: yes
Pages: ${metadata.pageCount || 'Unknown'}
Encrypted: no
Language: ${metadata.language || 'en'}
Size: ${metadata.fileSize || 'Unknown'}
Description: ${metadata.description || `Read ${metadata.title} by ${metadata.author} online at EbookAura.`}
URL: ${metadata.viewUrl}
Copyright: © EbookAura
Publisher: ${metadata.publisher || 'EbookAura'}
${metadata.isbn ? `ISBN: ${metadata.isbn}` : ''}
Format: PDF
Digital Library: EbookAura
Online Reading: ${metadata.viewUrl}
Indexing Allowed: yes
`;
    
    // Write to file
    fs.writeFileSync(filePath, content);
    logWithTime(`Generated meta.txt: ${path.basename(filePath)}`);
    return filePath;
  } catch (error) {
    logWithTime(`Error generating meta.txt for book ${metadata.id}: ${error.message}`);
    return null;
  }
};

// Main function to process all metadata files
const processAllMetadataFiles = async () => {
  // Ensure output directory exists
  ensureOutputDir();
  
  // Get all metadata files
  const metadataFiles = getMetadataFiles();
  
  // Process each metadata file
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of metadataFiles) {
    try {
      // Read and parse JSON metadata
      const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
      
      // Generate meta.txt file
      if (metadata && metadata.id) {
        const txtPath = generateMetaTxt(metadata);
        if (txtPath) {
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        logWithTime(`Skipping invalid metadata file: ${file}`);
        errorCount++;
      }
    } catch (error) {
      logWithTime(`Error processing file ${file}: ${error.message}`);
      errorCount++;
    }
  }
  
  // Log summary
  logWithTime(`=== PDF meta.txt Generation Summary ===`);
  logWithTime(`Total files processed: ${metadataFiles.length}`);
  logWithTime(`Successful: ${successCount}`);
  logWithTime(`Failed: ${errorCount}`);
  logWithTime(`Files stored in: ${OUTPUT_DIR}`);
};

// Run the main function
(async () => {
  try {
    logWithTime('Starting PDF meta.txt generation...');
    await processAllMetadataFiles();
    logWithTime('PDF meta.txt generation completed successfully');
  } catch (error) {
    logWithTime(`Error in PDF meta.txt generation: ${error.message}`);
    process.exit(1);
  }
})(); 