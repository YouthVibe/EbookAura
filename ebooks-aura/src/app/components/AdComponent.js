'use client';

import { useEffect, useRef } from 'react';
import styles from './AdComponent.module.css';

export default function AdComponent({ format = 'auto', slot, style = {} }) {
  const adRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && adRef.current && adRef.current.innerHTML === '') {
      try {
        // Push the ad only if adsbygoogle is loaded
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('Error loading Google AdSense:', error);
      }
    }
  }, []);

  const adStyle = {
    display: 'block',
    textAlign: 'center',
    ...style
  };

  return (
    <div className={styles.adContainer}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client="ca-pub-2456537810743091"
        data-ad-slot={slot || ''}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <div className={styles.adLabel}>Advertisement</div>
    </div>
  );
} 