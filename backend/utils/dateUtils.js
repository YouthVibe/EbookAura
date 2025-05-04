/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Date utility functions
 */

/**
 * Add duration to a date
 * @param {Date} date - The starting date
 * @param {number} value - The duration value
 * @param {string} unit - The duration unit (days, months, years)
 * @returns {Date} - The resulting date
 */
const addDuration = (date, value, unit) => {
  const result = new Date(date);
  
  switch (unit) {
    case 'days':
      result.setDate(result.getDate() + value);
      break;
    case 'months':
      result.setMonth(result.getMonth() + value);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + value);
      break;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
  
  return result;
};

/**
 * Check if a date is expired
 * @param {Date|string} date - The date to check
 * @returns {boolean} - True if expired, false otherwise
 */
const isExpired = (date) => {
  const checkDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  return checkDate < now;
};

/**
 * Format a date in a human-readable format
 * @param {Date|string} date - The date to format
 * @param {string} format - The format to use (default: 'medium')
 * @returns {string} - The formatted date
 */
const formatDate = (date, format = 'medium') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString(undefined, { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    case 'time':
      return dateObj.toLocaleTimeString();
    case 'full':
      return dateObj.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'medium':
    default:
      return dateObj.toLocaleString();
  }
};

/**
 * Calculate the time difference between two dates
 * @param {Date|string} start - The start date
 * @param {Date|string} end - The end date (defaults to now)
 * @returns {Object} - Object with days, hours, minutes, seconds
 */
const getTimeDifference = (start, end = new Date()) => {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  
  const differenceMs = endDate - startDate;
  
  // Convert to days, hours, minutes, seconds
  const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((differenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((differenceMs % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, totalMs: differenceMs };
};

module.exports = {
  addDuration,
  isExpired,
  formatDate,
  getTimeDifference
}; 