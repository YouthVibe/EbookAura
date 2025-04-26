import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Script from "next/script";
import Head from 'next/head';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EbookAura",
  description: "Your digital library companion",
  // You can add verification meta tags here if needed
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ebooks-aura.com'),
  other: {
    'google-adsense-account': 'ca-pub-2456537810743091',
  }
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
