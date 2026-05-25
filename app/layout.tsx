import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Sreenidhi Student Counselling Portal',
  description: 'Next.js + Supabase student mentoring portal'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}