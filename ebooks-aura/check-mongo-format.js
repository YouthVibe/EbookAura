/**
 * MongoDB Format Test Script
 * 
 * This script tests the parsing of MongoDB Extended JSON format
 * to help diagnose issues with book data rendering.
 * 
 * Usage:
 * - Run this script with Node.js
 * - You can paste a MongoDB document as the first argument
 */

// Sample MongoDB document in extended JSON format
const sampleDocument = {
  "_id": {"$oid":"681a44642e7afd938f17b3bd"},
  "title": "Unit 7 The P-Block Elements",
  "author": "Crack JEE",
  "description": "Unit 7 The P-Block Elements Chemistry Notes for JEE",
  "coverImage": "https://res.cloudinary.com/dn0r4gcig/image/upload/v1746548996/ebook_aura/covers/kz9z85jlsfpglgm77u4i.jpg",
  "coverImageId": "ebook_aura/covers/kz9z85jlsfpglgm77u4i",
  "pdfUrl": "https://res.cloudinary.com/dn0r4gcig/raw/upload/v1746548998/ebook_aura/pdfs/Unit_7_The_P_Block__Elements_1746548996933",
  "pdfId": "ebook_aura/pdfs/Unit_7_The_P_Block__Elements_1746548996933",
  "pageSize": {"$numberInt":"44"},
  "category": "Chemistry",
  "tags": ["Chemistry", "JEE"],
  "averageRating": {"$numberInt":"0"},
  "views": {"$numberInt":"1"},
  "downloads": {"$numberInt":"0"},
  "uploadedBy": {"$oid":"67fe90c67420afcf47105e32"},
  "createdAt": {"$date":{"$numberLong":"1746548999470"}},
  "updatedAt": {"$date":{"$numberLong":"1746549952546"}},
  "__v": {"$numberInt":"0"},
  "fileSizeMB": {"$numberInt":"4"}
};

/**
 * Normalizes a MongoDB document, ensuring consistent types for key fields
 * Handles special MongoDB types like $numberLong, $oid, etc.
 */
function normalizeMongoDocument(doc) {
  if (!doc || typeof doc !== 'object') {
    return doc;
  }
  
  // Create a shallow copy to avoid modifying the original
  const normalized = { ...doc };
  
  // Handle MongoDB ObjectId (_id field)
  if (normalized._id) {
    if (typeof normalized._id === 'object' && normalized._id.$oid) {
      normalized._id = normalized._id.$oid;
    }
  }
  
  // Handle isPremium field
  if ('isPremium' in normalized) {
    // Convert to boolean, handling string values like 'true' and numeric values
    normalized.isPremium = 
      normalized.isPremium === true || 
      normalized.isPremium === 'true' || 
      normalized.isPremium === 1 ||
      String(normalized.isPremium).toLowerCase() === 'true';
  }
  
  // Handle price field
  if ('price' in normalized) {
    if (normalized.price && typeof normalized.price === 'object') {
      // Handle $numberLong format
      if (normalized.price.$numberLong) {
        normalized.price = Number(normalized.price.$numberLong);
      } else if (normalized.price.$numberInt) {
        normalized.price = Number(normalized.price.$numberInt);
      }
    } else {
      // Convert string price to number
      normalized.price = Number(normalized.price || 0);
    }
  }
  
  // Handle date fields
  const dateFields = ['createdAt', 'updatedAt', 'lastSignInDate', 'lastCoinReward'];
  
  dateFields.forEach(field => {
    if (normalized[field]) {
      if (typeof normalized[field] === 'object' && normalized[field].$date) {
        // Handle $date format
        if (typeof normalized[field].$date === 'object' && normalized[field].$date.$numberLong) {
          normalized[field] = new Date(Number(normalized[field].$date.$numberLong));
        } else {
          normalized[field] = new Date(normalized[field].$date);
        }
      } else if (typeof normalized[field] === 'string') {
        // Convert ISO string to Date object
        normalized[field] = new Date(normalized[field]);
      }
    }
  });
  
  // Handle numeric fields
  const numericFields = ['views', 'downloads', 'averageRating', 'pageSize', 'fileSizeMB', 'coins'];
  
  numericFields.forEach(field => {
    if (field in normalized) {
      if (typeof normalized[field] === 'object') {
        // Handle $numberInt or $numberLong format
        if (normalized[field].$numberInt) {
          normalized[field] = Number(normalized[field].$numberInt);
        } else if (normalized[field].$numberLong) {
          normalized[field] = Number(normalized[field].$numberLong);
        }
      } else {
        // Convert to number
        normalized[field] = Number(normalized[field] || 0);
      }
    }
  });
  
  // Handle userHasAccess field
  if ('userHasAccess' in normalized) {
    normalized.userHasAccess = 
      normalized.userHasAccess === true || 
      normalized.userHasAccess === 'true' || 
      normalized.userHasAccess === 1 ||
      String(normalized.userHasAccess).toLowerCase() === 'true';
  }
  
  return normalized;
}

