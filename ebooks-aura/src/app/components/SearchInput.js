/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { FaSearch } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import styles from './SearchInput.module.css';

/**
 * Reusable search input component with proper styling and debouncing functionality
 * 
 * @param {Object} props Component props
 * @param {string} props.placeholder Placeholder text for the search input
 * @param {function} props.onSearch Callback function when search value changes
 * @param {string} props.initialValue Initial value for the search input
 * @param {number} props.debounceTime Time in ms to debounce the search (default: 300ms)
 * @param {string} props.className Additional CSS class for custom styling
 */
export default function SearchInput({ 
  placeholder = 'Search...', 
  onSearch, 
  initialValue = '',
  debounceTime = 300,
  className = '' 
}) {
  const [searchValue, setSearchValue] = useState(initialValue);
  
  // Update searchValue when initialValue changes externally
  useEffect(() => {
    setSearchValue(initialValue);
  }, [initialValue]);
  
  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchValue);
      }
    }, debounceTime);
    
    return () => clearTimeout(timer);
  }, [searchValue, onSearch, debounceTime]);
  
  return (
    <div className={`${styles.searchContainer} ${className}`}>
      <FaSearch className={styles.searchIcon} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className={styles.searchInput}
        aria-label="Search input"
      />
      {searchValue && (
        <button 
          className={styles.clearButton}
          onClick={() => {
            setSearchValue('');
            if (onSearch) onSearch('');
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
} 