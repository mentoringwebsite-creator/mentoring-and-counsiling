import './globals.css';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Sreenidhi Student Counselling Portal',
  description: 'A simple, attractive mentoring and counseling portal for students, faculty, and administrators',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SNIST Portal',
  },
};

export const viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}