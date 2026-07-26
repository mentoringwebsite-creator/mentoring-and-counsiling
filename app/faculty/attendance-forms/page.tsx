'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  Plus, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  UserCheck, 
  Clock, 
  Trash2
} from 'lucide-react';

const facultySidebarItems = [
  { href: '/faculty', label: 'My Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/academic-forms', label: 'Academic Forms' },
  { href: '/faculty/attendance-forms', label: 'Attendance Forms' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/notes', label: 'Mentor Notes' }
];

const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

export default function FacultyAttendanceFormsPage() {
  const [loading, setLoading] = useState(true);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('3-2');
  const [formTitle, setFormTitle] = useState('15-Day Attendance Progress Form (3-2)');
  const [targetStudentId, setTargetStudentId] = useState<string>('all');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'forms'>('review');

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      // 1. Fetch assigned students
      const { data: studentsData } = await supabase
        .from('users')
        .select(`
          id, email, name, role,
          student_profiles!user_id (
            roll_number, branch, section, academic_year, mentor_id
          )
        `)
        .eq('role', 'student');

      const myStudents = (studentsData || []).filter(
        (s: any) => s.student_profiles?.[0]?.mentor_id === userId
      );
      setAssignedStudents(myStudents);

      // 2. Fetch attendance forms created by this mentor
      const { data: formsData } = await supabase
        .from('academic_forms')
        .select('*')
        .eq('mentor_id', userId)
        .eq('form_type', 'attendance')
        .order('created_at', { ascending: false });

      setForms(formsData || []);

      // 3. Fetch attendance form submissions sent to this mentor
      const { data: subsData } = await supabase
        .from('academic_form_submissions')
        .select(`
          *,
          users!student_id (name, email)
        `)
        .eq('mentor_id', userId)
        .eq('form_type', 'attendance')
        .order('submitted_at', { ascending: false });

      setSubmissions(subsData || []);
    } catch (err: any) {
      console.error('Error loading attendance forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSemesterChange = (sem: string) => {
    setSelectedSemester(sem);
    setFormTitle(`15-Day Attendance Progress Form (${sem})`);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Must be logged in');

      const payload = {
        mentor_id: userId,
        student_id: targetStudentId === 'all' ? null : targetStudentId,
        form_type: 'attendance',
        title: formTitle,
        semester: selectedSemester,
        fields: [],
        status: 'Active'
      };

      const { error } = await supabase.from('academic_forms').insert(payload);
      if (error) throw error;

      setFeedback({ type: 'success', message: 'Attendance Form sent successfully to students!' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error creating attendance form:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to send form.' });
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // 15-Day Quick Auto Send Attendance Form
  const handleQuickSendAttendanceForm = async () => {
    if (assignedStudents.length === 0) {
      alert('You have no assigned students to send attendance forms to.');
      return;
    }

    if (!confirm(`Send 15-Day Attendance Form to all ${assignedStudents.length} assigned students?`)) return;

    try {
      setSending(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Must be logged in');

      const sem = '3-2';
      const payload = {
        mentor_id: userId,
        student_id: null, // all assigned
        form_type: 'attendance',
        title: `15-Day Attendance Progress Form (${sem})`,
        semester: sem,
        fields: [],
        status: 'Active'
      };

      const { error } = await supabase.from('academic_forms').insert(payload);
      if (error) throw error;

      setFeedback({ type: 'success', message: '15-Day Attendance Form sent to all assigned students!' });
      fetchData();
    } catch (err: any) {
      console.error('Error quick sending attendance form:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to send attendance form.' });
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleApproveSubmission = async (sub: any) => {
    try {
      setSending(true);

      const { data: studentProf, error: fetchErr } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', sub.student_id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const profileId = studentProf?.id;
      if (!profileId) throw new Error('Student profile record not found.');

      const attendanceVal = parseFloat(sub.overall_attendance) || 85.0;

      const { error: updateAttErr } = await supabase
        .from('student_profiles')
        .update({
          attendance_percentage: attendanceVal
        })
        .eq('id', profileId);

      if (updateAttErr) throw updateAttErr;

      const { error: updateSubErr } = await supabase
        .from('academic_form_submissions')
        .update({
          status: 'Approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      if (updateSubErr) throw updateSubErr;

      setFeedback({ type: 'success', message: `Attendance submission approved and student record updated!` });
      fetchData();
    } catch (err: any) {
      console.error('Error approving submission:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to approve submission.' });
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleRejectSubmission = async (subId: string) => {
    const reason = prompt('Enter reason for resubmission / rejection:', 'Attendance percentage requires clarification.');
    if (!reason) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('academic_form_submissions')
        .update({
          status: 'Rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', subId);

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Attendance form rejected and student notified.' });
      fetchData();
    } catch (err: any) {
      console.error('Error rejecting submission:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to reject form.' });
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      const { error } = await supabase.from('academic_forms').delete().eq('id', formId);
      if (error) throw error;
      setFeedback({ type: 'success', message: 'Form deleted successfully.' });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete form.' });
    }
  };

  return (
    <ProtectedRoute role="faculty">
      <PageShell title="Attendance Forms" subtitle="Send 15-day attendance forms and verify student records">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/attendance-forms" items={facultySidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {feedback && (
              <div className={`rounded-2xl border p-4 text-sm font-semibold shadow-sm animate-fade-in ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Top Action Bar */}
            <div className="portal-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-850 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-700" />
                  <span>15-Day Attendance Progress Forms</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Send 15-day attendance percentage forms to your {assignedStudents.length} assigned students and verify submitted attendance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleQuickSendAttendanceForm}
                  disabled={sending}
                  className="rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Send 15-Day Attendance Form</span>
                </button>

                <button
                  onClick={() => setModalOpen(true)}
                  className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] text-white px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Custom Attendance Form</span>
                </button>
              </div>
            </div>

            {/* Tab Filter */}
            <div className="flex border-b border-slate-200 gap-6">
              <button
                onClick={() => setActiveTab('review')}
                className={`pb-3 text-sm font-bold transition relative ${
                  activeTab === 'review' ? 'text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Submitted Attendance ({submissions.filter(s => s.status === 'Submitted').length} Pending)
              </button>
              <button
                onClick={() => setActiveTab('forms')}
                className={`pb-3 text-sm font-bold transition relative ${
                  activeTab === 'forms' ? 'text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Active Attendance Forms ({forms.length})
              </button>
            </div>

            {loading ? (
              <div className="portal-card flex h-[250px] items-center justify-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mr-2" />
                <span>Loading attendance forms...</span>
              </div>
            ) : activeTab === 'review' ? (
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="portal-card p-8 text-center text-sm text-slate-500">
                    No attendance submissions to review yet. Forms sent to students will appear here once submitted.
                  </div>
                ) : (
                  submissions.map((sub) => {
                    const isSubmitted = sub.status === 'Submitted';
                    const isApproved = sub.status === 'Approved';

                    return (
                      <div key={sub.id} className="portal-card border border-slate-200 bg-white p-5 rounded-3xl shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-base text-slate-900">{sub.users?.name || 'Student'}</span>
                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-850">
                                Attendance Form ({sub.semester || '3-2'})
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Submitted: {new Date(sub.submitted_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              isApproved ? 'bg-emerald-100 text-emerald-800' :
                              sub.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-850'
                            }`}>
                              {isApproved ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              <span>{sub.status}</span>
                            </span>

                            {isSubmitted && (
                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  onClick={() => handleApproveSubmission(sub)}
                                  disabled={sending}
                                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  <span>Approve & Sync</span>
                                </button>
                                <button
                                  onClick={() => handleRejectSubmission(sub.id)}
                                  disabled={sending}
                                  className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                          <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Overall Attendance Percentage:</span>
                          <span className="text-lg font-black text-amber-950">{sub.overall_attendance}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {forms.length === 0 ? (
                  <div className="portal-card col-span-2 p-8 text-center text-sm text-slate-500">
                    No active attendance forms created. Click "Send 15-Day Attendance Form" or "Create Custom Attendance Form" above.
                  </div>
                ) : (
                  forms.map((f) => (
                    <div key={f.id} className="portal-card border border-slate-200 bg-white p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-850">
                            Attendance Form
                          </span>
                          <button
                            onClick={() => handleDeleteForm(f.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">{f.title}</h3>
                        <p className="text-xs text-slate-500 mb-3">
                          Target: {f.student_id ? 'Single Student' : `All Assigned Students (${assignedStudents.length})`} • Semester: {f.semester || '3-2'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Created: {new Date(f.created_at).toLocaleDateString()}</span>
                        <span className="font-bold text-emerald-800">Active</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create Attendance Form */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-700" />
                  <span>Dispatch Attendance Form</span>
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateForm} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold"
                  >
                    {SEMESTERS.map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Students</label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold"
                  >
                    <option value="all">All My Assigned Students ({assignedStudents.length})</option>
                    {assignedStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.student_profiles?.[0]?.roll_number || st.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Form Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>Dispatch Attendance Form</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}
