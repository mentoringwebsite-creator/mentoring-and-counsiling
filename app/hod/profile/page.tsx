'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, User, Phone, Mail, Layers, Briefcase, Key } from 'lucide-react';

const hodSidebarItems = [
  { href: '/hod', label: 'HOD Dashboard' },
  { href: '/hod/profile', label: 'Profile' },
  { href: '/hod/students', label: 'Students' },
  { href: '/hod/queries', label: 'Student Queries' },
  { href: '/hod/reports', label: 'Reports' }
];

export default function HodProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHodProfile() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const userId = session.user.id;
        const email = session.user.email || '';

        // Get name
        const { data: userDb } = await supabase
          .from('users')
          .select('name')
          .eq('id', userId)
          .single();

        // Get HOD details
        const { data: hodDb } = await supabase
          .from('hod_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        setProfile({
          name: userDb?.name || session.user.user_metadata?.name || 'Dr. D. Mohan',
          designation: hodDb?.designation || 'Professor & HOD',
          department: hodDb?.department || 'ECM – Electronics & Computer Engineering',
          facultyId: hodDb?.faculty_id || 'HOD10234',
          email: email,
          contact: hodDb?.contact_number || '+91 9876543210',
          photo: hodDb?.profile_photo || ''
        });
      } catch (err) {
        console.error('Error fetching HOD profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHodProfile();
  }, []);

  return (
    <ProtectedRoute role="hod">
      <PageShell title="HOD Profile" subtitle="Sreenidhi Institute of Science and Technology">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar active="/hod/profile" items={hodSidebarItems} />

          <div className="grid gap-6">
            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading profile information…</span>
                </div>
              </div>
            ) : (
              <div className="portal-card">
                <div className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]">
                  
                  {/* Left: Profile Photo Container */}
                  <div className="rounded-3xl bg-[linear-gradient(180deg,#f0f6f3,#e7f0eb)] p-4 flex flex-col items-center justify-center">
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-inner flex items-center justify-center">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name)}`;
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-455">
                          <User className="h-16 w-16 text-emerald-800/40" />
                          <span className="mt-2 text-xs font-semibold text-emerald-800/40">No photo uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Static Profile Details */}
                  <div className="flex flex-col justify-center text-portal-ink">
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
                      <p className="text-emerald-700 font-semibold text-sm tracking-wide mt-1 uppercase">{profile.designation}</p>
                    </div>

                    <div className="h-px bg-slate-200/80 mb-6" />

                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Name</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.name}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Designation</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.designation}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Department</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.department}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Key className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Faculty ID</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.facultyId}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">HOD Email</div>
                          <div className="font-semibold text-emerald-800 underline break-all mt-0.5">{profile.email}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Contact Number</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{profile.contact}</div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
