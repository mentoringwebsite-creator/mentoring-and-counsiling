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
import { getStudentAcademicData } from '@/lib/studentAcademicService';

const facultySidebarItems = [
  { href: '/faculty', label: 'Mentor Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/academic-forms', label: 'Academic Forms' },
  { href: '/faculty/attendance-forms', label: 'Attendance Forms' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/mentoring-status', label: 'Mentoring Status' }
];

export default function StudentAcademicsPage() {
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

  useEffect(() => {
    if (!studentUserId) return;

    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('users')
          .select(`
            id, name, email,
            student_profiles!user_id (
              roll_number, branch, section, academic_year, phone, alternate_phone, profile_photo,
              cgpa, backlogs, sgpa, academic_subjects, attendance_percentage
            )
          `)
          .eq('id', studentUserId)
          .single();

        if (dbError) throw dbError;
        setStudent(data);
      } catch (err: any) {
        console.error('Failed to fetch student academics:', err);
        setError('Unable to load student academic details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentUserId]);

  if (!mounted) return null;

  const profile = student?.student_profiles?.[0] || {};
  const academicSummary = getStudentAcademicData(profile);
  const { cgpaVal, backlogsVal, attendanceVal, subjects } = academicSummary;

  const normalizeSem = (val: string | number | undefined | null): string => {
    if (!val) return '';
    const s = String(val).trim();
    const map: Record<string, string> = {
      '1': '1-1', '1-1': '1-1',
      '2': '1-2', '1-2': '1-2',
      '3': '2-1', '2-1': '2-1',
      '4': '2-2', '2-2': '2-2',
      '5': '3-1', '3-1': '3-1',
      '6': '3-2', '3-2': '3-2',
      '7': '4-1', '4-1': '4-1',
      '8': '4-2', '4-2': '4-2'
    };
    return map[s] || s;
  };

  const filteredSubjects = subjects.filter((sub: any) => {
    if (!selectedSemester || selectedSemester === 'All') return true;
    return normalizeSem(sub.sem || sub.semester) === normalizeSem(selectedSemester);
  });

  const displaySubjects = (editMode && editedSubjects) ? editedSubjects.filter((s: any) => {
    if (!selectedSemester || selectedSemester === 'All') return true;
    return normalizeSem(s.sem || s.semester) === normalizeSem(selectedSemester);
  }) : filteredSubjects;

  const beginEdit = () => {
    setEditedSubjects(JSON.parse(JSON.stringify(subjects || [])));
    setEditedProfile(JSON.parse(JSON.stringify(profile || {})));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditedSubjects(null);
    setEditedProfile(null);
    setEditMode(false);
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    if (!editedSubjects) return;
    const copy = [...editedSubjects];
    // find the matching subject in the editedSubjects by index of filteredSubjects
    // map filtered index -> overall subjects index
    const filtered = filteredSubjects.map((f: any) => {
      const code = f.code || f.subject_code || f.subjectCode || f.subjectCode;
      return String(code || '').toLowerCase();
    });
    const targetCode = filtered[index];
    const overallIndex = copy.findIndex((s: any) => String((s.code || s.subject_code || s.subjectCode || '')).toLowerCase() === targetCode);
    const targetIdx = overallIndex >= 0 ? overallIndex : index;
    copy[targetIdx] = { ...(copy[targetIdx] || {}), [field]: value };
    setEditedSubjects(copy);
  };

  const handleProfileFieldChange = (field: string, value: any) => {
    setEditedProfile((prev: any) => ({ ...(prev || {}), [field]: value }));
  };

  const saveEdits = async () => {
    if (!editedSubjects) return;
    setSaving(true);
    try {
      // Build payload merging academic_subjects and edited profile fields
      const payload: any = {};
      if (editedSubjects) payload.academic_subjects = editedSubjects;
      if (editedProfile) {
        if (editedProfile.cgpa !== undefined) payload.cgpa = editedProfile.cgpa;
        if (editedProfile.sgpa !== undefined) payload.sgpa = editedProfile.sgpa;
        if (editedProfile.backlogs !== undefined) payload.backlogs = editedProfile.backlogs;
        if (editedProfile.attendance_percentage !== undefined) payload.attendance_percentage = editedProfile.attendance_percentage;
      }

      const { data, error: upErr } = await supabase
        .from('student_profiles')
        .update(payload)
        .eq('user_id', studentUserId);

      if (upErr) throw upErr;

      // Refresh local state
      const updatedProfile = { ...(profile || {}), ...(editedProfile || {}), academic_subjects: editedSubjects || profile.academic_subjects };
      setStudent({ ...student, student_profiles: [updatedProfile] });
      setEditMode(false);
      setEditedSubjects(null);
      setEditedProfile(null);
    } catch (err: any) {
      console.error('Failed to save edited marks:', err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedSemSGPA = () => {
    if (selectedSemester === 'All' || filteredSubjects.length === 0) return (cgpaVal ?? 0).toFixed(2);
    let totalGradePoints = 0;
    let totalCredits = 0;

    const gradePointMap: Record<string, number> = {
      'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0
    };

    filteredSubjects.forEach((sub: any) => {
      const credits = parseFloat(sub.credits) || 3;
      const grade = (sub.gpa || sub.grade || sub.gradeSecured || 'A').toUpperCase();
      const points = gradePointMap[grade] ?? (parseFloat(grade) || 8);
      totalGradePoints += points * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : (cgpaVal ?? 0).toFixed(2);
  };

  return (
    <ProtectedRoute role="faculty">
      <PageShell
        title="Academic Semester Ledger"
        subtitle={student ? `${student.name} • ${profile.roll_number || 'Academic Details'}` : 'Academic Profile'}
      >
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/students" items={facultySidebarItems} />

          <div className="space-y-5 w-full min-w-0">
            {/* Header Back & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => router.push(`/faculty/students/${studentUserId}` as any)}
                className="group inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 transition-all bg-emerald-50 hover:bg-emerald-100/70 px-4 py-2 rounded-xl border border-emerald-200 shadow-xs"
              >
                <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Student Profile</span>
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Select Semester:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="All">All Semesters</option>
                  <option value="1">Sem 1 (1-1)</option>
                  <option value="2">Sem 2 (1-2)</option>
                  <option value="3">Sem 3 (2-1)</option>
                  <option value="4">Sem 4 (2-2)</option>
                  <option value="5">Sem 5 (3-1)</option>
                  <option value="6">Sem 6 (3-2)</option>
                  <option value="7">Sem 7 (4-1)</option>
                  <option value="8">Sem 8 (4-2)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading student academic ledger...</span>
                </div>
              </div>
            ) : error ? (
              <div className="portal-card flex flex-col items-center justify-center text-rose-800 p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-rose-500 mb-3" />
                <p className="font-bold text-lg">Error Loading Academics</p>
                <p className="text-sm mt-1 text-rose-600 max-w-md">{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Student Overview Header Card */}
                <div className="rounded-[24px] border border-slate-200 bg-gradient-to-r from-[#1c5644] to-[#12382c] p-6 text-white shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      {profile.profile_photo ? (
                        <img
                          src={profile.profile_photo}
                          alt={student.name}
                          className="h-16 w-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-white border border-white/20">
                          {student.name ? student.name.substring(0, 2).toUpperCase() : 'ST'}
                        </div>
                      )}
                      <div>
                        <h1 className="text-xl font-black tracking-tight">{student.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-emerald-100 font-semibold">
                          <span>{profile.roll_number || 'N/A'}</span>
                          <span>•</span>
                          <span>{profile.branch || 'B.Tech'}</span>
                          <span>•</span>
                          <span>Year {profile.academic_year || '4'}</span>
                          {profile.section && (
                            <>
                              <span>•</span>
                              <span>Section {profile.section}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary Metric Pills */}
                      <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15 text-center">
                        <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Overall CGPA</div>
                        <div className="text-lg font-black text-white">
                          {editMode ? (
                            <input type="number" step="0.01" value={editedProfile?.cgpa ?? cgpaVal} onChange={(e) => handleProfileFieldChange('cgpa', e.target.value)} className="w-20 text-center rounded-md border border-white/20 px-2 py-1 text-sm bg-transparent text-white" />
                          ) : (
                            cgpaVal !== null ? cgpaVal.toFixed(2) : 'N/A'
                          )}
                        </div>
                      </div>
                      
                      <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15 text-center">
                        <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Selected SGPA</div>
                        <div className="text-lg font-black text-emerald-300">
                          {editMode ? (
                            <input type="number" step="0.01" value={editedProfile?.sgpa ?? getSelectedSemSGPA()} onChange={(e) => handleProfileFieldChange('sgpa', e.target.value)} className="w-20 text-center rounded-md border border-white/20 px-2 py-1 text-sm bg-transparent text-emerald-300" />
                          ) : (
                            getSelectedSemSGPA()
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15 text-center">
                        <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Backlogs</div>
                        <div className={`text-lg font-black ${((editedProfile?.backlogs ?? backlogsVal) === 0 || (editedProfile?.backlogs ?? backlogsVal) === null) ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {editMode ? (
                            <input type="number" value={editedProfile?.backlogs ?? (backlogsVal ?? 0)} onChange={(e) => handleProfileFieldChange('backlogs', Number(e.target.value))} className="w-16 text-center rounded-md border border-white/20 px-2 py-1 text-sm bg-transparent text-emerald-300" />
                          ) : (
                            backlogsVal !== null ? backlogsVal : 'N/A'
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15 text-center">
                        <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Attendance</div>
                        <div className="text-lg font-black text-white">
                          {editMode ? (
                            <input type="number" value={editedProfile?.attendance_percentage ?? (attendanceVal ?? 0)} onChange={(e) => handleProfileFieldChange('attendance_percentage', Number(e.target.value))} className="w-16 text-center rounded-md border border-white/20 px-2 py-1 text-sm bg-transparent text-white" />
                          ) : (
                            attendanceVal !== null ? `${attendanceVal}%` : 'N/A'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Ledger Table Card */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-50 p-2.5 text-[#1c5644] border border-emerald-100">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900">Academic Semester Ledger</h2>
                        <p className="text-xs font-semibold text-slate-400">
                          {selectedSemester === 'All' 
                            ? 'Showing all semester subject details, internal & external marks' 
                            : `Displaying detailed ledger for Semester ${normalizeSem(selectedSemester)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                      <TrendingUp className="h-4 w-4 text-[#1c5644]" />
                      <span>Total Courses: {filteredSubjects.length}</span>
                    </div>
                      <div className="flex items-center gap-2">
                        {!editMode ? (
                          <button
                            onClick={beginEdit}
                            className="rounded-xl bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold"
                          >
                            Edit Marks
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveEdits}
                              disabled={saving}
                              className="rounded-xl bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                      <thead className="bg-slate-50/90 text-[10px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3.5">Subject Code</th>
                          <th className="px-4 py-3.5">Subject Name</th>
                          <th className="px-4 py-3.5 text-center">Semester</th>
                          <th className="px-4 py-3.5 text-center">Credits</th>
                          <th className="px-4 py-3.5 text-center">Mid-1</th>
                          <th className="px-4 py-3.5 text-center">Mid-2</th>
                          <th className="px-4 py-3.5 text-center">Int (40)</th>
                          <th className="px-4 py-3.5 text-center">Ext (60)</th>
                          <th className="px-4 py-3.5 text-center">Total</th>
                          <th className="px-4 py-3.5 text-center">Grade Secured</th>
                          <th className="px-4 py-3.5 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        { displaySubjects.length > 0 ? (
                          displaySubjects.map((sub: any, idx: number) => {
                            const subCode = sub.code || sub.subject_code || sub.subjectCode || '—';
                            const subName = sub.name || sub.subject_name || sub.subjectName || 'Subject';
                            const subSem = sub.sem || sub.semester || '1-1';
                            const subCredits = sub.credits ?? '3';
                            const subMid1 = sub.mid1 ?? sub.mid_1 ?? '-';
                            const subMid2 = sub.mid2 ?? sub.mid_2 ?? '-';
                            const subInt = sub.internal_marks ?? sub.internal ?? sub.int ?? '-';
                            const subExt = sub.external_marks ?? sub.external ?? sub.ext ?? '-';
                            const subTotal = sub.total_marks ?? sub.totalMarks ?? sub.total ?? '-';
                            const subGrade = sub.gpa ?? sub.grade ?? sub.gradeSecured ?? 'A';
                            const subResult = (sub.result || sub.status || (subGrade === 'F' ? 'F' : 'P')).toString().toUpperCase();
                            const isPass = subResult === 'P' || subResult === 'PASS';

                            return (
                              <tr key={idx} className="hover:bg-emerald-50/20 transition duration-150">
                                <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{subCode}</td>
                                <td className="px-4 py-3.5 font-bold text-slate-900">{subName}</td>
                                <td className="px-4 py-3.5 text-center font-bold text-slate-600">{subSem}</td>
                                <td className="px-4 py-3.5 text-center font-bold text-slate-700">{subCredits}</td>
                                <td className="px-4 py-3.5 text-center text-slate-500">
                                  {editMode ? (
                                    <input type="number" value={subMid1 ?? ''} onChange={(e) => handleFieldChange(idx, 'mid1', Number(e.target.value) || 0)} className="w-16 text-center rounded-md border border-slate-200 px-2 py-1 text-xs" />
                                  ) : subMid1}
                                </td>
                                <td className="px-4 py-3.5 text-center text-slate-500">
                                  {editMode ? (
                                    <input type="number" value={subMid2 ?? ''} onChange={(e) => handleFieldChange(idx, 'mid2', Number(e.target.value) || 0)} className="w-16 text-center rounded-md border border-slate-200 px-2 py-1 text-xs" />
                                  ) : subMid2}
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                                  {editMode ? (
                                    <input type="number" value={subInt ?? ''} onChange={(e) => handleFieldChange(idx, 'internal_marks', Number(e.target.value) || 0)} className="w-16 text-center rounded-md border border-slate-200 px-2 py-1 text-xs" />
                                  ) : subInt}
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                                  {editMode ? (
                                    <input type="number" value={subExt ?? ''} onChange={(e) => handleFieldChange(idx, 'external_marks', Number(e.target.value) || 0)} className="w-16 text-center rounded-md border border-slate-200 px-2 py-1 text-xs" />
                                  ) : subExt}
                                </td>
                                <td className="px-4 py-3.5 text-center font-black text-slate-900">
                                  {editMode ? ((Number(subMid1 || 0) + Number(subMid2 || 0) + Number(subInt || 0) + Number(subExt || 0)) ) : subTotal}
                                </td>
                                <td className="px-4 py-3.5 text-center font-black text-[#1c5644]">{subGrade}</td>
                                <td className="px-4 py-3.5 text-center">
                                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black shadow-xs ${
                                    isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isPass ? 'P' : 'F'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={11} className="px-4 py-12 text-center text-xs text-slate-400 italic">
                              No course subjects recorded for this semester filter.
                            </td>
                          </tr>
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
