'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { FaSearch, FaBookmark, FaGithub, FaInstagram, FaYoutube } from 'react-icons/fa';
import HomeAdComponent from './components/AdComponent';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.brandContainer}>
          <h1 className={styles.brandName}>
            <span className={styles.brandEbook}>Ebook</span>
            <span className={styles.brandAura}>Aura</span>
          </h1>
          <p className={styles.tagline}>
            Your digital library companion. Discover, read, and organize your favorite books in one place.
          </p>
          <div className={styles.actionButtons}>
            <Link href="/search" className={styles.actionButton}>
              <FaSearch className={styles.buttonIcon} />
              Search Books
            </Link>
            <Link href="/bookmarks" className={styles.actionButton}>
              <FaBookmark className={styles.buttonIcon} />
              My Bookmarks
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.socialSection}>
        <h2 className={styles.socialTitle}>Connect With Us</h2>
        <div className={styles.socialLinks}>
          <a href="https://github.com/YouthVibe" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
            <FaGithub className={styles.socialIcon} />
            GitHub
          </a>
          <a href="https://www.instagram.com/youthvibeit/" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
            <FaInstagram className={styles.socialIcon} />
            Instagram
          </a>
          <a href="https://www.youtube.com/@YouthVibeIT" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
            <FaYoutube className={styles.socialIcon} />
            YouTube
          </a>
        </div>
      </div>
      <HomeAdComponent />
    </div>
  );
}
