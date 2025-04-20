import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable}`} 
        style={{ backgroundColor: '#ffffff' }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Navbar />
          <main style={{ paddingTop: '60px', minHeight: 'calc(100vh - 60px)' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
