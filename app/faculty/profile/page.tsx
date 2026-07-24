'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/faculty');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Redirecting to Dashboard...</span>
      </div>
    </div>
  );
}
