'use client';

import { useState, useEffect } from 'react';
import styles from './ProgressBar.module.css';

/**
 * ProgressBar component for showing progress of operations like file uploads
 * 
 * @param {Object} props Component props
 * @param {number} props.progress Progress percentage (0-100)
 * @param {string} props.status Status text to display
 * @param {boolean} props.showPercentage Whether to show the percentage number
 * @param {string} props.className Additional CSS class
 */
export default function ProgressBar({ 
  progress = 0, 
  status = 'Uploading...', 
  showPercentage = true,
  className = '' 
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Animate the progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 50); // Small delay for animation effect
    
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`${styles.progressContainer} ${className}`}>
      <div className={styles.statusText}>{status}</div>
      <div className={styles.progressBarOuter}>
        <div 
          className={styles.progressBarInner}
          style={{ width: `${animatedProgress}%` }}
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
          role="progressbar"
        />
      </div>
      {showPercentage && (
        <div className={styles.percentage}>{Math.round(progress)}%</div>
      )}
    </div>
  );
} 