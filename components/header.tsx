'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  showUserMenu?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  showBackButton = true,
  backHref,
  showUserMenu = true,
  rightElement
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  
  let portalRole = '';
  if (pathname.startsWith('/student')) portalRole = 'Student';
  else if (pathname.startsWith('/faculty')) portalRole = 'Faculty';
  else if (pathname.startsWith('/hod')) portalRole = 'HOD';
  else if (pathname.startsWith('/admin')) portalRole = 'Admin';
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; photo: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!showUserMenu) return;
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
        console.error('Error fetching user header profile:', err);
      }
    }

    fetchUserData();
  }, [showUserMenu]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleBack = () => {
    if (backHref) {
      router.push(backHref as any);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-[72px] flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-sm shrink-0">
      <div className="flex items-center gap-3 max-w-[70%] overflow-hidden">
        {showBackButton && (
          <button 
            onClick={handleBack}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm active:scale-95 shrink-0"
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        
        <Link href="/" className="flex items-center shrink-0">
          <div className="relative h-12 w-[220px] sm:w-[250px]">
            <Image 
              src="/assets/sreenidhi-logo.png" 
              alt="Sreenidhi logo" 
              fill
              priority 
              className="object-contain object-left"
            />
          </div>
        </Link>

        {portalRole && (
          <div className="hidden border-l border-slate-200 pl-4 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-emerald-700 md:grid shrink-0">
            <span>Sreenidhi</span>
            <span>{portalRole}</span>
            <span>Portal</span>
          </div>
        )}

        {title && (
          <div className="border-l border-slate-200 pl-2 sm:pl-3 lg:hidden overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 sm:text-base">{title}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {rightElement}
        
        {showUserMenu && userProfile && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:gap-3 sm:pl-4">
            <span className="hidden text-sm font-bold text-slate-900 md:inline">{userProfile.name}</span>
            <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-emerald-100 bg-emerald-50 shadow-sm shrink-0">
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
                <div className="flex h-full w-full items-center justify-center bg-emerald-600 font-bold text-white uppercase text-xs">
                  {userProfile.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition duration-150"
              >
                <span className="hidden sm:inline">Logout</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-md z-50">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
