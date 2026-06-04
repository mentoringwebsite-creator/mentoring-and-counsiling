'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Brand } from '@/components/brand';
import { LogOut, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(199,217,207,0.42),transparent_30%),radial-gradient(circle_at_top_right,rgba(234,218,177,0.30),transparent_28%),linear-gradient(180deg,#f4f7f4_0%,#edf2ee_100%)] text-portal-ink">
      <div className="min-h-screen w-full overflow-hidden bg-white/94 backdrop-blur-xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 bg-white/95 px-6 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <Brand compact />
            <div className="hidden border-l border-black/10 pl-4 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#315d47] md:grid">
              <span>Sreenidhi</span>
              <span>Student</span>
              <span>Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:text-right md:block">
              <div className="text-xl font-semibold tracking-[-0.04em]">{title}</div>
              {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
            </div>

            {userProfile && (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                <span className="hidden text-sm font-semibold text-portal-ink md:inline">{userProfile.name}</span>
                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-emerald-500/20 bg-emerald-50">
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
                    <ChevronDown className="h-4 w-4" />
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
        {children}
      </div>
    </div>
  );
}