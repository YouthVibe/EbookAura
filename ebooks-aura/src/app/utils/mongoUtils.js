/**
 * MongoDB Utilities
 * 
 * Helper functions to normalize MongoDB data types when they come through JSON
 * This ensures the frontend receives consistent data types regardless of environment
 */

/**
 * Normalizes a MongoDB document, ensuring consistent types for key fields
 * Handles special MongoDB types like $numberLong, $oid, etc.
 * 
 * @param {Object} doc - The MongoDB document to normalize
 * @returns {Object} - Normalized document with consistent types
 */
export function normalizeMongoDocument(doc) {
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

/**
 * Normalizes a collection of MongoDB documents
 * @param {Array} docs - Array of MongoDB documents
 * @returns {Array} - Array of normalized documents
 */
export function normalizeMongoCollection(docs) {
  if (!Array.isArray(docs)) {
    return docs;
  }
  
  return docs.map(doc => normalizeMongoDocument(doc));
}

export default {
  normalizeMongoDocument,
  normalizeMongoCollection
}; 