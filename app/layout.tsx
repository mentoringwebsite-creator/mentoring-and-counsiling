import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Sreenidhi Student Counselling Portal',
  description: 'A simple, attractive mentoring and counseling portal for students, faculty, and administrators'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}