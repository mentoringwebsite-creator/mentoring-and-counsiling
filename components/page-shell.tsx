'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Brand } from '@/components/brand';
import { 
  LogOut, 
  ChevronDown, 
  Home, 
  User, 
  GraduationCap, 
  TrendingUp,
  Trophy, 
  MessageSquare, 
  Users, 
  FileText, 
  Landmark, 
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; photo: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const userId = session.user.id;
        const email = session.user.email || '';

        const { data: userDb } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', userId)
          .single();

        let photoUrl = '';
        if (userDb) {
          const role = userDb.role;
          if (role === 'student') {
            const { data: studentDb } = await supabase
              .from('student_profiles')
              .select('profile_photo')
              .eq('user_id', userId)
              .single();
            photoUrl = studentDb?.profile_photo || '';
          } else if (role === 'faculty') {
            const { data: facultyDb } = await supabase
              .from('faculty_profiles')
              .select('profile_photo')
              .eq('user_id', userId)
              .single();
            photoUrl = facultyDb?.profile_photo || '';
          } else if (role === 'hod') {
            const { data: hodDb } = await supabase
              .from('hod_profiles')
              .select('profile_photo')
              .eq('user_id', userId)
              .single();
            photoUrl = hodDb?.profile_photo || '';
          }
        }

        setUserProfile({
          name: userDb?.name || session.user.user_metadata?.name || 'User',
          email,
          photo: photoUrl || ''
        });
      } catch (err) {
        console.error('Error fetching user shell profile:', err);
      }
    }

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const pathname = usePathname() || '';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(199,217,207,0.42),transparent_30%),radial-gradient(circle_at_top_right,rgba(234,218,177,0.30),transparent_28%),linear-gradient(180deg,#f4f7f4_0%,#edf2ee_100%)] text-portal-ink">
      <div className="min-h-screen w-full overflow-hidden bg-white/92 backdrop-blur-xl flex flex-col">
        <header className="sticky top-0 z-40 flex h-16 sm:h-[72px] items-center justify-between border-b border-emerald-900/5 bg-white/78 backdrop-blur-xl px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 max-w-[70%] sm:max-w-[75%] overflow-hidden">
            <button 
              onClick={() => router.back()}
              className="flex items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 p-1.5 text-slate-600 hover:bg-white hover:text-slate-800 transition shadow-sm active:scale-95 shrink-0"
              aria-label="Go Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            
            <div className="hidden sm:block shrink-0">
              <Brand compact />
            </div>

            {/* Mobile/Tablet Page Title (hidden on Desktop) */}
            <div className="border-l border-slate-200 pl-2 sm:pl-3 lg:hidden overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-portal-ink sm:text-base">{title}</span>
            </div>
            {/* Desktop Subtitle */}
            <div className="hidden border-l border-black/10 pl-4 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#315d47] md:grid shrink-0">
              <span>Sreenidhi</span>
              <span>Student</span>
              <span>Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:text-right md:block">
              <div className="text-xl font-semibold tracking-[-0.04em]">{title}</div>
              {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
            </div>

            {userProfile && (
              <div className="flex items-center gap-2 border-l border-slate-200/90 pl-3 sm:gap-3 sm:pl-6">
                <span className="hidden text-sm font-semibold text-portal-ink md:inline">{userProfile.name}</span>
                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-emerald-500/20 bg-emerald-50 shadow-[0_4px_16px_rgba(17,94,73,0.12)] shrink-0">
                  {userProfile.photo && (userProfile.photo.startsWith('data:') || userProfile.photo.startsWith('http') || userProfile.photo.startsWith('/')) ? (
                    <img
                      src={userProfile.photo}
                      alt={userProfile.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userProfile.name)}`;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-700 font-bold text-white uppercase text-sm">
                      {userProfile.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                    className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-portal-ink transition duration-150"
                  >
                    <span className="hidden sm:inline">Logout</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-portal-line bg-white p-2 shadow-soft z-50">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className={cn("flex-1 w-full animate-slide-up", mobileItems.length > 0 && "pb-24 lg:pb-0")}>
          {children}
        </main>

        {/* Dynamic Mobile Bottom Navigation Bar */}
        {mobileItems.length > 0 && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/90 bg-white/78 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl shadow-[0_-10px_36px_rgba(0,0,0,0.08)] lg:hidden">
            <div className="mx-2 rounded-2xl border border-slate-200/70 bg-white/78 px-1.5 py-1 shadow-[0_8px_22px_rgba(14,34,28,0.08)]">
              <div className="flex items-center justify-around">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                const active = isTabActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1 px-1.5 py-0.5 rounded-xl transition-all duration-250 active:scale-90",
                      active 
                        ? "text-emerald-800 font-bold" 
                        : "text-slate-500 hover:text-slate-700 font-medium"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-250",
                      active 
                        ? "bg-emerald-50 text-emerald-800 shadow-[0_5px_14px_rgba(16,185,129,0.14)] scale-105" 
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
