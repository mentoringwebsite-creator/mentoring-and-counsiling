'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HodProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hod');
  }, [router]);

  return null;
}
