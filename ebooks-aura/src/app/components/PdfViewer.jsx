/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaChevronLeft, FaChevronRight, FaTimes, FaDownload, FaExpandAlt } from 'react-icons/fa';
import styles from './PdfViewer.module.css';

// Dynamically import react-pdf to avoid SSR issues
const PDFViewer = dynamic(
  () => import('./PDFViewerBase').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        Loading PDF viewer...
      </div>
    ),
  }
);

export default function PdfViewer({ pdfUrl, onClose, title, allowDownload, onDownload }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localPdfUrl, setLocalPdfUrl] = useState(null);

  // Handle the PDF URL, potentially converting blob to URL
  useEffect(() => {
    // If pdfUrl is already a string URL, create a virtual file with proper MIME type
    if (typeof pdfUrl === 'string') {
      // Fetch the PDF content and create a blob with proper MIME type
      fetch(pdfUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
          }
          return response.blob();
        })
        .then(blob => {
          // Create a new blob with explicit PDF MIME type
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          setLocalPdfUrl(url);
        })
        .catch(error => {
          console.error('Error creating virtual PDF file:', error);
          // Fallback to direct URL if fetching fails
          setLocalPdfUrl(pdfUrl);
        });
      return () => {
        // Clean up any created URL when component unmounts
        if (localPdfUrl && localPdfUrl.startsWith('blob:')) {
          URL.revokeObjectURL(localPdfUrl);
        }
      };
    }
    
    // If pdfUrl is a Blob or File object, create a local URL
    if (pdfUrl instanceof Blob || pdfUrl instanceof File) {
      // If the blob doesn't have the PDF MIME type, create a new one
      let blobToUse = pdfUrl;
      if (pdfUrl.type !== 'application/pdf') {
        blobToUse = new Blob([pdfUrl], { type: 'application/pdf' });
      }
      
      const url = URL.createObjectURL(blobToUse);
      setLocalPdfUrl(url);
      
      // Clean up the created URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [pdfUrl]);

  // Handle escape key to exit fullscreen or close viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, onClose]);

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen);
  }

  // Handle direct download from the viewer using the current PDF blob
  function handleDirectDownload() {
    if (onDownload && typeof onDownload === 'function') {
      // Use the provided onDownload function if available
      onDownload();
      return;
    }
    
    // Otherwise attempt to download directly from the current PDF
    try {
      // If we have a blob URL
      if (localPdfUrl && localPdfUrl.startsWith('blob:')) {
        // Fetch the blob from the URL
        fetch(localPdfUrl)
          .then(response => response.blob())
          .then(blob => {
            // Create a new blob with proper MIME type
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title || 'document'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
          })
          .catch(err => {
            console.error('Error downloading PDF from blob URL:', err);
            alert('Failed to download PDF. Please try again.');
          });
      } 
      // If we have a direct URL but not a blob URL
      else if (localPdfUrl) {
        // For direct URLs, fetch first to ensure it gets the correct MIME type
        fetch(localPdfUrl)
          .then(response => response.blob())
          .then(blob => {
            // Create a new blob with proper MIME type
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title || 'document'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
          })
          .catch(err => {
            console.error('Error downloading PDF from direct URL:', err);
            
            // Fallback to direct link if fetch fails
            const link = document.createElement('a');
            link.href = localPdfUrl;
            link.download = `${title || 'document'}.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
      }
      else {
        console.error('No valid PDF URL available for download');
        alert('Cannot download PDF. No valid PDF data available.');
      }
    } catch (error) {
      console.error('Error in direct download:', error);
      alert('Failed to download PDF. Please try again.');
    }
  }

  // Don't render until we have a valid PDF URL
  if (!localPdfUrl) {
    return (
      <div className={styles.loading}>
        Preparing PDF viewer...
      </div>
    );
  }

  return (
    <div className={`${styles.pdfViewer} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.pdfHeader}>
        <h2 className={styles.pdfTitle}>{title || 'PDF Viewer'}</h2>
        <div className={styles.pdfControls}>
          {allowDownload && (
            <button 
              className={styles.controlButton} 
              onClick={handleDirectDownload}
              title="Download PDF"
            >
              <FaDownload />
            </button>
          )}
          <button 
            className={styles.controlButton} 
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            <FaExpandAlt />
          </button>
          <button 
            className={styles.controlButton} 
            onClick={onClose}
            title="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      
      <PDFViewer 
        pdfUrl={localPdfUrl} 
        isFullscreen={isFullscreen}
      />

    </div>
  );
} 