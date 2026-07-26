'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardList, 
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
  { href: '/faculty', label: 'Mentor Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/academic-forms', label: 'Academic Forms' },
  { href: '/faculty/attendance-forms', label: 'Attendance Forms' },
  { href: '/faculty/queries', label: 'Student Queries' }
];

const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

const DEFAULT_SUBJECTS: Record<string, Array<{ name: string; code: string }>> = {
  '1-1': [
    { name: 'ENGINEERING PHYSICS', code: '9HC07' },
    { name: 'PROBLEM SOLVING USING C', code: '9FC01' },
    { name: 'MATRIX ALGEBRA AND CALCULUS', code: '9HC11' },
    { name: 'ESSENTIAL ENGLISH LANGUAGE SKILLS', code: '9HC01' },
    { name: 'ENGINEERING GRAPHICS', code: '9BC01' }
  ],
  '3-2': [
    { name: 'Microwave Engineering', code: '9EC06' },
    { name: 'Microprocessors and Microcontrollers', code: '9EC07' },
    { name: 'VLSI Design', code: '9EC08' },
    { name: 'Open Elective - I', code: '9OE01' },
    { name: 'Professional Elective - II', code: '9PE02' }
  ]
};

export default function FacultyAcademicFormsPage() {
  const [loading, setLoading] = useState(true);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('3-2');
  const [formTitle, setFormTitle] = useState('Semester 3-2 Marks Form');
  const [targetStudentId, setTargetStudentId] = useState<string>('all');
  const [subjectRows, setSubjectRows] = useState<Array<{ name: string; code: string }>>([
    { name: 'Microwave Engineering', code: '9EC06' },
    { name: 'Microprocessors and Microcontrollers', code: '9EC07' },
    { name: 'VLSI Design', code: '9EC08' }
  ]);
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

      // 2. Fetch marks forms created by this mentor
      const { data: formsData } = await supabase
        .from('academic_forms')
        .select('*')
        .eq('mentor_id', userId)
        .eq('form_type', 'semester_marks')
        .order('created_at', { ascending: false });

      setForms(formsData || []);

      // 3. Fetch marks form submissions sent to this mentor
      const { data: subsData } = await supabase
        .from('academic_form_submissions')
        .select(`
          *,
          users!student_id (name, email)
        `)
        .eq('mentor_id', userId)
        .eq('form_type', 'semester_marks')
        .order('submitted_at', { ascending: false });

      setSubmissions(subsData || []);
    } catch (err: any) {
      console.error('Error loading academic forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSemesterChange = (sem: string) => {
    setSelectedSemester(sem);
    const defaults = DEFAULT_SUBJECTS[sem] || [
      { name: `Subject 1 (${sem})`, code: `SUB01` },
      { name: `Subject 2 (${sem})`, code: `SUB02` }
    ];
    setSubjectRows(defaults);
    setFormTitle(`Semester ${sem} Marks Form`);
  };

  const addSubjectRow = () => {
    setSubjectRows([...subjectRows, { name: '', code: '' }]);
  };

  const removeSubjectRow = (index: number) => {
    setSubjectRows(subjectRows.filter((_, i) => i !== index));
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectRows.length === 0) {
      alert('Please add at least one subject to the form.');
      return;
    }

    try {
      setSending(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Must be logged in');

      const payload = {
        mentor_id: userId,
        student_id: targetStudentId === 'all' ? null : targetStudentId,
        form_type: 'semester_marks',
        title: formTitle,
        semester: selectedSemester,
        fields: subjectRows,
        status: 'Active'
      };

      const { error } = await supabase.from('academic_forms').insert(payload);
      if (error) throw error;

      setFeedback({ type: 'success', message: 'Semester Marks Form sent successfully to students!' });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error creating form:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to send form.' });
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
        .select('*')
        .eq('user_id', sub.student_id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const profileId = studentProf?.id;
      if (!profileId) throw new Error('Student profile record not found.');

      const rawSubData = sub.submission_data;
      const isObj = rawSubData && !Array.isArray(rawSubData);
      const submittedMarks: any[] = isObj ? (rawSubData.fields || []) : (rawSubData || []);
      const submittedSgpa = isObj ? parseFloat(rawSubData.sgpa) : NaN;
      const submittedCgpa = isObj ? parseFloat(rawSubData.cgpa) : NaN;

      const semValue = sub.semester || '3-2';
      const existingSubjects: any[] = studentProf?.academic_subjects || [];
      const updatedSubjects = [...existingSubjects];

      submittedMarks.forEach((m: any) => {
        const total = (parseInt(m.internal) || 0) + (parseInt(m.external) || 0);
        let grade = 'A';
        if (total >= 90) grade = 'O';
        else if (total >= 80) grade = 'A+';
        else if (total >= 70) grade = 'A';
        else if (total >= 60) grade = 'B+';
        else if (total >= 50) grade = 'B';
        else if (total >= 40) grade = 'C';
        else grade = 'F';

        const newSubObj = {
          code: m.code,
          name: m.name,
          sem: semValue,
          semester: semValue,
          credits: '3',
          internal: m.internal,
          internal_marks: m.internal,
          external: m.external,
          external_marks: m.external,
          totalMarks: total,
          total_marks: total,
          total: total,
          gpa: grade,
          result: grade === 'F' ? 'FAIL' : 'P'
        };

        const idx = updatedSubjects.findIndex((s: any) => 
          s.code === m.code && (s.sem === semValue || s.semester === semValue)
        );
        if (idx >= 0) {
          updatedSubjects[idx] = newSubObj;
        } else {
          updatedSubjects.push(newSubObj);
        }
      });

      let backlogs = 0;
      let totalPts = 0;
      let totalCreds = 0;
      updatedSubjects.forEach((s: any) => {
        const cr = parseFloat(s.credits) || 3;
        let gp = 8;
        if (s.gpa === 'O') gp = 10;
        else if (s.gpa === 'A+') gp = 9;
        else if (s.gpa === 'A') gp = 8;
        else if (s.gpa === 'B+') gp = 7;
        else if (s.gpa === 'B') gp = 6;
        else if (s.gpa === 'C') gp = 5;
        else if (s.gpa === 'F') { gp = 0; backlogs++; }
        totalPts += gp * cr;
        totalCreds += cr;
      });

      const newCgpa = totalCreds > 0 ? parseFloat((totalPts / totalCreds).toFixed(2)) : 8.0;
      const finalSgpa = !isNaN(submittedSgpa) && submittedSgpa > 0 ? submittedSgpa : newCgpa;
      const finalCgpa = !isNaN(submittedCgpa) && submittedCgpa > 0 ? submittedCgpa : newCgpa;

      const { error: updateProfErr } = await supabase
        .from('student_profiles')
        .update({
          academic_subjects: updatedSubjects,
          sgpa: finalSgpa,
          cgpa: finalCgpa,
          backlogs: backlogs
        })
        .eq('id', profileId);

      if (updateProfErr) throw updateProfErr;

      const { error: updateSubErr } = await supabase
        .from('academic_form_submissions')
        .update({
          status: 'Approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      if (updateSubErr) throw updateSubErr;

      setFeedback({ type: 'success', message: `Submission approved and student academic ledger updated!` });
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
    const reason = prompt('Enter reason for resubmission / rejection:', 'Marks incomplete or incorrect.');
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
      setFeedback({ type: 'success', message: 'Marks form rejected and student notified for resubmission.' });
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
      <PageShell title="Academic Forms" subtitle="Send and verify Semester Marks Forms">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/academic-forms" items={facultySidebarItems} />

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
                  <ClipboardList className="h-5 w-5 text-emerald-700" />
                  <span>Semester Marks Forms</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Send internal & external subject marks forms to your {assignedStudents.length} assigned students and verify submitted grades.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] text-white px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Marks Form</span>
              </button>
            </div>

            {/* Tab Filter */}
            <div className="flex border-b border-slate-200 gap-6">
              <button
                onClick={() => setActiveTab('review')}
                className={`pb-3 text-sm font-bold transition relative ${
                  activeTab === 'review' ? 'text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Submitted Marks ({submissions.filter(s => s.status === 'Submitted').length} Pending)
              </button>
              <button
                onClick={() => setActiveTab('forms')}
                className={`pb-3 text-sm font-bold transition relative ${
                  activeTab === 'forms' ? 'text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Active Sent Forms ({forms.length})
              </button>
            </div>

            {loading ? (
              <div className="portal-card flex h-[250px] items-center justify-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mr-2" />
                <span>Loading marks forms...</span>
              </div>
            ) : activeTab === 'review' ? (
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="portal-card p-8 text-center text-sm text-slate-500">
                    No student marks submissions to review yet. Forms sent to students will appear here once submitted.
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
                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                Semester {sub.semester || '3-2'} Marks
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

                        {(() => {
                          const rawData = sub.submission_data;
                          const isObj = rawData && !Array.isArray(rawData);
                          const rows: any[] = isObj ? (rawData.fields || []) : (rawData || []);
                          const sgpaVal = isObj ? rawData.sgpa : null;
                          const cgpaVal = isObj ? rawData.cgpa : null;

                          return (
                            <div className="space-y-3">
                              {(sgpaVal || cgpaVal) && (
                                <div className="flex flex-wrap items-center gap-6 bg-purple-50 border border-purple-200 p-3 rounded-2xl">
                                  {sgpaVal && (
                                    <div>
                                      <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">Submitted SGPA:</span>
                                      <span className="ml-1.5 text-sm font-extrabold text-purple-950">{sgpaVal}</span>
                                    </div>
                                  )}
                                  {cgpaVal && (
                                    <div>
                                      <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">Submitted CGPA:</span>
                                      <span className="ml-1.5 text-sm font-extrabold text-purple-950">{cgpaVal}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="text-slate-500 font-bold uppercase text-[9px] border-b border-slate-200">
                                      <th className="p-2">Subject Code</th>
                                      <th className="p-2">Subject Name</th>
                                      <th className="p-2 text-center">Internal (40)</th>
                                      <th className="p-2 text-center">External (60)</th>
                                      <th className="p-2 text-center font-black text-slate-800">Total (100)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                                    {rows.map((m: any, i: number) => (
                                      <tr key={i}>
                                        <td className="p-2 font-mono font-bold">{m.code}</td>
                                        <td className="p-2 font-semibold">{m.name}</td>
                                        <td className="p-2 text-center">{m.internal || 0}</td>
                                        <td className="p-2 text-center">{m.external || 0}</td>
                                        <td className="p-2 text-center font-bold text-emerald-800">{(parseInt(m.internal) || 0) + (parseInt(m.external) || 0)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {forms.length === 0 ? (
                  <div className="portal-card col-span-2 p-8 text-center text-sm text-slate-500">
                    No active marks forms created. Click "Create Marks Form" above to dispatch a form to your students.
                  </div>
                ) : (
                  forms.map((f) => (
                    <div key={f.id} className="portal-card border border-slate-200 bg-white p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Semester {f.semester || '3-2'} Marks Form
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
                          Target: {f.student_id ? 'Single Student' : `All Assigned Students (${assignedStudents.length})`}
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

        {/* Modal: Create & Dispatch Marks Form */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-emerald-700" />
                  <span>Dispatch Semester Marks Form</span>
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateForm} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid gap-4 md:grid-cols-2">
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

                {/* Subject Rows Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Form Subjects ({subjectRows.length})</label>
                    <button
                      type="button"
                      onClick={addSubjectRow}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Subject</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {subjectRows.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Subject Code (e.g. 9EC06)"
                          value={row.code}
                          onChange={(e) => {
                            const updated = [...subjectRows];
                            updated[idx].code = e.target.value;
                            setSubjectRows(updated);
                          }}
                          required
                          className="w-1/3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Subject Name (e.g. Microwave Engineering)"
                          value={row.name}
                          onChange={(e) => {
                            const updated = [...subjectRows];
                            updated[idx].name = e.target.value;
                            setSubjectRows(updated);
                          }}
                          required
                          className="w-2/3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
                        />
                        {subjectRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubjectRow(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
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
                    <span>Dispatch Marks Form</span>
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
