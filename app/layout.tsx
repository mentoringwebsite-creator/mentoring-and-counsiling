import './globals.css';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Sreenidhi Student Counselling Portal',
  description: 'A premium mentoring and counseling portal for students, faculty, and administrators',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SNIST Portal',
  },
};

export const viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}