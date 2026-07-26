'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentFormsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/academic-forms' as any);
  }, [router]);

  return null;
}
