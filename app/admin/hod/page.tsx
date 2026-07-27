'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, ShieldAlert, Edit2, X, CheckCircle2, User } from 'lucide-react';

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

  // Edit Modal State
  const [editingHod, setEditingHod] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    faculty_id: '',
    department: '',
    designation: '',
    contact_number: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

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

  const openEditModal = (hod: any) => {
    setEditingHod(hod);
    setEditForm({
      name: hod.name || '',
      faculty_id: hod.profile.faculty_id || '',
      department: hod.profile.department || 'ECE',
      designation: hod.profile.designation || 'Head of Department',
      contact_number: hod.profile.contact_number || ''
    });
  };

  const closeEditModal = () => {
    setEditingHod(null);
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!editingHod) return;
    setSavingEdit(true);
    setFeedback(null);
    try {
      // 1. Update users table (name)
      const { error: userErr } = await supabase
        .from('users')
        .update({ name: editForm.name })
        .eq('id', editingHod.id);

      if (userErr) throw userErr;

      // 2. Upsert hod_profiles table
      const { error: profileErr } = await supabase
        .from('hod_profiles')
        .upsert({
          user_id: editingHod.id,
          faculty_id: editForm.faculty_id,
          department: editForm.department,
          designation: editForm.designation,
          contact_number: editForm.contact_number
        }, { onConflict: 'user_id' });

      if (profileErr) throw profileErr;

      setFeedback({ type: 'success', message: `Updated details for ${editForm.name} successfully.` });
      closeEditModal();
      fetchHod();
    } catch (err: any) {
      console.error('Failed to update HOD details:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to update HOD details.' });
      setSavingEdit(false);
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
              <p className="mt-2 text-slate-600">Review, edit profile details, suspend, or delete Head of Department profiles currently active in the system.</p>
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
                                <span className="font-bold text-slate-500 text-sm">{hod.name ? hod.name.charAt(0).toUpperCase() : 'H'}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{hod.name}</div>
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
                              onClick={() => openEditModal(hod)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                              title="Edit HOD Details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
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

        {/* Edit HOD Modal */}
        {editingHod && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-800" />
                  <span>Edit HOD Profile</span>
                </h3>
                <button
                  onClick={closeEditModal}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Faculty ID</label>
                  <input
                    type="text"
                    value={editForm.faculty_id}
                    onChange={(e) => setEditForm({ ...editForm, faculty_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Department</label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={editForm.contact_number}
                    onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </PageShell>
    </ProtectedRoute>
  );
}
