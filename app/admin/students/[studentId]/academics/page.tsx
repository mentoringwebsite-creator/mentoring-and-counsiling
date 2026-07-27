'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ArrowLeft, BookOpen, GraduationCap, 
  Award, AlertTriangle, CheckCircle2, TrendingUp, Briefcase, User
} from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/mentors', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AdminStudentAcademicsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentUserId = params.studentId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedSubjects, setEditedSubjects] = useState<any[] | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const rawSem = searchParams.get('semester') || searchParams.get('sem');
    if (rawSem) {
      const cleanSem = rawSem.replace(/^Sem\s*/i, '').trim();
      setSelectedSemester(cleanSem);
    }
  }, [searchParams]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id (*)
        `)
        .eq('id', studentUserId)
        .single();

      if (dbError || !data) {
        throw new Error(dbError?.message || 'Student not found.');
      }

      const { data: subjectsDb } = await supabase
        .from('academic_records')
        .select('*')
        .eq('student_id', studentUserId);

      const { data: sgpaDb } = await supabase
        .from('semester_sgpa')
        .select('*')
        .eq('student_id', studentUserId);

      setStudent({
        ...data,
        profile: data.student_profiles?.[0] || {},
        academic_records: subjectsDb || [],
        semester_sgpa: sgpaDb || []
      });

    } catch (err: any) {
      console.error('Error fetching student academic details:', err);
      setError(err.message || 'Failed to load student academic records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentUserId) {
      fetchStudentDetails();
    }
  }, [studentUserId]);

  if (!mounted) return null;

  const profile = student?.profile || {};
  const studentName = student?.name || 'Student';
  const studentRoll = profile.roll_number || 'N/A';

  const normalizeSem = (sStr: string): string => {
    const s = String(sStr).toLowerCase().replace('sem', '').replace('semester', '').trim();
    if (s === '1') return '1-1';
    if (s === '2') return '1-2';
    if (s === '3') return '2-1';
    if (s === '4') return '2-2';
    if (s === '5') return '3-1';
    if (s === '6') return '3-2';
    if (s === '7') return '4-1';
    if (s === '8') return '4-2';
    return sStr;
  };

  const getSemesterDisplay = (semVal: any) => {
    const norm = normalizeSem(String(semVal));
    if (norm === '1-1') return '1-1 (I Year I Sem)';
    if (norm === '1-2') return '1-2 (I Year II Sem)';
    if (norm === '2-1') return '2-1 (II Year I Sem)';
    if (norm === '2-2') return '2-2 (II Year II Sem)';
    if (norm === '3-1') return '3-1 (III Year I Sem)';
    if (norm === '3-2') return '3-2 (III Year II Sem)';
    if (norm === '4-1') return '4-1 (IV Year I Sem)';
    if (norm === '4-2') return '4-2 (IV Year II Sem)';
    return `Sem ${semVal}`;
  };

  const allRecords = student?.academic_records || [];
  const activeRecords = editMode && editedSubjects ? editedSubjects : allRecords;

  const filteredRecords = selectedSemester === 'All'
    ? activeRecords
    : activeRecords.filter((rec: any) => {
        const normRec = normalizeSem(String(rec.semester));
        const normSel = normalizeSem(selectedSemester);
        return normRec === normSel || String(rec.semester) === selectedSemester;
      });

  const handleStartEdit = () => {
    setEditedSubjects(JSON.parse(JSON.stringify(allRecords)));
    setEditedProfile({
      cgpa: profile.cgpa !== undefined && profile.cgpa !== null ? profile.cgpa : 7.96,
      backlogs: profile.backlogs !== undefined && profile.backlogs !== null ? profile.backlogs : 0,
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedSubjects(null);
    setEditedProfile(null);
  };

  const handleSubjectChange = (index: number, field: string, value: any) => {
    if (!editedSubjects) return;
    const updated = [...editedSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSubjects(updated);
  };

  const handleSaveMarks = async () => {
    if (!editedSubjects) return;
    try {
      setSaving(true);

      for (const sub of editedSubjects) {
        if (sub.id) {
          const { error } = await supabase
            .from('academic_records')
            .update({
              grade: sub.grade,
              grade_points: Number(sub.grade_points || 0),
              credits: Number(sub.credits || 0),
              result: sub.result,
              internal_marks: Number(sub.internal_marks || 0),
              external_marks: Number(sub.external_marks || 0),
              total_marks: Number(sub.total_marks || 0),
            })
            .eq('id', sub.id);
          if (error) console.error('Error updating subject:', error);
        }
      }

      if (editedProfile) {
        const { error: profErr } = await supabase
          .from('student_profiles')
          .update({
            cgpa: Number(editedProfile.cgpa || 0),
            backlogs: Number(editedProfile.backlogs || 0),
          })
          .eq('user_id', studentUserId);
        if (profErr) console.error('Error updating student profile stats:', profErr);
      }

      setEditMode(false);
      setEditedSubjects(null);
      setEditedProfile(null);
      await fetchStudentDetails();
    } catch (err: any) {
      console.error('Error saving edited marks:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Academic Semester Ledger" subtitle="Review and manage academic performance records">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/students" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button 
                onClick={() => router.push(`/admin/students/${studentUserId}` as any)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-700" />
                <span>Back to Student Profile</span>
              </button>

              {!editMode ? (
                <button
                  onClick={handleStartEdit}
                  className="rounded-xl bg-emerald-800 hover:bg-emerald-900 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
                >
                  Edit Marks & Grades
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMarks}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="portal-card flex h-64 items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500 font-bold">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span>Loading academic records...</span>
                </div>
              </div>
            ) : error ? (
              <div className="portal-card p-6 border-rose-200 bg-rose-50 text-rose-800 font-bold text-sm">
                {error}
              </div>
            ) : (
              <div className="space-y-6">

                {/* Scorecard Header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{studentName}</h2>
                      <p className="text-xs font-bold text-emerald-800 uppercase mt-0.5">ROLL NO: {studentRoll}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[90px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">CGPA</span>
                        {editMode && editedProfile ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editedProfile.cgpa}
                            onChange={(e) => setEditedProfile({ ...editedProfile, cgpa: e.target.value })}
                            className="w-16 text-center font-black text-sm text-emerald-800 rounded border border-slate-300 px-1 py-0.5 mt-0.5"
                          />
                        ) : (
                          <span className="text-base font-black text-emerald-800">{Number(profile.cgpa || 7.96).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[90px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Backlogs</span>
                        {editMode && editedProfile ? (
                          <input
                            type="number"
                            value={editedProfile.backlogs}
                            onChange={(e) => setEditedProfile({ ...editedProfile, backlogs: e.target.value })}
                            className="w-12 text-center font-black text-sm text-amber-700 rounded border border-slate-300 px-1 py-0.5 mt-0.5"
                          />
                        ) : (
                          <span className="text-base font-black text-amber-700">{profile.backlogs || 0}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semester Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                  {['All', '1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(sem)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                        selectedSemester === sem
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sem === 'All' ? 'All Semesters' : sem}
                    </button>
                  ))}
                </div>

                {/* Subjects Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-700" />
                      <span>Course Subjects & Marks Ledger ({filteredRecords.length})</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                      <thead className="bg-slate-100/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Subject Name</th>
                          <th className="px-4 py-3 text-center">Semester</th>
                          <th className="px-4 py-3 text-center">Grade</th>
                          <th className="px-4 py-3 text-center">Grade Points</th>
                          <th className="px-4 py-3 text-center">Credits</th>
                          <th className="px-4 py-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic font-medium">
                              No subject records found for {selectedSemester === 'All' ? 'this student' : `Semester ${selectedSemester}`}.
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((rec: any, idx: number) => (
                            <tr key={rec.id || idx} className="hover:bg-slate-50/60 transition">
                              <td className="px-4 py-3 font-mono font-bold text-slate-800">{rec.subject_code || 'CS601'}</td>
                              <td className="px-4 py-3 font-bold text-slate-900">{rec.subject_name}</td>
                              <td className="px-4 py-3 text-center font-bold text-emerald-800">{getSemesterDisplay(rec.semester)}</td>
                              
                              <td className="px-4 py-3 text-center font-bold">
                                {editMode ? (
                                  <input
                                    type="text"
                                    value={rec.grade || ''}
                                    onChange={(e) => handleSubjectChange(idx, 'grade', e.target.value)}
                                    className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 font-bold uppercase"
                                  />
                                ) : (
                                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-black text-slate-800">
                                    {rec.grade || 'A+'}
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-center font-black text-slate-800">
                                {editMode ? (
                                  <input
                                    type="number"
                                    value={rec.grade_points || 0}
                                    onChange={(e) => handleSubjectChange(idx, 'grade_points', e.target.value)}
                                    className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 font-bold"
                                  />
                                ) : (
                                  rec.grade_points !== undefined ? rec.grade_points : 9
                                )}
                              </td>

                              <td className="px-4 py-3 text-center font-black text-slate-800">
                                {editMode ? (
                                  <input
                                    type="number"
                                    value={rec.credits || 0}
                                    onChange={(e) => handleSubjectChange(idx, 'credits', e.target.value)}
                                    className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 font-bold"
                                  />
                                ) : (
                                  rec.credits !== undefined ? rec.credits : 4
                                )}
                              </td>

                              <td className="px-4 py-3 text-center">
                                {editMode ? (
                                  <select
                                    value={rec.result || 'PASS'}
                                    onChange={(e) => handleSubjectChange(idx, 'result', e.target.value)}
                                    className="rounded border border-slate-300 px-1 py-0.5 text-xs font-bold"
                                  >
                                    <option value="PASS">PASS</option>
                                    <option value="FAIL">FAIL</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                    rec.result === 'FAIL' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {rec.result || 'PASS'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
