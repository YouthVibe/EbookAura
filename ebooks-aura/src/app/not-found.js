'use client';

import Link from 'next/link';
import { FaArrowLeft, FaExclamationTriangle, FaHome, FaSearch } from 'react-icons/fa';
import styles from './notFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <FaExclamationTriangle size={48} className={styles.icon} />
        <h1 className={styles.title}>404 - Page Not Found</h1>
        <p className={styles.description}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            <FaHome /> Go to Home
          </Link>
          <Link href="/search" className={styles.secondaryButton}>
            <FaSearch /> Browse Books
          </Link>
        </div>
      </div>
    </div>
  );
} 