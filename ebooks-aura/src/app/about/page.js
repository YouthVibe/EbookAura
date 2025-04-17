'use client';

import Link from 'next/link';
import { FaBook, FaSearch, FaBookmark, FaStar, FaDownload, FaUserShield, FaMobileAlt } from 'react-icons/fa';
import styles from './about.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          <span className={styles.titleEbook}>Ebook</span>
          <span className={styles.titleAura}>Aura</span>
        </h1>
        <p className={styles.subtitle}>Your Digital Reading Companion</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>About EbookAura</h2>
        <p className={styles.text}>
          EbookAura is a full-featured e-book management platform designed to provide users with a seamless reading experience. 
          Our mission is to make digital reading accessible, enjoyable, and organized for everyone.
        </p>
        <p className={styles.text}>
          The platform offers a comprehensive solution for exploring, managing, and enjoying your digital book collection.
          Whether you're an avid reader looking to organize your library or a casual reader searching for your next great read,
          EbookAura has everything you need in one elegant interface.
        </p>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Key Features</h2>
        
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaSearch />
            </div>
            <h3 className={styles.featureTitle}>Powerful Search</h3>
            <p className={styles.featureText}>
              Find books quickly with our advanced search functionality that lets you filter by title, author, category, or description.
            </p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaBook />
            </div>
            <h3 className={styles.featureTitle}>Online Reader</h3>
            <p className={styles.featureText}>
              Read PDFs directly in your browser with our built-in viewer - no additional software required.
            </p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaBookmark />
            </div>
            <h3 className={styles.featureTitle}>Bookmarks</h3>
            <p className={styles.featureText}>
              Save your favorite books to your personal library for quick access anytime.
            </p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaDownload />
            </div>
            <h3 className={styles.featureTitle}>Downloads</h3>
            <p className={styles.featureText}>
              Download books for offline reading on any device at your convenience.
            </p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaStar />
            </div>
            <h3 className={styles.featureTitle}>Reviews & Ratings</h3>
            <p className={styles.featureText}>
              Rate books and read community reviews to discover quality content.
            </p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <FaUserShield />
            </div>
            <h3 className={styles.featureTitle}>User Accounts</h3>
            <p className={styles.featureText}>
              Create a personal account to track your reading history and manage your preferences.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our Technology</h2>
        <p className={styles.text}>
          EbookAura is built with modern web technologies to ensure a fast, responsive, and secure experience:
        </p>
        <ul className={styles.techList}>
          <li>Next.js frontend for fast, SEO-friendly pages</li>
          <li>Express.js backend API for reliable performance</li>
          <li>MongoDB database for flexible data storage</li>
          <li>Cloudinary integration for PDF and image management</li>
          <li>JWT authentication for secure user accounts</li>
          <li>Responsive design that works beautifully on all devices</li>
        </ul>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to start your reading journey?</h2>
          <p className={styles.ctaText}>Join EbookAura today and discover a better way to manage your digital reading experience.</p>
          <div className={styles.ctaButtons}>
            <Link href="/register" className={styles.primaryButton}>
              Create an Account
            </Link>
            <Link href="/search" className={styles.secondaryButton}>
              Browse Books
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact</h2>
        <p className={styles.text}>
          Have questions, feedback, or need assistance? We'd love to hear from you!
        </p>
        <div className={styles.contactInfo}>
          <p>Email: support@ebookaura.com</p>
          <p>Follow us on social media for updates and reading recommendations.</p>
        </div>
      </section>
    </div>
  );
} 