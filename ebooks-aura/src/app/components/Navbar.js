'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { FaBars, FaTimes, FaChevronDown, FaSearch, FaBookmark, FaUser, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Books', href: '/books' },
    { name: 'Categories', href: '/categories' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoEbook}>Ebook</span>
          <span className={styles.logoAura}>Aura</span>
        </Link>
        
        <div className={styles.navActions}>
          <Link href="/search" className={styles.iconButton} title="Search">
            <FaSearch className={styles.actionIcon} />
          </Link>
          <Link href="/bookmarks" className={styles.iconButton} title="Bookmarks">
            <FaBookmark className={styles.actionIcon} />
          </Link>

          {user ? (
            <div className={styles.profileContainer}>
              <button className={styles.profileButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <FaUser className={styles.profileIcon} />
                <span className={styles.profileName}>{user.name}</span>
                <FaChevronDown className={`${styles.menuIcon} ${isMenuOpen ? styles.rotate : ''}`} />
              </button>

              <div className={`${styles.profileMenu} ${isMenuOpen ? styles.show : ''}`}>
                <Link href="/profile" className={styles.profileMenuItem}>
                  My Profile
                </Link>
                <Link href="/settings" className={styles.profileMenuItem}>
                  Settings
                </Link>
                <button className={styles.profileMenuItem} onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login" className={styles.loginButton}>
                <FaSignInAlt className={styles.loginIcon} />
                <span>Login</span>
              </Link>
              <Link href="/register" className={styles.registerButton}>
                <FaUserPlus className={styles.registerIcon} />
                <span>Register</span>
              </Link>
            </div>
          )}
          
          <div className={styles.menuContainer}>
            <button 
              className={styles.menuButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={styles.menuText}>Menu</span>
              <FaChevronDown className={`${styles.menuIcon} ${isMenuOpen ? styles.rotate : ''}`} />
            </button>

            <div className={`${styles.dropdownMenu} ${isMenuOpen ? styles.show : ''}`}>
              {menuItems.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href}
                  className={styles.dropdownItem}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <button 
          className={styles.mobileMenuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle mobile menu"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
          <Link href="/search" className={styles.mobileMenuItem}>
            <FaSearch className={styles.mobileMenuIcon} />
            Search
          </Link>
          <Link href="/bookmarks" className={styles.mobileMenuItem}>
            <FaBookmark className={styles.mobileMenuIcon} />
            Bookmarks
          </Link>
          {user ? (
            <>
              <Link href="/profile" className={styles.mobileMenuItem}>
                <FaUser className={styles.mobileMenuIcon} />
                My Profile
              </Link>
              <Link href="/settings" className={styles.mobileMenuItem}>
                <FaUser className={styles.mobileMenuIcon} />
                Settings
              </Link>
              <button className={styles.mobileMenuItem} onClick={logout}>
                <FaSignInAlt className={styles.mobileMenuIcon} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.mobileMenuItem}>
                <FaSignInAlt className={styles.mobileMenuIcon} />
                Login
              </Link>
              <Link href="/register" className={styles.mobileMenuItem}>
                <FaUserPlus className={styles.mobileMenuIcon} />
                Register
              </Link>
            </>
          )}
          {menuItems.map((item) => (
            <Link 
              key={item.name}
              href={item.href}
              className={styles.mobileMenuItem}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 