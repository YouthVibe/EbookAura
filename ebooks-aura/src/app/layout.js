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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ backgroundColor: '#ffffff' }}>
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
