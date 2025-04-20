'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './PdfViewer.module.css';
import { isClient, initPdfWorker } from '../utils/pdfUtils';

// Initialize PDF.js worker only on client side
if (isClient) {
  initPdfWorker();
}

export default function PDFViewerBase({ pdfUrl, isFullscreen }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mark component as ready once it mounts on the client
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Reset error state when pdfUrl changes
  useEffect(() => {
    setLoadError(null);
    setIsLoading(true);
  }, [pdfUrl]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
    setLoadError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setLoadError(error);
    setIsLoading(false);
  }

  function changePage(offset) {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    }
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(scale => Math.min(scale + 0.1, 2.0));
  }

  function zoomOut() {
    setScale(scale => Math.max(scale - 0.1, 0.5));
  }

  // Don't render anything during SSR
  if (!isClient || !isReady) {
    return <div className={styles.loading}>Initializing PDF viewer...</div>;
  }

  return (
    <>
      <div className={styles.pdfContainer}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className={styles.loading}>Loading PDF...</div>}
          error={
            <div className={styles.error}>
              <p>Failed to load PDF.</p>
              {loadError && <p>{loadError.message || 'Unknown error'}</p>}
            </div>
          }
          className={styles.pdfDocument}
        >
          {!isLoading && !loadError && (
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className={styles.pdfPage}
              error={<div className={styles.error}>Error rendering page.</div>}
            />
          )}
        </Document>
      </div>
      
      {!loadError && (
        <div className={styles.pdfFooter}>
          <div className={styles.zoomControls}>
            <button 
              className={styles.controlButton} 
              onClick={zoomOut}
              disabled={scale <= 0.5 || isLoading}
              title="Zoom Out"
            >
              -
            </button>
            <span className={styles.zoomText}>{Math.round(scale * 100)}%</span>
            <button 
              className={styles.controlButton} 
              onClick={zoomIn}
              disabled={scale >= 2.0 || isLoading}
              title="Zoom In"
            >
              +
            </button>
          </div>
          
          <div className={styles.pageControls}>
            <button 
              disabled={pageNumber <= 1 || isLoading} 
              onClick={previousPage}
              className={styles.navButton}
              title="Previous Page"
            >
              <FaChevronLeft />
            </button>
            <span className={styles.pageInfo}>
              Page {pageNumber} of {numPages || '--'}
            </span>
            <button 
              disabled={pageNumber >= numPages || isLoading} 
              onClick={nextPage}
              className={styles.navButton}
              title="Next Page"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </>
  );
} 