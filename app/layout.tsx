import './globals.css';
import { Manrope } from 'next/font/google';
import type { ReactNode } from 'react';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata = {
  title: 'Sreenidhi Student Counselling Portal',
  description: 'A simple, attractive mentoring and counseling portal for students, faculty, and administrators'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}