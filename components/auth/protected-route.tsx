'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/auth';

const redirectMap: Record<Role, string> = {
  student: '/student/login',
  faculty: '/faculty/login',
  hod: '/hod/login',
  admin: '/admin/login'
};

export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (error || !user) {
        router.replace(redirectMap[role] as any);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role,status')
        .eq('id', user.id)
        .single();

      if (
        profileError ||
        !profile ||
        profile.status !== 'Approved' ||
        profile.role !== role
      ) {
        await supabase.auth.signOut();
        router.replace(redirectMap[role] as any);
        return;
      }

      setIsReady(true);
    };

    checkAuth();
  }, [role, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center text-sm font-semibold shadow-sm">
          Checking access rights…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
