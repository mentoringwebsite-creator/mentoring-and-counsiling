'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Calendar, CheckCircle2, XCircle, MessageSquare, 
  CheckCircle, Clock, HelpCircle, UserCheck, BookOpen, AlertCircle
} from 'lucide-react';

const studentSidebarItems = [
  { href: '/student', label: 'My Profile' },
  { href: '/student/academic', label: 'Academic Details' },
  { href: '/student/performance', label: 'Academic Performance' },
  { href: '/student/extracurricular', label: 'Extracurricular & Co-Curricular' },
  { href: '/student/queries', label: 'Student Queries' },
  { href: '/student/mentoring-status', label: 'Mentoring Status' }
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

export default function StudentMentoringStatusPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [mentorName, setMentorName] = useState<string>('Assigned Mentor');
  const [studentQueries, setStudentQueries] = useState<any[]>([]);
  const [weeklyAttendanceList, setWeeklyAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const sId = session.user.id;
      setStudentId(sId);

      // 1. Fetch student's mentor info
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('mentor_id')
        .eq('user_id', sId)
        .maybeSingle();

      if (sp?.mentor_id) {
        const { data: mentorUser } = await supabase
          .from('users')
          .select('name')
          .eq('id', sp.mentor_id)
          .maybeSingle();
        if (mentorUser) setMentorName(mentorUser.name);
      }

      // 2. Fetch student's queries
      const { data: queriesData } = await supabase
        .from('queries')
        .select(`
          id, type, subject, description, status, created_at
        `)
        .eq('student_id', sId)
        .order('created_at', { ascending: false });

      setStudentQueries(queriesData || []);

      // 3. Fetch weekly attendance records from storage
      const stored = getStoredAttendance();
      const attendanceHistory = WEEKS_LIST.map((week) => {
        const record = stored[week] || {};
        const isPresent = record.attendance?.[sId] !== 'Absent';
        const date = record.date || 'Scheduled';
        const topic = record.topic || 'Weekly Counseling & Academic Progress';
        const hasRecord = Boolean(record.updatedAt);

        return {
          week,
          date,
          topic,
          isPresent,
          hasRecord
        };
      });

      setWeeklyAttendanceList(attendanceHistory);
    } catch (err) {
      console.error('Error loading student mentoring status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const totalClassesRecorded = weeklyAttendanceList.filter((w) => w.hasRecord).length;
  const attendedClassesCount = weeklyAttendanceList.filter((w) => w.hasRecord && w.isPresent).length;
  const missedClassesCount = totalClassesRecorded - attendedClassesCount;

  const totalQueriesCount = studentQueries.length;
  const solvedQueriesCount = studentQueries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;
  const pendingQueriesCount = totalQueriesCount - solvedQueriesCount;

  return (
    <ProtectedRoute role="student">
      <PageShell title="Weekly Mentoring Status" subtitle="View your weekly mentoring class attendance, queries raised, and solutions provided">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/student/mentoring-status" items={studentSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Header Banner */}
            <div className="portal-card bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white border-0 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                      Mentoring Roster
                    </span>
                    <h2 className="text-xl font-extrabold">{mentorName} - Weekly Sessions</h2>
                  </div>
                  <p className="mt-1 text-xs text-emerald-100/90">
                    Track your presence in weekly mentor classes and review mentor responses to your queries.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Class Attendance</span>
                    <span className="text-xl font-black text-white">
                      {totalClassesRecorded > 0 ? `${Math.round((attendedClassesCount / totalClassesRecorded) * 100)}%` : '100%'}
                    </span>
                  </div>
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Queries Solved</span>
                    <span className="text-xl font-black text-white">{solvedQueriesCount} / {totalQueriesCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Classes Recorded</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{totalClassesRecorded} Sessions</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-semibold text-emerald-700">Present</span>
                <span className="text-lg font-black text-emerald-800 mt-1 block">{attendedClassesCount} Attended</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-semibold text-rose-700">Absent</span>
                <span className="text-lg font-black text-rose-800 mt-1 block">{missedClassesCount} Missed</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Queries</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{totalQueriesCount} Raised</span>
              </div>
            </div>

            {/* Section 1: Weekly Mentoring Class Attendance Roster */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-emerald-700" />
                  <span>Weekly Mentoring Class Attendance Record</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">Weekly 1 Class Schedule</span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold">Loading attendance history...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-semibold text-slate-700">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Week Number</th>
                        <th className="px-5 py-3.5">Session Date</th>
                        <th className="px-5 py-3.5">Mentoring Topic / Focus</th>
                        <th className="px-5 py-3.5 text-center">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {weeklyAttendanceList.map((w) => (
                        <tr key={w.week} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{w.week}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-600">{w.date}</td>
                          <td className="px-5 py-3.5 text-slate-800">{w.topic}</td>
                          <td className="px-5 py-3.5 text-center">
                            {w.hasRecord ? (
                              w.isPresent ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>PRESENT</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-rose-50 border border-rose-200 text-rose-800 uppercase">
                                  <XCircle className="h-3 w-3 text-rose-600" />
                                  <span>ABSENT</span>
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500 uppercase">
                                <Clock className="h-3 w-3" />
                                <span>SCHEDULED</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: Queries & Solutions Breakdown */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-emerald-700" />
                  <span>Queries & Solutions History</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {solvedQueriesCount} Solved • {pendingQueriesCount} Pending
                </span>
              </div>

              {studentQueries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  You have not raised any queries yet. Use the <b>Student Queries</b> page to raise queries to your mentor.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentQueries.map((q) => {
                    const isSolved = q.status === 'Resolved' || q.status === 'Closed';

                    return (
                      <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                              {q.type || 'Academic Query'}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-900 mt-1.5">{q.subject}</h4>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">Date: {new Date(q.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shrink-0 ${
                            isSolved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}>
                            {isSolved ? 'SOLVED' : 'IN PROGRESS'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                          "{q.description || 'No description provided'}"
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
