'use client';

import AdComponent from './AdComponent';
import styles from './FooterAd.module.css';

export default function FooterAd() {
  return (
    <div className={styles.footerAdContainer}>
      <AdComponent 
        slot="7493061234" 
        format="horizontal" 
        style={{ 
          display: 'block',
          maxWidth: '100%',
          margin: '0 auto'
        }}
      />
    </div>
  );
} 