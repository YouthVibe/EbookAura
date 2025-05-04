/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Utilities for handling PDF.js in a Next.js environment
 */

// Safely initialize PDF worker only on client side
export const initPdfWorker = () => {
  if (typeof window === 'undefined') {
    return; // Skip during SSR
  }
  
  // Dynamic import to avoid SSR issues
  import('react-pdf').then(({ pdfjs }) => {
    // Set the worker source to the specified version
    const workerSrc = "https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
    console.log('PDF.js worker initialized with custom version');
  }).catch(err => {
    console.error('Failed to initialize PDF worker:', err);
  });
};

// Check if running on client side
export const isClient = typeof window !== 'undefined';

// Helper to create safe Blob URLs that clean up properly
export const createAndTrackBlobUrl = (blob) => {
  if (!isClient) return null;
  
  const url = URL.createObjectURL(blob);
  
  // Return cleanup function along with URL
  return {
    url,
    cleanup: () => {
      URL.revokeObjectURL(url);
    }
  };
};

// Enhanced function to handle various PDF source types and convert to appropriate format
export const normalizePdfSource = (source) => {
  if (!source) return null;
  
  // If it's already a blob or File, return as is
  if (source instanceof Blob || source instanceof File) {
    return source;
  }
  
  // If it's a string URL, return it as is
  if (typeof source === 'string') {
    return source;
  }
  
  // If it's an ArrayBuffer, convert to Blob
  if (source instanceof ArrayBuffer) {
    return new Blob([source], { type: 'application/pdf' });
  }
  
  // If it's a Uint8Array, convert to Blob
  if (source instanceof Uint8Array) {
    return new Blob([source], { type: 'application/pdf' });
  }
  
  console.error('Unknown PDF source type:', source);
  return null;
};

// Function to create a downloadable PDF from various source types
export const createDownloadablePdf = (source, filename = 'document.pdf') => {
  if (!isClient) return { success: false, error: 'Cannot run on server' };
  
  try {
    // Normalize the source to a usable format
    const normalizedSource = normalizePdfSource(source);
    if (!normalizedSource) {
      return { 
        success: false, 
        error: 'Invalid PDF source' 
      };
    }
    
    // If it's a string URL, create a direct download link
    if (typeof normalizedSource === 'string') {
      const link = document.createElement('a');
      link.href = normalizedSource;
      link.download = filename;
      link.target = '_blank';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }
    
    // If it's a Blob or File, create a blob URL
    if (normalizedSource instanceof Blob || normalizedSource instanceof File) {
      const url = URL.createObjectURL(normalizedSource);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      return { success: true };
    }
    
    return { success: false, error: 'Unknown source type' };
  } catch (error) {
    console.error('Error creating downloadable PDF:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
};

// Export a memoized version of the worker URL to avoid multiple initializations
export const getPdfWorkerSrc = (() => {
  let workerSrc = null;
  
  return async () => {
    if (workerSrc) return workerSrc;
    
    if (isClient) {
      // Use the specified worker URL
      workerSrc = "https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
      return workerSrc;
    }
    
    return null;
  };
})(); 