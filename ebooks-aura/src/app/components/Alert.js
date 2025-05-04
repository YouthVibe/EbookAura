/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  FaInfoCircle, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimes 
} from 'react-icons/fa';
import styles from './Alert.module.css';

/**
 * Alert component for displaying notifications
 * @param {Object} props Component props
 * @param {string} props.type Alert type: 'success', 'error', 'warning', 'info'
 * @param {string} props.message Alert message
 * @param {boolean} props.show Whether the alert is visible
 * @param {function} props.onClose Function to call when the alert is closed
 * @param {number} props.autoCloseTime Time in ms to automatically close the alert (0 to disable)
 * @param {string} props.className Additional CSS class for custom styling
 */
export default function Alert({ 
  type = 'info', 
  message, 
  show = false, 
  onClose,
  autoCloseTime = 5000,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(show);

  // Handle auto-closing
  useEffect(() => {
    setIsVisible(show);
    
    let timerId;
    if (show && autoCloseTime > 0) {
      timerId = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseTime);
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [show, autoCloseTime, onClose]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  // If not visible, don't render
  if (!isVisible) return null;

  // Determine icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className={styles.icon} />;
      case 'error':
        return <FaExclamationTriangle className={styles.icon} />;
      case 'warning':
        return <FaExclamationTriangle className={styles.icon} />;
      case 'info':
      default:
        return <FaInfoCircle className={styles.icon} />;
    }
  };

  return (
    <div 
      className={`${styles.alert} ${styles[type]} ${className} ${styles.slideIn}`}
      role="alert"
    >
      <div className={styles.content}>
        {getIcon()}
        <p className={styles.message}>{message}</p>
      </div>
      <button 
        onClick={handleClose}
        className={styles.closeButton}
        aria-label="Close alert"
      >
        <FaTimes />
      </button>
    </div>
  );
} 