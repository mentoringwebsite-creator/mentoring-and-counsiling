'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Calendar, CheckCircle2, XCircle, UserCheck, MessageSquare, 
  CheckCircle, Clock, Save, Search, Filter, HelpCircle, ChevronRight, User, ExternalLink
} from 'lucide-react';

const facultySidebarItems = [
  { href: '/faculty', label: 'Mentor Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/academic-forms', label: 'Academic Forms' },
  { href: '/faculty/attendance-forms', label: 'Attendance Forms' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/mentoring-status', label: 'Mentoring Status' }
];

const WEEKS_LIST = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);

const getStoredAttendance = () => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem('snist_mentoring_attendance_v1');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveAttendanceToStorage = (data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('snist_mentoring_attendance_v1', JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save mentoring attendance:', err);
  }
};

export default function FacultyMentoringStatusPage() {
  const router = useRouter();
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [mentees, setMentees] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Selected Week & Attendance State
  const [selectedWeek, setSelectedWeek] = useState<string>('Week 1');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topicDiscussed, setTopicDiscussed] = useState<string>('');
  
  // Map of studentUserId -> 'Present' | 'Absent'
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: string]: 'Present' | 'Absent' }>({});
  const [allSessionsData, setAllSessionsData] = useState<any>({});

  const loadMentorData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const fId = session.user.id;
      setFacultyId(fId);

      // 1. Fetch assigned student mentees
      const { data: menteeProfiles, error: menteeError } = await supabase
        .from('student_profiles')
        .select(`
          user_id, roll_number, branch, section, academic_year,
          users!user_id ( id, name, email )
        `)
        .eq('mentor_id', fId);

      if (menteeError) throw menteeError;

      const studentList = (menteeProfiles || []).map((sp: any) => ({
        userId: sp.user_id,
        name: sp.users?.name || 'Student',
        email: sp.users?.email || '',
        rollNumber: sp.roll_number || 'N/A',
        branch: sp.branch || 'N/A',
        section: sp.section || ''
      }));

      setMentees(studentList);

      // 2. Fetch queries from these students
      const studentIds = studentList.map((s) => s.userId);
      if (studentIds.length > 0) {
        const { data: queriesData } = await supabase
          .from('queries')
          .select(`
            id, type, subject, description, status, created_at, student_id,
            users:student_id ( name, email )
          `)
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });

        setQueries(queriesData || []);
      }

      // 3. Fetch weekly attendance records from Supabase
      const { data: dbSessions } = await supabase
        .from('academic_form_submissions')
        .select('*')
        .eq('mentor_id', fId)
        .eq('form_type', 'mentoring_attendance');

      const supabaseSessions: any = {};
      if (dbSessions && dbSessions.length > 0) {
        dbSessions.forEach((sub: any) => {
          if (sub.semester && sub.form_data) {
            supabaseSessions[sub.semester] = sub.form_data;
          }
        });
      }

      // Merge Supabase sessions with local storage fallback
      const localStored = getStoredAttendance();
      const mergedSessions = { ...localStored, ...supabaseSessions };
      setAllSessionsData(mergedSessions);

      // Load data for initial week
      const currentWeekRecord = mergedSessions[selectedWeek] || {};
      const initialMap: { [key: string]: 'Present' | 'Absent' } = {};
      studentList.forEach((s) => {
        initialMap[s.userId] = currentWeekRecord.attendance?.[s.userId] || 'Present';
      });
      setAttendanceMap(initialMap);
      if (currentWeekRecord.date) setSessionDate(currentWeekRecord.date);
      if (currentWeekRecord.topic) setTopicDiscussed(currentWeekRecord.topic);
    } catch (err: any) {
      console.error('Error loading mentoring status data:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentorData();
  }, []);

  const handleWeekChange = (week: string) => {
    setSelectedWeek(week);
    const weekRecord = allSessionsData[week] || {};
    const newMap: { [key: string]: 'Present' | 'Absent' } = {};
    mentees.forEach((s) => {
      newMap[s.userId] = weekRecord.attendance?.[s.userId] || 'Present';
    });
    setAttendanceMap(newMap);
    setSessionDate(weekRecord.date || new Date().toISOString().split('T')[0]);
    setTopicDiscussed(weekRecord.topic || '');
  };

  const handleSaveSession = async () => {
    if (!facultyId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const sessionPayload = {
        week: selectedWeek,
        date: sessionDate,
        topic: topicDiscussed,
        attendance: attendanceMap,
        updatedAt: new Date().toISOString()
      };

      // 1. Save to Supabase academic_form_submissions
      const { data: existing } = await supabase
        .from('academic_form_submissions')
        .select('id')
        .eq('mentor_id', facultyId)
        .eq('form_type', 'mentoring_attendance')
        .eq('semester', selectedWeek)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('academic_form_submissions')
          .update({
            form_data: sessionPayload,
            submitted_at: new Date().toISOString(),
            status: 'Submitted'
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('academic_form_submissions')
          .insert({
            mentor_id: facultyId,
            student_id: facultyId, // mentor self record for session
            form_type: 'mentoring_attendance',
            semester: selectedWeek,
            form_data: sessionPayload,
            submitted_at: new Date().toISOString(),
            status: 'Submitted'
          });
      }

      // 2. Update local state and backup storage
      const updatedData = {
        ...allSessionsData,
        [selectedWeek]: sessionPayload
      };
      setAllSessionsData(updatedData);
      saveAttendanceToStorage(updatedData);

      setFeedback({ 
        type: 'success', 
        message: `Mentoring class attendance for ${selectedWeek} saved successfully to Supabase!` 
      });
    } catch (err: any) {
      console.error('Save session error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const totalQueriesCount = queries.length;
  const resolvedQueriesCount = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;
  const pendingQueriesCount = totalQueriesCount - resolvedQueriesCount;

  return (
    <ProtectedRoute role="faculty">
      <PageShell title="Mentoring Status & Weekly Classes" subtitle="Mark weekly class attendance and monitor student query resolutions">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/mentoring-status" items={facultySidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Header Banner */}
            <div className="portal-card bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white border-0 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-emerald-400" />
                    <span>Weekly Mentoring Class Tracker</span>
                  </h2>
                  <p className="mt-1 text-xs text-emerald-100/90">
                    Record weekly mentoring session attendance student by student and review query resolutions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Total Mentees</span>
                    <span className="text-xl font-black text-white">{mentees.length} Students</span>
                  </div>
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Queries Solved</span>
                    <span className="text-xl font-black text-white">{resolvedQueriesCount} / {totalQueriesCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Weekly Mentoring Attendance Sheet Card */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              
              {/* Top Controls: Week Selector & Session Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Mentoring Week
                  </label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => handleWeekChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {WEEKS_LIST.map((w) => (
                      <option key={w} value={w}>
                        {w} {allSessionsData[w] ? '✓ Saved' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mentoring Topic / Focus Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Academic Performance Review & Counseling"
                    value={topicDiscussed}
                    onChange={(e) => setTopicDiscussed(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Student Attendance List Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-emerald-700" />
                    <span>{selectedWeek} Student Attendance Roster</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allP: any = {};
                        mentees.forEach(m => allP[m.userId] = 'Present');
                        setAttendanceMap(allP);
                      }}
                      className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => {
                        const allA: any = {};
                        mentees.forEach(m => allA[m.userId] = 'Absent');
                        setAttendanceMap(allA);
                      }}
                      className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold hover:bg-rose-100 transition"
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    <span className="text-xs font-semibold">Loading mentees roster...</span>
                  </div>
                ) : mentees.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    No student mentees assigned yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                      <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3.5">Roll No</th>
                          <th className="px-5 py-3.5">Student Name</th>
                          <th className="px-5 py-3.5">Branch & Section</th>
                          <th className="px-5 py-3.5 text-center">Weekly Queries</th>
                          <th className="px-5 py-3.5 text-center">Mentoring Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {mentees.map((st) => {
                          const isPresent = attendanceMap[st.userId] !== 'Absent';
                          const studentQueries = queries.filter((q) => q.student_id === st.userId);
                          const solvedCount = studentQueries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;

                          return (
                            <tr key={st.userId} className="hover:bg-slate-50/60 transition">
                              <td className="px-5 py-4 font-mono font-bold text-slate-900">{st.rollNumber}</td>
                              <td className="px-5 py-4 font-bold text-slate-900">
                                <button
                                  onClick={() => router.push(`/faculty/mentoring-status/student/${st.userId}` as any)}
                                  className="text-left font-bold text-slate-900 hover:text-emerald-700 hover:underline transition flex items-center gap-1 group cursor-pointer"
                                  title="Click to view student query details"
                                >
                                  <span>{st.name}</span>
                                  <ExternalLink className="h-3 w-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition" />
                                </button>
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                <span className="font-extrabold uppercase text-slate-800">{st.branch}</span>
                                {st.section && <span className="text-slate-400 font-normal"> • Sec {st.section}</span>}
                              </td>
                              <td className="px-5 py-4 text-center">
                                {studentQueries.length > 0 ? (
                                  <button
                                    onClick={() => router.push(`/faculty/mentoring-status/student/${st.userId}` as any)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                                    title="Click to inspect student queries & solutions"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{solvedCount} / {studentQueries.length} Solved</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px] font-normal">No Queries</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <div className="inline-flex items-center rounded-2xl border border-slate-200 p-1 bg-slate-50 gap-1">
                                  <button
                                    onClick={() => setAttendanceMap(prev => ({ ...prev, [st.userId]: 'Present' }))}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                                      isPresent 
                                        ? 'bg-emerald-600 text-white shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Present</span>
                                  </button>

                                  <button
                                    onClick={() => setAttendanceMap(prev => ({ ...prev, [st.userId]: 'Absent' }))}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                                      !isPresent 
                                        ? 'bg-rose-600 text-white shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Absent</span>
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

                {/* Save Attendance Button */}
                <div className="flex items-center justify-end mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSaveSession}
                    disabled={saving || loading || mentees.length === 0}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-extrabold text-white transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving Mentoring Class...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save {selectedWeek} Attendance Record</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Queries & Solutions Summary Cards */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-emerald-700" />
                    <span>Assigned Student Queries & Solutions</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click any student query card to open dedicated query & solution details page.</p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                    {resolvedQueriesCount} Solved
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                    {pendingQueriesCount} Pending
                  </span>
                </div>
              </div>

              {queries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No student queries recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {queries.map((q) => {
                    const isSolved = q.status === 'Resolved' || q.status === 'Closed';
                    const studentName = q.users?.name || 'Student';

                    return (
                      <div 
                        key={q.id} 
                        onClick={() => router.push(`/faculty/mentoring-status/student/${q.student_id}` as any)}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-300 transition space-y-2 cursor-pointer group shadow-2xs"
                        title="Click to view full query details & respond"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {q.type || 'Academic Query'}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800 group-hover:underline transition mt-1">{q.subject}</h4>
                            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                              Raised by: <span className="text-slate-800 font-bold group-hover:text-emerald-700">{studentName}</span>
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${
                            isSolved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}>
                            {isSolved ? 'Solved' : 'Pending'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic flex items-center justify-between">
                          <span className="truncate">"{q.description || 'No description provided'}"</span>
                          <ExternalLink className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition" />
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
