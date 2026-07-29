'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ArrowLeft, User, Mail, Phone, 
  GraduationCap, Building, ShieldCheck, Users, ExternalLink,
  ShieldAlert, Trash2
} from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' }
];

export default function AdminHodDetailPage({ params }: { params: Promise<{ hodId: string }> }) {
  const resolvedParams = use(params);
  const hodId = resolvedParams.hodId;
  const router = useRouter();

  const [hod, setHod] = useState<any | null>(null);
  const [departmentMentors, setDepartmentMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadHodData = async () => {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, name, email, role, status,
          hod_profiles!user_id (
            faculty_id, department, designation, contact_number, profile_photo
          ),
          faculty_profiles!user_id (
            faculty_id, department, designation, contact_number, profile_photo
          )
        `)
        .eq('id', hodId)
        .single();

      if (userError || !userData) throw new Error('HOD not found.');

      const hp = userData.hod_profiles?.[0] || {};
      const fp = userData.faculty_profiles?.[0] || {};

      const processedHod = {
        ...userData,
        profile: {
          faculty_id: hp.faculty_id || fp.faculty_id || `HOD-${userData.id.substring(0, 5).toUpperCase()}`,
          department: hp.department || fp.department || 'ECE',
          designation: hp.designation || fp.designation || 'Head of Department',
          contact_number: hp.contact_number || fp.contact_number || '+91 8688939168',
          profile_photo: hp.profile_photo || fp.profile_photo || null
        }
      };

      setHod(processedHod);

      // Fetch mentors assigned to this HOD
      const { data: mentorsDb } = await supabase
        .from('users')
        .select(`
          id, name, email,
          faculty_profiles!user_id (
            faculty_id, department, designation, contact_number, qualification
          )
        `)
        .eq('role', 'faculty')
        .eq('status', 'Approved');

      const assignedMentors = (mentorsDb || []).filter((m: any) => {
        const fpObj = m.faculty_profiles?.[0] || {};
        return fpObj.hod_id === hodId;
      });

      setDepartmentMentors(assignedMentors);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load HOD details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHodData();
  }, [hodId]);

  const handleStatusUpdate = async (newStatus: 'Pending' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', hodId);

      if (error) throw error;

      setFeedback({ type: 'success', message: `HOD status changed to ${newStatus}.` });
      loadHodData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update HOD status.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to completely delete this HOD account? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', hodId);

      if (error) throw error;

      router.push('/admin/hod');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete HOD.' });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute role="admin">
        <PageShell title="HOD Details" subtitle="Loading HOD profile...">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  if (!hod) {
    return (
      <ProtectedRoute role="admin">
        <PageShell title="HOD Details" subtitle="HOD profile not found">
          <div className="p-8 text-center">
            <p className="text-slate-500 font-semibold mb-4">The requested Head of Department profile could not be found.</p>
            <button
              onClick={() => router.push('/admin/hod')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Manage HOD</span>
            </button>
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  const profile = hod.profile;

  return (
    <ProtectedRoute role="admin">
      <PageShell title={`${hod.name} - HOD Details`} subtitle="View Head of Department profile and assigned department faculty mentors">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/hod" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => router.push('/admin/hod')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-700" />
                <span>Back to Manage HOD</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusUpdate('Pending')}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Suspend Account</span>
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete HOD</span>
                </button>
              </div>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Profile Header Banner */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 md:p-8 text-white">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/80 bg-white/10 flex items-center justify-center shrink-0 shadow-lg">
                    {profile.profile_photo ? (
                      <img src={profile.profile_photo} alt={hod.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-white/90" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl md:text-3xl font-black">{hod.name}</h1>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-white/20 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-emerald-100 backdrop-blur-md">
                        <ShieldCheck className="h-3.5 w-3.5" /> Head of Department
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-emerald-100/90 mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-300" />
                      <span>{hod.email}</span>
                      {profile.contact_number && (
                        <>
                          <span>•</span>
                          <Phone className="h-4 w-4 text-emerald-300" />
                          <span>{profile.contact_number}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Faculty ID</span>
                  <span className="text-base font-black font-mono text-slate-900 mt-1 block">{profile.faculty_id}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Department</span>
                  <span className="text-base font-black text-slate-900 uppercase mt-1 block">{profile.department}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Designation</span>
                  <span className="text-base font-black text-slate-900 mt-1 block truncate">{profile.designation}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Mentors</span>
                  <span className="text-base font-black text-emerald-800 mt-1 block">{departmentMentors.length} Faculty Mentors</span>
                </div>
              </div>
            </div>

            {/* Department Mentors Table */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-700" />
                <span>Assigned Faculty Mentors ({departmentMentors.length})</span>
              </h3>

              {departmentMentors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
                  No faculty mentors are currently assigned under HOD {hod.name}.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-semibold text-slate-700">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Mentor Name / Email</th>
                        <th className="px-5 py-3.5">Faculty ID</th>
                        <th className="px-5 py-3.5">Department</th>
                        <th className="px-5 py-3.5">Contact Number</th>
                        <th className="px-5 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {departmentMentors.map((m) => {
                        const mProfile = m.faculty_profiles?.[0] || {};
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900">{m.name}</div>
                              <div className="text-[11px] text-slate-500 font-normal">{m.email}</div>
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-slate-800">{mProfile.faculty_id || 'N/A'}</td>
                            <td className="px-5 py-4 uppercase font-bold text-slate-800">{mProfile.department || 'ECE'}</td>
                            <td className="px-5 py-4 text-slate-800 font-semibold">{mProfile.contact_number || 'N/A'}</td>
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => router.push(`/admin/faculty/${m.id}` as any)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <span>View Mentor Details</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
