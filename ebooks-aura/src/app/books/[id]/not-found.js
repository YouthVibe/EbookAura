'use client';

import Link from 'next/link';
import { FaArrowLeft, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import styles from './book.module.css';

export default function BookNotFound() {
  return (
    <div className={styles.container}>
      <Link href="/search" className={styles.backButton}>
        <FaArrowLeft /> Back to Search
      </Link>

      <div className={styles.error}>
        <FaExclamationTriangle size={48} />
        <h2>Book Not Found</h2>
        <p>We couldn't find the book you're looking for. It may have been removed or the URL might be incorrect.</p>
        <p>If this is a new book that was recently added, it might still be processing.</p>
        
        <div className={styles.actionButtons}>
          <Link href="/search" className={styles.searchButton}>
            <FaSearch /> Browse Books
          </Link>
        </div>
      </div>
    </div>
  );
} 