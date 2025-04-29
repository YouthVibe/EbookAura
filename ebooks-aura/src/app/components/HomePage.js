'use client';

import Link from 'next/link';
import styles from '../page.module.css';
import { FaSearch, FaBookmark, FaGithub, FaInstagram, FaYoutube } from 'react-icons/fa';
import HomeAdComponent from './AdComponent';
import Script from 'next/script';

export default function HomePage() {
  // Site URL to use in structured data
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com';

  // JSON-LD structured data for better search engine understanding
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "name": "EbookAura",
    "alternateName": "EbookAura PDF Library",
    "description": "Discover, read and download free PDF books. EbookAura offers a vast collection of ebooks in PDF format for free reading online or download.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?query={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://github.com/YouthVibe",
      "https://www.instagram.com/youthvibeit/",
      "https://www.youtube.com/@YouthVibeIT"
    ]
  };

  // Organization structured data
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "url": siteUrl,
    "logo": `${siteUrl}/images/logo.png`,
    "name": "EbookAura",
    "description": "Your digital library companion offering free PDF books and ebooks",
    "sameAs": [
      "https://github.com/YouthVibe",
      "https://www.instagram.com/youthvibeit/",
      "https://www.youtube.com/@YouthVibeIT"
    ]
  };

  return (
    <>
      {/* Add structured data for search engines */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      
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

        <div className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Why Choose EbookAura?</h2>
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <h3>Free PDF Books</h3>
              <p>Access thousands of free ebooks in PDF format, no registration required for many titles.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Easy Search</h3>
              <p>Find books by title, author, or browse categories to discover your next great read.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Read Anywhere</h3>
              <p>Read online or download PDFs to enjoy offline on any device at your convenience.</p>
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
    </>
  );
} 