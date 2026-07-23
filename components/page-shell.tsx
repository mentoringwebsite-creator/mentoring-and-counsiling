'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/header';
import { 
  Home, 
  User, 
  GraduationCap, 
  TrendingUp,
  Trophy, 
  MessageSquare, 
  Users, 
  FileText, 
  Landmark, 
  ShieldCheck
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();

  const getMobileNavItems = () => {
    if (pathname.startsWith('/student')) {
      return [
        { href: '/student', label: 'Profile', icon: User },
        { href: '/student/academic', label: 'Academics', icon: GraduationCap },
        { href: '/student/performance', label: 'Perf', icon: TrendingUp },
        { href: '/student/extracurricular', label: 'Activities', icon: Trophy },
        { href: '/student/queries', label: 'Queries', icon: MessageSquare }
      ];
    }
    if (pathname.startsWith('/faculty')) {
      return [
        { href: '/faculty', label: 'Home', icon: Home },
        { href: '/faculty/profile', label: 'Profile', icon: User },
        { href: '/faculty/students', label: 'Students', icon: Users },
        { href: '/faculty/queries', label: 'Queries', icon: MessageSquare },
        { href: '/faculty/notes', label: 'Notes', icon: FileText }
      ];
    }
    if (pathname.startsWith('/hod')) {
      return [
        { href: '/hod', label: 'Home', icon: Home },
        { href: '/hod/profile', label: 'Profile', icon: User },
        { href: '/hod/students', label: 'Students', icon: Users },
        { href: '/hod/queries', label: 'Queries', icon: MessageSquare },
        { href: '/hod/reports', label: 'Reports', icon: FileText }
      ];
    }
    if (pathname.startsWith('/admin')) {
      return [
        { href: '/admin', label: 'Home', icon: Home },
        { href: '/admin/faculty', label: 'Faculty', icon: Users },
        { href: '/admin/hod', label: 'HODs', icon: Landmark },
        { href: '/admin/students', label: 'Students', icon: Users },
        { href: '/admin/pending', label: 'Approvals', icon: ShieldCheck }
      ];
    }
    return [];
  };

  const mobileItems = getMobileNavItems();

  const isTabActive = (href: string) => {
    if (href === '/student' || href === '/faculty' || href === '/hod' || href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="min-h-screen w-full overflow-hidden flex flex-col">
        <Header 
          title={title}
          subtitle={subtitle}
          showBackButton={true}
          showUserMenu={true}
          rightElement={
            <div className="hidden sm:text-right md:block">
              <div className="text-xl font-semibold tracking-[-0.04em]">{title}</div>
              {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
            </div>
          }
        />
        <main className={cn("flex-1 w-full animate-slide-up", mobileItems.length > 0 && "pb-24 lg:pb-0")}>
          {children}
        </main>

        {/* Dynamic Mobile Bottom Navigation Bar */}
        {mobileItems.length > 0 && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] lg:hidden">
            <div className="mx-2 rounded-xl bg-white px-1.5 py-1">
              <div className="flex items-center justify-around">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                const active = isTabActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1 px-1.5 py-0.5 rounded-xl transition-all duration-200 active:scale-95",
                      active 
                        ? "text-emerald-700 font-bold" 
                        : "text-slate-500 hover:text-slate-900 font-medium"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                      active 
                        ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                        : "bg-transparent text-slate-500"
                    )}>
                      <Icon className="h-5 w-5 stroke-[2.25]" />
                    </div>
                    <span className="max-w-[58px] truncate text-[0.62rem] tracking-tight">{item.label}</span>
                  </Link>
                );
              })}
              </div>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
