'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

/**
 * Client component to handle social media bot detection and appropriate meta tags
 * This allows us to keep static generation while still optimizing for social media sharing
 */
export function SocialMetaTags() {
  const [isSocialBot, setIsSocialBot] = useState(false);
  
  useEffect(() => {
    // Check if the current user agent is a social media crawler
    const userAgent = window.navigator.userAgent;
    const socialBotRegex = /facebookexternalhit|twitterbot|whatsapp|instagram|linkedinbot|pinterest|slackbot|telegram|discordbot/i;
    setIsSocialBot(socialBotRegex.test(userAgent));
    
    // Alternative approach: look for URL parameters commonly used by bots
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('fbclid') || urlParams.has('utm_source')) {
      setIsSocialBot(true);
    }
  }, []);
  
  // If not a social bot, don't render anything
  if (!isSocialBot) return null;
  
  // For social bots, inject additional metadata using script
  return (
    <>
      {/* Inject metadata via script for social bots */}
      <Script id="social-meta-tags" strategy="afterInteractive">
        {`
          // Add additional meta tags for social media crawlers
          function addMetaTag(name, content) {
            const meta = document.createElement('meta');
            meta.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
          }
          
          addMetaTag('robots', 'index, follow');
          addMetaTag('og:type', 'book');
          addMetaTag('twitter:card', 'summary_large_image');
        `}
      </Script>
    </>
  );
} 