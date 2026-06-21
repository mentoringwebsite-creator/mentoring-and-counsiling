'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, ShieldAlert, GraduationCap, Plus, X, Edit2, Award, BookOpen } from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Faculty' },
  { href: '/admin/hod', label: 'Manage HOD' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Academic Manager States
  const [academicModalOpen, setAcademicModalOpen] = useState(false);
  const [selectedStudentForAcademic, setSelectedStudentForAcademic] = useState<any | null>(null);
  const [academicProfileId, setAcademicProfileId] = useState<string | null>(null);
  const [academicSgpa, setAcademicSgpa] = useState<number>(8.0);
  const [academicCgpa, setAcademicCgpa] = useState<number>(8.0);
  const [academicBacklogs, setAcademicBacklogs] = useState<number>(0);
  const [academicSubjects, setAcademicSubjects] = useState<any[]>([]);
  const [academicSelectedSem, setAcademicSelectedSem] = useState<string>('All');
  const [academicSaving, setAcademicSaving] = useState(false);

  // Cumulative score input states
  const [statsEditMode, setStatsEditMode] = useState(false);
  const [inputSgpa, setInputSgpa] = useState('8.0');
  const [inputCgpa, setInputCgpa] = useState('8.0');
  const [inputBacklogs, setInputBacklogs] = useState('0');

  // Add/Edit subject modal states
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [subName, setSubName] = useState('');
  const [subSemester, setSubSemester] = useState('1');
  const [subMid1, setSubMid1] = useState('');
  const [subMid2, setSubMid2] = useState('');
  const [subSemesterMarks, setSubSemesterMarks] = useState('');
  const [subGpa, setSubGpa] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, status,
          student_profiles!user_id (
            id, roll_number, branch, section, academic_year, phone, dob, profile_photo, mentor_id, sgpa, cgpa, backlogs, academic_subjects
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load students.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'faculty')
        .eq('status', 'Approved');
      if (error) throw error;
      setFacultyList(data || []);
    } catch (err: any) {
      console.error('Error fetching faculty list:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchFaculty();
  }, []);

  const handleMentorChange = async (studentUserId: string, newMentorId: string) => {
    try {
      setFeedback(null);
      const { error } = await supabase
        .from('student_profiles')
        .update({ mentor_id: newMentorId || null })
        .eq('user_id', studentUserId);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Student mentor updated successfully.' });
      fetchStudents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update student mentor.' });
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'Pending' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: `Student status changed to ${newStatus}.` });
      fetchStudents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update student.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to completely delete this student account? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Student account deleted successfully.' });
      fetchStudents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete student.' });
    }
  };

  // Academic Profile Actions
  const openAcademicModal = (student: any) => {
    setSelectedStudentForAcademic(student);
    const profile = student.student_profiles?.[0] || {};
    setAcademicProfileId(profile.id || null);
    setAcademicSgpa(profile.sgpa !== undefined && profile.sgpa !== null ? Number(profile.sgpa) : 8.0);
    setAcademicCgpa(profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0);
    setAcademicBacklogs(profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0);
    setAcademicSubjects(profile.academic_subjects || []);

    setInputSgpa((profile.sgpa !== undefined && profile.sgpa !== null ? Number(profile.sgpa) : 8.0).toString());
    setInputCgpa((profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0).toString());
    setInputBacklogs((profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0).toString());

    setStatsEditMode(false);
    setAcademicModalOpen(true);
  };

  const handleAcademicSave = async (updatedSgpa: number, updatedCgpa: number, updatedBacklogs: number, updatedSubjects: any[]) => {
    if (!academicProfileId) {
      alert('Student profile record not found.');
      return;
    }

    try {
      setAcademicSaving(true);
      const { error } = await supabase
        .from('student_profiles')
        .update({
          sgpa: updatedSgpa,
          cgpa: updatedCgpa,
          backlogs: updatedBacklogs,
          academic_subjects: updatedSubjects
        })
        .eq('id', academicProfileId);

      if (error) throw error;

      // Update local state of the students list so it reflects dynamically without full page reload
      setStudents((prev) => 
        prev.map((s) => {
          if (s.id === selectedStudentForAcademic.id) {
            const updatedProfile = {
              ...s.student_profiles[0],
              sgpa: updatedSgpa,
              cgpa: updatedCgpa,
              backlogs: updatedBacklogs,
              academic_subjects: updatedSubjects
            };
            return {
              ...s,
              student_profiles: [updatedProfile]
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      console.error('Error updating academic records:', err);
      alert(err.message || 'Failed to update academic profile.');
    } finally {
      setAcademicSaving(false);
    }
  };

  const handleStatsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSgpa = Number(inputSgpa) || 0;
    const newCgpa = Number(inputCgpa) || 0;
    const newBacklogs = parseInt(inputBacklogs) || 0;

    setAcademicSgpa(newSgpa);
    setAcademicCgpa(newCgpa);
    setAcademicBacklogs(newBacklogs);
    setStatsEditMode(false);

    await handleAcademicSave(newSgpa, newCgpa, newBacklogs, academicSubjects);
  };

  // Subject Sub-modal operations
  const openAddSubModal = () => {
    setEditingSubIndex(null);
    setSubName('');
    setSubSemester(academicSelectedSem === 'All' ? '1' : academicSelectedSem);
    setSubMid1('');
    setSubMid2('');
    setSubSemesterMarks('');
    setSubGpa('');
    setSubModalOpen(true);
  };

  const openEditSubModal = (index: number) => {
    const sub = academicSubjects[index];
    setEditingSubIndex(index);
    setSubName(sub.name || '');
    setSubSemester(sub.semester?.toString() || '1');
    setSubMid1(sub.mid1?.toString() || '');
    setSubMid2(sub.mid2?.toString() || '');
    setSubSemesterMarks(sub.semester_marks?.toString() || '');
    setSubGpa(sub.gpa?.toString() || '');
    setSubModalOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    const newSub = {
      name: subName.trim(),
      semester: parseInt(subSemester) || 1,
      mid1: subMid1.trim() || '-',
      mid2: subMid2.trim() || '-',
      semester_marks: subSemesterMarks.trim() || '-',
      gpa: subGpa.trim() || '-',
    };

    let updatedSubjects = [...academicSubjects];
    if (editingSubIndex !== null) {
      updatedSubjects[editingSubIndex] = newSub;
    } else {
      updatedSubjects.push(newSub);
    }

    setAcademicSubjects(updatedSubjects);
    setSubModalOpen(false);
    await handleAcademicSave(academicSgpa, academicCgpa, academicBacklogs, updatedSubjects);
  };

  const handleSubDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this subject?')) return;
    const updatedSubjects = academicSubjects.filter((_, i) => i !== index);
    setAcademicSubjects(updatedSubjects);
    await handleAcademicSave(academicSgpa, academicCgpa, academicBacklogs, updatedSubjects);
  };

  const filteredAcademicSubjects = academicSubjects.filter((sub) => {
    if (academicSelectedSem === 'All') return true;
    return sub.semester?.toString() === academicSelectedSem;
  });

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Manage Students" subtitle="View and manage approved student accounts">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/students" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Approved Students</h2>
              <p className="mt-2 text-slate-600">Review student profiles, manage their assignments, update academic marks, or suspend accounts.</p>
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
                    <th className="px-5 py-4 font-semibold">Student Name / Email</th>
                    <th className="px-5 py-4 font-semibold">Roll Number</th>
                    <th className="px-5 py-4 font-semibold">Branch & Section</th>
                    <th className="px-5 py-4 font-semibold">Contact Info</th>
                    <th className="px-5 py-4 font-semibold">Assigned Mentor</th>
                    <th className="px-5 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                          <span>Loading students…</span>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>No approved students found.</td>
                    </tr>
                  ) : null}
                  {students.map((student) => {
                    const profile = student.student_profiles?.[0] || {};
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                              {profile.profile_photo ? (
                                <img
                                  src={profile.profile_photo}
                                  alt={student.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(student.name)}`;
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-slate-500 text-sm">{student.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{student.name}</div>
                              <div className="text-xs text-slate-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.roll_number || '-'}</td>
                        <td className="px-5 py-4 text-slate-700">
                          <div>{profile.branch || '-'}</div>
                          <div className="text-xs text-slate-500">Sec: {profile.section || '-'} | Year: {profile.academic_year || '-'}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div>Primary: {profile.phone || '-'}</div>
                          <div className="text-xs text-slate-500">Alt: {profile.alternate_phone || '-'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={profile.mentor_id || ''}
                            onChange={(e) => handleMentorChange(student.id, e.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none w-full max-w-[170px]"
                          >
                            <option value="">Unassigned</option>
                            {facultyList.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openAcademicModal(student)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition"
                              title="Manage Academic profile, subjects and marks"
                            >
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>Academics</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(student.id, 'Pending')}
                              className="inline-flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                              title="Suspend Approval (back to pending)"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(student.id)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                              title="Delete Student"
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

        {/* ==================== ACADEMIC MANAGER MODAL ==================== */}
        {academicModalOpen && selectedStudentForAcademic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setAcademicModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <GraduationCap className="h-6 w-6 text-emerald-800" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Manage Academic Profile</h3>
                  <p className="text-xs text-slate-500">Student: <span className="font-bold text-slate-800">{selectedStudentForAcademic.name}</span> ({selectedStudentForAcademic.student_profiles?.[0]?.roll_number || 'No Roll No.'})</p>
                </div>
              </div>

              {/* Cumulative stats section */}
              <div className="mt-5 p-4 rounded-3xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                    <Award className="h-4.5 w-4.5 text-emerald-800" />
                    <span>Cumulative Scorecard</span>
                  </div>
                  {!statsEditMode ? (
                    <button
                      onClick={() => setStatsEditMode(true)}
                      className="text-xs font-bold text-emerald-800 hover:underline"
                    >
                      Edit Scores
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Editing...</span>
                  )}
                </div>

                {!statsEditMode ? (
                  <div className="grid gap-3 grid-cols-3 text-center">
                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest SGPA</div>
                      <div className="text-xl font-bold text-emerald-800 mt-1">{academicSgpa.toFixed(2)}</div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative CGPA</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{academicCgpa.toFixed(2)}</div>
                    </div>
                    <div className={`border rounded-2xl p-3 shadow-sm bg-white ${academicBacklogs > 0 ? 'border-rose-100 text-rose-800' : 'border-slate-100 text-slate-700'}`}>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Backlogs</div>
                      <div className="text-xl font-bold mt-1">{academicBacklogs}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStatsSubmit} className="grid gap-4 md:grid-cols-4 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={inputSgpa}
                        onChange={(e) => setInputSgpa(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={inputCgpa}
                        onChange={(e) => setInputCgpa(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        value={inputBacklogs}
                        onChange={(e) => setInputBacklogs(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={academicSaving}
                        className="rounded-xl bg-[#1c5644] hover:bg-[#154335] px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-1 justify-center shrink-0 w-full"
                      >
                        {academicSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatsEditMode(false)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Subject overview list inside modal */}
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-4">
                    <h4 className="font-bold text-slate-800 text-base">Course Subjects & Marks</h4>
                    
                    <select
                      value={academicSelectedSem}
                      onChange={(e) => setAcademicSelectedSem(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 focus:outline-none"
                    >
                      <option value="All">All Semesters</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                      <option value="7">Semester 7</option>
                      <option value="8">Semester 8</option>
                    </select>
                  </div>

                  <button
                    onClick={openAddSubModal}
                    className="rounded-xl bg-[#1c5644] hover:bg-[#154335] px-3.5 py-2 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                {academicSaving && (
                  <div className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-2 rounded-xl mb-3 flex items-center gap-1.5 border border-emerald-100">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving changes to Supabase...</span>
                  </div>
                )}

                {filteredAcademicSubjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No subjects registered for this student under the selected filter.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                          <th className="p-3">Subject Name</th>
                          <th className="p-3">Semester</th>
                          <th className="p-3">Mid-1</th>
                          <th className="p-3">Mid-2</th>
                          <th className="p-3">Semester Marks</th>
                          <th className="p-3">GPA</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAcademicSubjects.map((sub, index) => {
                          const originalIndex = academicSubjects.findIndex(s => s === sub);
                          return (
                            <tr key={index} className="hover:bg-slate-50/30">
                              <td className="p-3 font-semibold text-slate-900">{sub.name}</td>
                              <td className="p-3 text-slate-700">Sem {sub.semester}</td>
                              <td className="p-3 text-slate-600">{sub.mid1}</td>
                              <td className="p-3 text-slate-600">{sub.mid2}</td>
                              <td className="p-3 text-slate-600">{sub.semester_marks}</td>
                              <td className="p-3 font-bold text-slate-900">{sub.gpa}</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditSubModal(originalIndex)}
                                    className="rounded-lg border border-slate-200 hover:bg-slate-50 p-1.5 text-slate-600 transition shadow-sm bg-white"
                                    title="Edit Subject Marks"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleSubDelete(originalIndex)}
                                    className="rounded-lg border border-slate-200 hover:bg-rose-50 p-1.5 text-rose-600 transition shadow-sm bg-white"
                                    title="Delete Subject"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
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
        )}

        {/* ==================== ADD/EDIT SUBJECT SUB-MODAL ==================== */}
        {subModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSubModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <BookOpen className="h-5 w-5 text-emerald-800" />
                <span>{editingSubIndex !== null ? 'Edit Course Marks' : 'Add Course Marks'}</span>
              </h3>

              <form onSubmit={handleSubSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g. Mathematics-I"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
                    <select
                      value={subSemester}
                      onChange={(e) => setSubSemester(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                      <option value="7">Semester 7</option>
                      <option value="8">Semester 8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={subGpa}
                      onChange={(e) => setSubGpa(e.target.value)}
                      placeholder="e.g. 9.0"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mid-1</label>
                    <input
                      type="text"
                      value={subMid1}
                      onChange={(e) => setSubMid1(e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mid-2</label>
                    <input
                      type="text"
                      value={subMid2}
                      onChange={(e) => setSubMid2(e.target.value)}
                      placeholder="e.g. 19"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Semester</label>
                    <input
                      type="text"
                      value={subSemesterMarks}
                      onChange={(e) => setSubSemesterMarks(e.target.value)}
                      placeholder="e.g. 84"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
                  >
                    Save Subject
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
