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

export default function AdminFacultyPage() {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [hodList, setHodList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, status,
          faculty_profiles (
            faculty_id, department, designation, qualification, subjects, contact_number, profile_photo, hod_id
          )
        `)
        .eq('role', 'faculty')
        .eq('status', 'Approved');

      if (error) throw error;
      setFacultyList(data || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load faculty.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHodList = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'hod')
        .eq('status', 'Approved');
      if (error) throw error;
      setHodList(data || []);
    } catch (err: any) {
      console.error('Error fetching HOD list:', err);
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchHodList();
  }, []);

  const handleHodChange = async (facultyUserId: string, newHodId: string) => {
    try {
      setFeedback(null);
      const { error } = await supabase
        .from('faculty_profiles')
        .update({ hod_id: newHodId || null })
        .eq('user_id', facultyUserId);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Faculty HOD updated successfully.' });
      fetchFaculty();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update faculty HOD.' });
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'Pending' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: `Faculty status changed to ${newStatus}.` });
      fetchFaculty();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update faculty status.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to completely delete this faculty account? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Faculty account deleted successfully.' });
      fetchFaculty();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete faculty.' });
    }
  };

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Manage Faculty" subtitle="View and manage approved faculty accounts">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar active="/admin/faculty" items={adminSidebarItems} />

          <div className="space-y-6">
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Approved Faculty</h2>
              <p className="mt-2 text-slate-600">Review, suspend, or delete faculty profiles currently active in the system.</p>
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

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Faculty Name / Email</th>
                    <th className="px-5 py-4 font-semibold">Faculty ID</th>
                    <th className="px-5 py-4 font-semibold">Department & Designation</th>
                    <th className="px-5 py-4 font-semibold">Qualification & Subjects</th>
                    <th className="px-5 py-4 font-semibold">Assigned HOD</th>
                    <th className="px-5 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                          <span>Loading faculty…</span>
                        </div>
                      </td>
                    </tr>
                  ) : facultyList.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>No approved faculty found.</td>
                    </tr>
                  ) : null}
                  {facultyList.map((faculty) => {
                    const profile = faculty.faculty_profiles?.[0] || {};
                    return (
                      <tr key={faculty.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                              {profile.profile_photo ? (
                                <img
                                  src={profile.profile_photo}
                                  alt={faculty.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(faculty.name)}`;
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-slate-500 text-sm">{faculty.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{faculty.name}</div>
                              <div className="text-xs text-slate-500">{faculty.email}</div>
                              <div className="text-xs font-semibold text-emerald-700 mt-0.5">{profile.contact_number || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.faculty_id || '-'}</td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-semibold">{profile.department || '-'}</div>
                          <div className="text-xs text-slate-500">{profile.designation || '-'}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div>Qual: {profile.qualification || '-'}</div>
                          <div className="text-xs text-slate-500 break-words max-w-[200px]">Subjects: {profile.subjects || '-'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={profile.hod_id || ''}
                            onChange={(e) => handleHodChange(faculty.id, e.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none w-full max-w-[170px]"
                          >
                            <option value="">Unassigned</option>
                            {hodList.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(faculty.id, 'Pending')}
                              className="inline-flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                              title="Suspend Approval"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(faculty.id)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                              title="Delete Faculty"
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
