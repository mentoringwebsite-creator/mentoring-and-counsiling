'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyFormsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/faculty/academic-forms' as any);
  }, [router]);

  return null;
}
