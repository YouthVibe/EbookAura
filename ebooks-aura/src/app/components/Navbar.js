/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { FaBars, FaTimes, FaChevronDown, FaSearch, FaBookmark, FaUser, FaSignInAlt, FaUserPlus, FaCoins, FaCrown, FaHome, FaBook } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Close menus when pathname changes (navigation occurs)
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsNavMenuOpen(false);
  }, [pathname]);

  // Detect Android device
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/i.test(userAgent);
    setIsAndroid(isAndroidDevice);
    
    // Add Android-specific attributes and classes
    if (isAndroidDevice) {
      // Add to body
      document.body.classList.add('android-device');
      document.body.setAttribute('data-android', 'true');
      
      // Find elements that need bottom spacing
      const fixedBottomElements = document.querySelectorAll('.fixed-bottom, [data-position="bottom"]');
      fixedBottomElements.forEach(el => {
        el.classList.add('android-adjusted');
      });
      
      // Add class to pages with bottom action bars
      const contentWithBottomActions = document.querySelectorAll('.has-bottom-actions');
      contentWithBottomActions.forEach(el => {
        el.classList.add('page-with-bottom-actions');
      });
    }
    
    return () => {
      if (isAndroidDevice) {
        document.body.classList.remove('android-device');
        
        // Remove classes when component unmounts
        const fixedBottomElements = document.querySelectorAll('.fixed-bottom, [data-position="bottom"]');
        fixedBottomElements.forEach(el => {
          el.classList.remove('android-adjusted');
        });
        
        const contentWithBottomActions = document.querySelectorAll('.has-bottom-actions');
        contentWithBottomActions.forEach(el => {
          el.classList.remove('page-with-bottom-actions');
        });
      }
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile menu if clicking outside
      if (isProfileMenuOpen && !event.target.closest(`.${styles.profileContainer}`)) {
        setIsProfileMenuOpen(false);
      }
      
      // Close nav menu if clicking outside
      if (isNavMenuOpen && !event.target.closest(`.${styles.menuContainer}`)) {
        setIsNavMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, isNavMenuOpen, styles]);

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Plans', href: '/plans' },
  ];

  return (
    <>
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

            {user && !isAndroid && (
              <>
                <Link href="/coins" className={styles.coinsButton} title="Coins">
                  <FaCoins className={styles.coinIcon} />
                  <span className={styles.coinCount}>{user.coins || 0}</span>
                </Link>
                
                <Link href="/plans" className={styles.plansButton} title="Subscription Plans">
                  <FaCrown className={styles.crownIcon} />
                </Link>
              </>
            )}

            {user ? (
              <div className={styles.profileContainer}>
                <button className={styles.profileButton} onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                  <FaUser className={styles.profileIcon} />
                  <span className={styles.profileName}>{user.name}</span>
                  <FaChevronDown className={`${styles.menuIcon} ${isProfileMenuOpen ? styles.rotate : ''}`} />
                </button>

                <div className={`${styles.profileMenu} ${isProfileMenuOpen ? styles.show : ''}`}>
                  <Link href="/profile" className={styles.profileMenuItem} onClick={() => setIsProfileMenuOpen(false)}>
                    My Profile
                  </Link>
                  <Link href="/settings" className={styles.profileMenuItem} onClick={() => setIsProfileMenuOpen(false)}>
                    Settings
                  </Link>
                  <Link href="/coins" className={styles.profileMenuItem} onClick={() => setIsProfileMenuOpen(false)}>
                    My Coins
                  </Link>
                  <Link href="/plans" className={styles.profileMenuItem} onClick={() => setIsProfileMenuOpen(false)}>
                    Subscription Plans
                  </Link>
                  <button className={styles.profileMenuItem} onClick={() => { logout(); setIsProfileMenuOpen(false); }}>
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
                onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                aria-label="Toggle menu"
              >
                <span className={styles.menuText}>Menu</span>
                <FaChevronDown className={`${styles.menuIcon} ${isNavMenuOpen ? styles.rotate : ''}`} />
              </button>

              <div className={`${styles.dropdownMenu} ${isNavMenuOpen ? styles.show : ''}`}>
                {menuItems.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={styles.dropdownItem}
                    onClick={() => setIsNavMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <button 
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
            <Link 
              href="/search" 
              className={styles.mobileMenuItem}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FaSearch className={styles.mobileMenuIcon} />
              Search
            </Link>
            <Link 
              href="/bookmarks" 
              className={styles.mobileMenuItem}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FaBookmark className={styles.mobileMenuIcon} />
              Bookmarks
            </Link>
            {user && !isAndroid && (
              <>
                <Link 
                  href="/coins" 
                  className={styles.mobileMenuItem}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaCoins className={styles.mobileMenuIcon} />
                  Coins: {user.coins || 0}
                </Link>
                <Link 
                  href="/plans" 
                  className={styles.mobileMenuItem}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaCrown className={styles.mobileMenuIcon} />
                  Subscription Plans
                </Link>
              </>
            )}
            {user ? (
              <>
                <Link 
                  href="/profile" 
                  className={styles.mobileMenuItem}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUser className={styles.mobileMenuIcon} />
                  My Profile
                </Link>
                <Link 
                  href="/settings" 
                  className={styles.mobileMenuItem}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUser className={styles.mobileMenuIcon} />
                  Settings
                </Link>
                <button 
                  className={styles.mobileMenuItem} 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <FaSignInAlt className={styles.mobileMenuIcon} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={styles.mobileMenuItem}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaSignInAlt className={styles.mobileMenuIcon} />
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className={styles.mobileMenuItem}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
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
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Android-specific bottom toolbar */}
      {isAndroid && user && (
        <div className={styles.androidToolbar}>
          <Link href="/" className={styles.androidToolbarItem}>
            <FaHome className={styles.androidToolbarIcon} />
            <span className={styles.androidToolbarText}>Home</span>
          </Link>
          <Link href="/search" className={styles.androidToolbarItem}>
            <FaSearch className={styles.androidToolbarIcon} />
            <span className={styles.androidToolbarText}>Search</span>
          </Link>
          <Link href="/coins" className={styles.androidToolbarItem}>
            <FaCoins className={styles.androidToolbarIcon} />
            <span className={styles.androidToolbarText}>{user.coins || 0}</span>
          </Link>
          <Link href="/plans" className={styles.androidToolbarItem}>
            <FaCrown className={styles.androidToolbarIcon} />
            <span className={styles.androidToolbarText}>Premium</span>
          </Link>
          <Link href="/profile" className={styles.androidToolbarItem}>
            <FaUser className={styles.androidToolbarIcon} />
            <span className={styles.androidToolbarText}>Profile</span>
          </Link>
        </div>
      )}
    </>
  );
} 