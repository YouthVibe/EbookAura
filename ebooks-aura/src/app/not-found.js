/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { FaHome, FaSearch, FaExclamationCircle } from 'react-icons/fa';
import Link from 'next/link';
import styles from './not-found.module.css';

/**
 * Global 404 page for the entire application
 * This catches any routes that don't exist
 */
export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.notFoundCard}>
        <div className={styles.notFoundIcon}>
          <FaExclamationCircle />
        </div>
        
        <h1 className={styles.notFoundTitle}>404 - Page Not Found</h1>
        
        <p className={styles.notFoundMessage}>
          The page you are looking for does not exist or has been moved.
        </p>
        
        <div className={styles.notFoundActions}>
          <Link href="/" className={styles.homeButton}>
            <FaHome /> Home
          </Link>
          
          <Link href="/search" className={styles.searchButton}>
            <FaSearch /> Browse Books
          </Link>
        </div>
      </div>
    </div>
  );
} 