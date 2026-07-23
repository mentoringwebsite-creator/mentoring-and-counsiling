'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { Loader2, Search, UserCheck, UserPlus, UserMinus } from 'lucide-react';

const facultySidebarItems = [
  { href: '/faculty', label: 'Faculty Dashboard' },
  { href: '/faculty/profile', label: 'Profile' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/notes', label: 'Mentor Notes' }
];

export default function FacultyStudentsPage() {
  const router = useRouter();
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-students' | 'unassigned' | 'all'>('my-students');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getStudentBTechYear = (profile: any) => {
    const acYear = profile?.academic_year || '';
    const roll = profile?.roll_number || '';
    const acYearStr = String(acYear).toLowerCase();
    if (acYearStr.includes('iv year') || acYearStr.includes('4th year') || acYearStr === '4' || acYearStr.includes('fourth')) return 'IV Year';
    if (acYearStr.includes('iii year') || acYearStr.includes('3rd year') || acYearStr === '3' || acYearStr.includes('third')) return 'III Year';
    if (acYearStr.includes('ii year') || acYearStr.includes('2nd year') || acYearStr === '2' || acYearStr.includes('second')) return 'II Year';
    if (acYearStr.includes('i year') || acYearStr.includes('1st year') || acYearStr === '1' || acYearStr.includes('first')) return 'I Year';

    const r = String(roll).trim();
    if (r.length >= 2) {
      const joinYearDigits = parseInt(r.substring(0, 2));
      if (!isNaN(joinYearDigits)) {
        const currentYear = 2026;
        const currentYearDigits = currentYear % 100; // 26
        const diff = currentYearDigits - joinYearDigits;
        if (diff === 0 || diff === 1) return 'I Year';
        if (diff === 2) return 'II Year';
        if (diff === 3) return 'III Year';
        if (diff >= 4) return 'IV Year';
      }
    }
    return 'I Year';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const fId = session.user.id;
      setFacultyId(fId);

      // Fetch all approved students and their profiles
      const { data: studentsDb, error } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id (
            roll_number, branch, section, phone, dob, profile_photo, mentor_id, cgpa, backlogs
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (error) throw error;
      setStudents(studentsDb || []);
    } catch (err: any) {
      console.error('Error loading student roster:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load students. Make sure database policies are updated.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (studentUserId: string, assign: boolean) => {
    try {
      setFeedback(null);
      const newMentorId = assign ? facultyId : null;

      // Update student profile mentor_id
      const { error } = await supabase
        .from('student_profiles')
        .update({ mentor_id: newMentorId })
        .eq('user_id', studentUserId);

      if (error) throw error;

      setFeedback({
        type: 'success',
        message: assign ? 'Student assigned to you successfully!' : 'Student removed from your list.'
      });

      // Reload
      await loadData();
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to update assignment.' });
    }
  };

  // Filter students based on active tab and search query
  const filteredStudents = students.filter((student) => {
    const profile = student.student_profiles?.[0] || {};
    
    // Only show students assigned to this faculty, or unassigned students
    const isMine = profile.mentor_id === facultyId;
    const isUnassigned = !profile.mentor_id;
    if (!isMine && !isUnassigned) {
      return false;
    }

    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'my-students') {
      return isMine;
    }
    if (activeTab === 'unassigned') {
      return isUnassigned;
    }
    return true;
  });

  return (
    <ProtectedRoute role="faculty">
      <PageShell title="My Students" subtitle="Manage and monitor your assigned students">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/students" items={facultySidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Student Mentor Assignment</h2>
              <p className="mt-2 text-slate-600">Select students to assign them to your mentoring queue, or monitor details of already assigned students.</p>
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

            {/* Controls bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Tab Selector */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  onClick={() => setActiveTab('my-students')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'my-students'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  My Mentored Students
                </button>
                <button
                  onClick={() => setActiveTab('unassigned')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'unassigned'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Unassigned
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'all'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  All Approved
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto w-full rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Roll No</th>
                    <th className="px-5 py-4 font-semibold">Name</th>
                    <th className="px-5 py-4 font-semibold">Branch & Section</th>
                    <th className="px-5 py-4 font-semibold">CGPA</th>
                    <th className="px-5 py-4 font-semibold">Risk</th>
                    <th className="px-5 py-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                          <span>Loading student list…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>No students found in this category.</td>
                    </tr>
                  ) : null}
                  {!loading && filteredStudents.map((student) => {
                    const profile = student.student_profiles?.[0] || {};
                    const cgpaVal = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
                    const backlogsVal = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
                    const risk = getRiskLevel(cgpaVal, backlogsVal);

                    const isMine = profile.mentor_id === facultyId;
                    const isUnassigned = !profile.mentor_id;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.roll_number || '-'}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          <button 
                            onClick={() => router.push(`/faculty/students/${student.id}` as any)}
                            className="hover:underline hover:text-emerald-700 text-left font-semibold focus:outline-none"
                          >
                            {student.name}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="font-semibold uppercase">{profile.branch || '-'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Sec: {profile.section || '-'} | <span className="font-bold text-emerald-800">{getStudentBTechYear(profile)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-medium">{cgpaVal.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                            risk === 'High' 
                              ? 'bg-rose-100 text-rose-800' 
                              : risk === 'Medium' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {risk}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isMine ? (
                            <button
                              onClick={() => handleAssign(student.id, false)}
                              className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          ) : isUnassigned ? (
                            <button
                              onClick={() => handleAssign(student.id, true)}
                              className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Assign to Me</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Assigned to other mentor</span>
                          )}
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