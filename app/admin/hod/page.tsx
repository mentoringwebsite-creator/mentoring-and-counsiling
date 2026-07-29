'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, ShieldAlert, X, CheckCircle2, User, Mail, Phone, Building, GraduationCap, ShieldCheck } from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' }
];

export default function AdminHodPage() {
  const [hodList, setHodList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detail Modal State
  const [selectedHod, setSelectedHod] = useState<any | null>(null);
  const [assignedMentorsCount, setAssignedMentorsCount] = useState<number>(0);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const fetchHod = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
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
        .eq('role', 'hod')
        .eq('status', 'Approved');

      if (error) throw error;

      // Auto repair & fallbacks
      const processed = (data || []).map((hod) => {
        const hp = hod.hod_profiles?.[0] || {};
        const fp = hod.faculty_profiles?.[0] || {};

        const facultyId = hp.faculty_id || fp.faculty_id || `HOD-${hod.id.substring(0, 5).toUpperCase()}`;
        const department = hp.department || fp.department || 'ECE';
        const designation = hp.designation || fp.designation || 'Head of Department';
        const contactNumber = hp.contact_number || fp.contact_number || '+91 8688939168';
        const profilePhoto = hp.profile_photo || fp.profile_photo || null;

        return {
          ...hod,
          profile: {
            faculty_id: facultyId,
            department: department,
            designation: designation,
            contact_number: contactNumber,
            profile_photo: profilePhoto
          }
        };
      });

      setHodList(processed);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load HODs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHod();
  }, []);

  const openHodDetails = async (hod: any) => {
    setSelectedHod(hod);
    setLoadingDetails(true);
    setAssignedMentorsCount(0);
    try {
      // Fetch number of faculty mentors under this HOD
      const { count, error } = await supabase
        .from('faculty_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('hod_id', hod.id);

      if (!error && count !== null) {
        setAssignedMentorsCount(count);
      }
    } catch (err) {
      console.error('Error fetching mentors count for HOD:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'Pending' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: `HOD status changed to ${newStatus}.` });
      if (selectedHod?.id === userId) setSelectedHod(null);
      fetchHod();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update HOD status.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to completely delete this HOD account? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'HOD account deleted successfully.' });
      if (selectedHod?.id === userId) setSelectedHod(null);
      fetchHod();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete HOD.' });
    }
  };

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Manage HOD" subtitle="View and manage approved HOD accounts">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/hod" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Approved HODs</h2>
              <p className="mt-2 text-slate-600">Review, suspend, or delete Head of Department profiles currently active in the system.</p>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            <div className="overflow-x-auto w-full rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 font-semibold">HOD Name / Email</th>
                    <th className="px-5 py-4 font-semibold">Faculty ID</th>
                    <th className="px-5 py-4 font-semibold">Department & Designation</th>
                    <th className="px-5 py-4 font-semibold">Contact Info</th>
                    <th className="px-5 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={5}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                          <span>Loading HODs…</span>
                        </div>
                      </td>
                    </tr>
                  ) : hodList.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={5}>No approved HODs found.</td>
                    </tr>
                  ) : null}
                  {hodList.map((hod) => {
                    const profile = hod.profile;
                    return (
                      <tr key={hod.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div 
                            onClick={() => openHodDetails(hod)}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Click to view full details"
                          >
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 group-hover:border-emerald-500 transition">
                              {profile.profile_photo ? (
                                <img
                                  src={profile.profile_photo}
                                  alt={hod.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(hod.name)}`;
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-slate-500 text-sm group-hover:text-emerald-700">{hod.name ? hod.name.charAt(0).toUpperCase() : 'H'}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-emerald-800 group-hover:underline transition">{hod.name}</div>
                              <div className="text-xs text-slate-500">{hod.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.faculty_id}</td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-semibold uppercase">{profile.department}</div>
                          <div className="text-xs text-slate-500">{profile.designation}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-semibold">{profile.contact_number}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(hod.id, 'Pending')}
                              className="inline-flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                              title="Suspend Approval"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(hod.id)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition cursor-pointer"
                              title="Delete HOD"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Full HOD Details Modal */}
        {selectedHod && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Header Cover */}
              <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shrink-0">
                <button
                  onClick={() => setSelectedHod(null)}
                  className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 backdrop-blur-md transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/80 bg-white/10 flex items-center justify-center shrink-0 shadow-md">
                    {selectedHod.profile.profile_photo ? (
                      <img src={selectedHod.profile.profile_photo} alt={selectedHod.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-white/90" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold leading-tight">{selectedHod.name}</h3>
                    <p className="text-xs font-semibold text-emerald-100/90 mt-0.5">{selectedHod.email}</p>
                    <span className="inline-flex items-center gap-1 mt-2 rounded-lg bg-emerald-500/20 border border-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 backdrop-blur-md">
                      <ShieldCheck className="h-3 w-3" /> Head of Department
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Faculty ID</span>
                    <p className="text-sm font-black font-mono text-slate-800 mt-1">{selectedHod.profile.faculty_id}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Department</span>
                    <p className="text-sm font-black text-slate-800 uppercase mt-1">{selectedHod.profile.department}</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="h-4.5 w-4.5 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-600">Designation</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">{selectedHod.profile.designation}</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4.5 w-4.5 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-600">Contact Number</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">{selectedHod.profile.contact_number}</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Building className="h-4.5 w-4.5 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-600">Assigned Mentors</span>
                    </div>
                    <span className="text-xs font-black text-emerald-800">
                      {loadingDetails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `${assignedMentorsCount} Faculty Mentors`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4 bg-slate-50 shrink-0">
                <button
                  onClick={() => handleStatusUpdate(selectedHod.id, 'Pending')}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                >
                  Suspend Account
                </button>
                <button
                  onClick={() => setSelectedHod(null)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-900 px-5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </PageShell>
    </ProtectedRoute>
  );
}
