'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Faculty' },
  { href: '/admin/hod', label: 'Manage HOD' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AdminHodPage() {
  const [hodList, setHodList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchHod = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, status,
          hod_profiles (
            faculty_id, department, designation, contact_number, profile_photo
          )
        `)
        .eq('role', 'hod')
        .eq('status', 'Approved');

      if (error) throw error;
      setHodList(data || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load HODs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHod();
  }, []);

  const handleStatusUpdate = async (userId: string, newStatus: 'Pending' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: `HOD status changed to ${newStatus}.` });
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
                    const profile = hod.hod_profiles?.[0] || {};
                    return (
                      <tr key={hod.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
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
                                <span className="font-bold text-slate-500 text-sm">{hod.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{hod.name}</div>
                              <div className="text-xs text-slate-500">{hod.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.faculty_id || '-'}</td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-semibold">{profile.department || '-'}</div>
                          <div className="text-xs text-slate-500">{profile.designation || '-'}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-semibold">{profile.contact_number || '-'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(hod.id, 'Pending')}
                              className="inline-flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                              title="Suspend Approval"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(hod.id)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
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
      </PageShell>
    </ProtectedRoute>
  );
}
