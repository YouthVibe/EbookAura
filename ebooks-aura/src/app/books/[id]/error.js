'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { FaArrowLeft, FaExclamationCircle, FaSearch } from 'react-icons/fa';
import styles from './book.module.css';

export default function BookError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Book page error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <Link href="/search" className={styles.backButton}>
        <FaArrowLeft /> Back to Search
      </Link>

      <div className={styles.error}>
        <FaExclamationCircle size={48} />
        <h2>Something Went Wrong</h2>
        <p>
          We encountered an error while trying to load this book.
        </p>
        <p className={styles.errorDetails}>
          {error?.message || 'An unexpected error occurred.'}
        </p>
        
        <div className={styles.actionButtons}>
          <button onClick={reset} className={styles.viewButton}>
            Try Again
          </button>
          <Link href="/search" className={styles.searchButton}>
            <FaSearch /> Browse Books
          </Link>
        </div>
      </div>
    </div>
  );
} 