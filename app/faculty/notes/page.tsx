'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyNotesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/faculty');
  }, [router]);

  return null;
}