// Test the document normalization
function testNormalization() {
  console.log('=== Testing MongoDB Document Normalization ===\n');
  
  // Get document to test - use command line arg or sample
  let testDoc;
  if (process.argv.length > 2) {
    try {
      testDoc = JSON.parse(process.argv[2]);
      console.log('Using document from command line argument');
    } catch (err) {
      console.error('Error parsing command line document:', err.message);
      console.log('Using sample document instead');
      testDoc = sampleDocument;
    }
  } else {
    console.log('Using sample document');
    testDoc = sampleDocument;
  }
  
  console.log('\n--- Original Document ---');
  console.log('ID type:', typeof testDoc._id === 'object' ? 'object with $oid' : typeof testDoc._id);
  
  // Check for numeric fields
  const numericFields = ['views', 'downloads', 'averageRating', 'pageSize', 'fileSizeMB'];
  numericFields.forEach(field => {
    if (field in testDoc) {
      console.log(`${field} type:`, typeof testDoc[field] === 'object' ? 'object with $numberInt/Long' : typeof testDoc[field]);
    }
  });
  
  // Check for date fields
  const dateFields = ['createdAt', 'updatedAt'];
  dateFields.forEach(field => {
    if (field in testDoc) {
      console.log(`${field} type:`, typeof testDoc[field] === 'object' ? 'object with $date' : typeof testDoc[field]);
    }
  });
  
  // Normalize the document
  console.log('\n--- Normalizing Document ---');
  const normalized = normalizeMongoDocument(testDoc);
  
  console.log('\n--- Normalized Document ---');
  console.log('ID:', normalized._id, '(type:', typeof normalized._id, ')');
  
  // Check numeric fields after normalization
  numericFields.forEach(field => {
    if (field in normalized) {
      console.log(`${field}:`, normalized[field], '(type:', typeof normalized[field], ')');
    }
  });
  
  // Check date fields after normalization
  dateFields.forEach(field => {
    if (field in normalized) {
      console.log(`${field}:`, normalized[field], '(type:', typeof normalized[field], ')');
    }
  });
  
  console.log('\n--- Other Important Fields ---');
  console.log('Title:', normalized.title);
  console.log('Author:', normalized.author);
  console.log('Category:', normalized.category);
  console.log('Tags:', normalized.tags);
  console.log('Cover Image:', normalized.coverImage ? 'Yes (URL available)' : 'No');
  console.log('PDF URL:', normalized.pdfUrl ? 'Yes (URL available)' : 'No');
  
  console.log('\n=== Document Normalization Test Complete ===');
  
  // Return the normalized document
  return normalized;
}

// Run the test
const normalizedDoc = testNormalization();

// Create URL-safe version of the document for testing
console.log('\n=== Creating URL Parameter ===');
console.log('To test with this document, use the following URL:');
const docJson = JSON.stringify(normalizedDoc);
console.log(`http://localhost:3000/books/${encodeURIComponent(docJson)}`);

console.log('\nFor testing direct MongoDB document input, use:');
const originalJson = JSON.stringify(sampleDocument);
console.log(`http://localhost:3000/books/${encodeURIComponent(originalJson)}`); 