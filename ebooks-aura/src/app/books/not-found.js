'use client';

import { FaArrowLeft, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './not-found.module.css';

/**
 * Custom 404 page specifically for the books route
 * This provides a better user experience for non-existent book IDs
 */
export default function BooksNotFound() {
  const router = useRouter();
  
  return (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <div className={styles.iconContainer}>
          <FaExclamationTriangle className={styles.icon} />
        </div>
        
        <h1 className={styles.title}>Book Not Found</h1>
        
        <p className={styles.message}>
          We couldn't find the book you're looking for. It may have been removed or the URL might be incorrect.
        </p>
        
        <div className={styles.actions}>
          <button
            onClick={() => router.back()}
            className={styles.backButton}
          >
            <FaArrowLeft /> Go Back
          </button>
          
          <Link href="/search" className={styles.searchButton}>
            <FaSearch /> Browse Books
          </Link>
        </div>
      </div>
    </div>
  );
} 