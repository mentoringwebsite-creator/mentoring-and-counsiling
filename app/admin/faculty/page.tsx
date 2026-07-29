'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, ShieldAlert, X, User, Mail, Phone, BookOpen, GraduationCap, Building, ShieldCheck, Users } from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' }
];

export default function AdminFacultyPage() {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [hodList, setHodList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mentor Detail Modal State
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [assignedMenteesCount, setAssignedMenteesCount] = useState<number>(0);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, status,
          faculty_profiles!user_id (
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

  const openMentorDetails = async (faculty: any) => {
    setSelectedMentor(faculty);
    setLoadingDetails(true);
    setAssignedMenteesCount(0);
    try {
      // Fetch count of students assigned to this mentor
      const { count, error } = await supabase
        .from('student_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('mentor_id', faculty.id);

      if (!error && count !== null) {
        setAssignedMenteesCount(count);
      }
    } catch (err) {
      console.error('Error fetching mentees count:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

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
      if (selectedMentor?.id === userId) setSelectedMentor(null);
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
      if (selectedMentor?.id === userId) setSelectedMentor(null);
      fetchFaculty();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete faculty.' });
    }
  };

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Manage Mentors" subtitle="View and manage approved mentor accounts">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/faculty" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Approved Mentors</h2>
              <p className="mt-2 text-slate-600">Review, suspend, or delete mentor profiles currently active in the system.</p>
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
                    <th className="px-5 py-4 font-semibold">Mentor Name / Email</th>
                    <th className="px-5 py-4 font-semibold">Mentor ID</th>
                    <th className="px-5 py-4 font-semibold">Department & Designation</th>
                    <th className="px-5 py-4 font-semibold">Assigned HOD</th>
                    <th className="px-5 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={5}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                          <span>Loading faculty…</span>
                        </div>
                      </td>
                    </tr>
                  ) : facultyList.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={5}>No approved faculty found.</td>
                    </tr>
                  ) : null}
                  {facultyList.map((faculty) => {
                    const profile = faculty.faculty_profiles?.[0] || {};
                    return (
                      <tr key={faculty.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div 
                            onClick={() => openMentorDetails(faculty)}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Click to view full details"
                          >
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 group-hover:border-emerald-500 transition">
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
                                <span className="font-bold text-slate-500 text-sm group-hover:text-emerald-700">{faculty.name ? faculty.name.charAt(0).toUpperCase() : 'M'}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-emerald-800 group-hover:underline transition">{faculty.name}</div>
                              <div className="text-xs text-slate-500">{faculty.email}</div>
                              <div className="text-xs font-semibold text-emerald-700 mt-0.5">{profile.contact_number || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.faculty_id || '-'}</td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-semibold uppercase">{profile.department || '-'}</div>
                          <div className="text-xs text-slate-500">{profile.designation || '-'}</div>
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
                              className="inline-flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                              title="Suspend Approval"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(faculty.id)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition cursor-pointer"
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

        {/* Full Mentor Details Modal */}
        {selectedMentor && (() => {
          const profile = selectedMentor.faculty_profiles?.[0] || {};
          const assignedHod = hodList.find(h => h.id === profile.hod_id);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header Cover */}
                <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shrink-0">
                  <button
                    onClick={() => setSelectedMentor(null)}
                    className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 backdrop-blur-md transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/80 bg-white/10 flex items-center justify-center shrink-0 shadow-md">
                      {profile.profile_photo ? (
                        <img src={profile.profile_photo} alt={selectedMentor.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-white/90" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold leading-tight">{selectedMentor.name}</h3>
                      <p className="text-xs font-semibold text-emerald-100/90 mt-0.5">{selectedMentor.email}</p>
                      <span className="inline-flex items-center gap-1 mt-2 rounded-lg bg-emerald-500/20 border border-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 backdrop-blur-md">
                        <ShieldCheck className="h-3 w-3" /> Faculty Mentor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mentor ID</span>
                      <p className="text-sm font-black font-mono text-slate-800 mt-1">{profile.faculty_id || 'N/A'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Department</span>
                      <p className="text-sm font-black text-slate-800 uppercase mt-1">{profile.department || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="h-4.5 w-4.5 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-600">Designation</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{profile.designation || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4.5 w-4.5 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-600">Contact Number</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{profile.contact_number || 'N/A'}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <BookOpen className="h-4 w-4 text-emerald-700" />
                        <span>Qualification & Subjects</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 pt-1">
                        <span className="text-slate-500 font-normal">Qualification: </span>{profile.qualification || 'Not Specified'}
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        <span className="text-slate-500 font-normal">Subjects Handling: </span>{profile.subjects || 'Not Specified'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Building className="h-4.5 w-4.5 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-600">Assigned HOD</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{assignedHod?.name || 'Unassigned'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4.5 w-4.5 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-600">Assigned Student Mentees</span>
                      </div>
                      <span className="text-xs font-black text-emerald-800">
                        {loadingDetails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `${assignedMenteesCount} Mentees`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4 bg-slate-50 shrink-0">
                  <button
                    onClick={() => handleStatusUpdate(selectedMentor.id, 'Pending')}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                  >
                    Suspend Account
                  </button>
                  <button
                    onClick={() => setSelectedMentor(null)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-900 px-5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </PageShell>
    </ProtectedRoute>
  );
}
