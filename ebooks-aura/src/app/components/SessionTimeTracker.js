/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateSessionTime } from '../api/coins';

const SessionTimeTracker = () => {
  const { isLoggedIn } = useAuth();
  const lastUpdateRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Only track time if user is logged in
    if (!isLoggedIn) return;

    // Set initial time
    lastUpdateRef.current = Date.now();

    // Update session time every minute
    const updateInterval = setInterval(() => {
      if (lastUpdateRef.current) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUpdateRef.current) / 1000);
        
        // Only update if more than 5 seconds have passed (to avoid tiny updates)
        if (elapsedSeconds >= 5) {
          // Update the server with elapsed time
          updateSessionTime(elapsedSeconds)
            .then(() => {
              console.log(`Session time updated: ${elapsedSeconds} seconds`);
            })
            .catch(err => {
              console.error('Failed to update session time:', err);
            });
            
          // Reset the timer
          lastUpdateRef.current = now;
        }
      }
    }, 60000); // Check every minute
    
    intervalRef.current = updateInterval;

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Send a final update when component unmounts
      if (lastUpdateRef.current) {
        const elapsedSeconds = Math.floor((Date.now() - lastUpdateRef.current) / 1000);
        if (elapsedSeconds >= 5) {
          updateSessionTime(elapsedSeconds).catch(err => {
            console.error('Failed to send final session time update:', err);
          });
        }
      }
    };
  }, [isLoggedIn]);

  // Also track page visibility changes
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving the page, send an update
        if (lastUpdateRef.current) {
          const elapsedSeconds = Math.floor((Date.now() - lastUpdateRef.current) / 1000);
          if (elapsedSeconds >= 5) {
            updateSessionTime(elapsedSeconds).catch(err => {
              console.error('Failed to update session time on tab switch:', err);
            });
          }
        }
      } else {
        // User is returning to the page, reset the timer
        lastUpdateRef.current = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn]);

  // This component doesn't render anything
  return null;
};

export default SessionTimeTracker; 