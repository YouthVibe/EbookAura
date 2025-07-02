/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/vendor.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import Script from "next/script";
import Head from 'next/head';
import SessionTimeTracker from "./components/SessionTimeTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EbookAura - Free PDF Books Library",
  description: "Discover, read and download free PDF books. EbookAura offers a vast collection of ebooks in PDF format for free reading online or download.",
  keywords: "ebooks, free pdf books, pdf download, digital library, online reading, free ebooks, ebookaura, ebook platform, pdf reader, book collection, download books, read online, free pdf download, ebook reader, digital books",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com'),
  alternates: {
    canonical: '/'
  },
  other: {
    'google-adsense-account': 'ca-pub-2456537810743091',
  },
  openGraph: {
    title: "EbookAura - Free PDF Books Library",
    description: "Discover, read and download free PDF books. Access thousands of ebooks in PDF format for free reading online or download.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://ebookaura.onrender.com',
    siteName: 'EbookAura',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/home-page-og.svg',
        width: 1200,
        height: 630,
        alt: 'EbookAura - Digital Library Homepage',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "EbookAura - Free PDF Books Library",
    description: "Your gateway to thousands of free PDF books. Browse our collection, read online, or download for offline reading.",
    images: ['/images/home-page-og.svg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* AdSense verification code goes in the head section for site verification */}
        <Script
          id="adsense-verification"
          strategy="beforeInteractive"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2456537810743091"
          crossOrigin="anonymous"
        />
        
        {/* Google Search Console Verification - You would need to replace this with your actual verification code */}
        <meta name="google-site-verification" content="REPLACE_WITH_YOUR_VERIFICATION_CODE" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable}`} 
        style={{ backgroundColor: '#ffffff' }}
        suppressHydrationWarning
      >
        {/* No need for duplicate AdSense script in body, the one in head is sufficient */}
        
        {/* Script to detect Android and set data attribute */}
        <Script id="detect-android" strategy="beforeInteractive">
          {`
            (function() {
              var userAgent = navigator.userAgent.toLowerCase();
              var isAndroid = /android/i.test(userAgent);
              
              if (isAndroid) {
                // Set data attribute on body
                document.body.setAttribute('data-android', 'true');
                document.body.classList.add('android-device');
                
                // Wait for DOM to be ready
                document.addEventListener('DOMContentLoaded', function() {
                  // Apply classes to elements that need adjustment
                  var fixedBottomElements = document.querySelectorAll('.fixed-bottom, [data-position="bottom"]');
                  for (var i = 0; i < fixedBottomElements.length; i++) {
                    fixedBottomElements[i].classList.add('android-adjusted');
                  }
                  
                  var contentWithBottomActions = document.querySelectorAll('.has-bottom-actions');
                  for (var j = 0; j < contentWithBottomActions.length; j++) {
                    contentWithBottomActions[j].classList.add('page-with-bottom-actions');
                  }
                  
                  // Add Android class to all modals for specific styling
                  function addAndroidClassToModals() {
                    var modalOverlays = document.querySelectorAll('.modalOverlay');
                    for (var k = 0; k < modalOverlays.length; k++) {
                      modalOverlays[k].classList.add('android-modal');
                    }
                    
                    var modalContent = document.querySelectorAll('.modalContent');
                    for (var l = 0; l < modalContent.length; l++) {
                      modalContent[l].classList.add('android-modal-content');
                    }
                  }
                  
                  // Run initially
                  addAndroidClassToModals();
                  
                  // Also run when DOM changes to catch dynamically added modals
                  var observer = new MutationObserver(function(mutations) {
                    addAndroidClassToModals();
                  });
                  
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });
                });
              }
            })();
          `}
        </Script>

        {/* Script to ensure menus are closed on navigation */}
        <Script id="navigation-menu-handler">
          {`
            if (typeof window !== 'undefined') {
              // Close menus when user navigates using browser back/forward buttons
              window.addEventListener('popstate', function() {
                // Find and close all menus
                var openMenus = document.querySelectorAll('[class*="open"]');
                for (var i = 0; i < openMenus.length; i++) {
                  if (openMenus[i].classList.contains('open')) {
                    openMenus[i].classList.remove('open');
                  }
                }
              });
            }
          `}
        </Script>
        <AuthProvider>
          <Navbar />
          <main style={{ paddingTop: '60px', minHeight: 'calc(100vh - 60px)' }}>
            {children}
          </main>
          <SessionTimeTracker />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </body>
    </html>
  );
}
