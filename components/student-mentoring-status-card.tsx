'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, CheckCircle2, XCircle, Clock, MessageSquare, 
  HelpCircle, Loader2, UserCheck, ShieldCheck, CheckCircle,
  TrendingUp, BarChart3, PieChart as PieIcon, Award, Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend 
} from 'recharts';

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

interface StudentMentoringStatusCardProps {
  studentId: string;
  mentorId?: string;
  role?: 'faculty' | 'hod' | 'admin';
}

const QUERY_PIE_COLORS = ['#10b981', '#f59e0b'];

export function StudentMentoringStatusCard({ studentId, mentorId, role = 'faculty' }: StudentMentoringStatusCardProps) {
  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState<any[]>([]);
  const [weeklyAttendanceList, setWeeklyAttendanceList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch student queries from Supabase
      const { data: queriesData } = await supabase
        .from('queries')
        .select(`
          id, type, subject, description, status, created_at
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      setQueries(queriesData || []);

      // 2. Fetch weekly mentoring attendance from Supabase
      let supabaseSessions: any = {};
      
      let effectiveMentorId = mentorId;
      if (!effectiveMentorId) {
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('mentor_id')
          .eq('user_id', studentId)
          .maybeSingle();
        if (sp?.mentor_id) effectiveMentorId = sp.mentor_id;
      }

      if (effectiveMentorId) {
        const { data: dbSubmissions } = await supabase
          .from('academic_form_submissions')
          .select('*')
          .eq('mentor_id', effectiveMentorId)
          .eq('form_type', 'mentoring_attendance');

        if (dbSubmissions && dbSubmissions.length > 0) {
          dbSubmissions.forEach((sub: any) => {
            if (sub.semester && sub.form_data) {
              supabaseSessions[sub.semester] = sub.form_data;
            }
          });
        }
      }

      // Merge Supabase sessions with local storage backup
      const localStored = getStoredAttendance();
      const mergedSessions = { ...localStored, ...supabaseSessions };

      const attendanceHistory = WEEKS_LIST.map((week) => {
        const record = mergedSessions[week] || {};
        const isPresent = record.attendance?.[studentId] !== 'Absent';
        const date = record.date || 'Scheduled';
        const hasRecord = Boolean(record.updatedAt || record.attendance);

        return {
          week,
          date,
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
    if (studentId) loadData();
  }, [studentId, mentorId]);

  const totalClassesRecorded = weeklyAttendanceList.filter((w) => w.hasRecord).length;
  const attendedClassesCount = weeklyAttendanceList.filter((w) => w.hasRecord && w.isPresent).length;
  const missedClassesCount = totalClassesRecorded - attendedClassesCount;

  const totalQueriesCount = queries.length;
  const solvedQueriesCount = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;
  const pendingQueriesCount = totalQueriesCount - solvedQueriesCount;

  // Chart Data: Query Breakdown (Solved vs Pending)
  const queryPieData = [
    { name: 'Solved Queries', value: solvedQueriesCount },
    { name: 'Pending Queries', value: pendingQueriesCount }
  ].filter(d => d.value > 0);

  if (queryPieData.length === 0) {
    queryPieData.push({ name: 'No Queries Raised', value: 1 });
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
        <span className="text-xs font-semibold text-slate-500">Loading mentoring status & class attendance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Recorded Sessions</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{totalClassesRecorded} / 16 Sessions</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Classes Attended</span>
          <span className="text-xl font-black text-emerald-800 mt-1 block">{attendedClassesCount} Present</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">Classes Missed</span>
          <span className="text-xl font-black text-rose-800 mt-1 block">{missedClassesCount} Absent</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">Queries Solved</span>
          <span className="text-xl font-black text-teal-900 mt-1 block">{solvedQueriesCount} / {totalQueriesCount} Solved</span>
        </div>
      </div>

      {/* Visual Analytics Row: 16-Week Attendance Heatmap Grid + Query Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 cols): 16-Week Attendance Visual Grid */}
        <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-emerald-700" />
                <span>16-Week Mentoring Attendance Progress</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Live attendance status per weekly class session.</p>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {attendedClassesCount} Attended
            </span>
          </div>

          {/* 16-Week Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {weeklyAttendanceList.map((w) => {
              const isPresent = w.hasRecord && w.isPresent;
              const isAbsent = w.hasRecord && !w.isPresent;

              return (
                <div 
                  key={w.week}
                  className={`p-3 rounded-2xl border transition-all ${
                    isPresent
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                      : isAbsent
                      ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{w.week}</span>
                    {isPresent ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : isAbsent ? (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    )}
                  </div>
                  
                  <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                    {w.date}
                  </div>

                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      isPresent
                        ? 'bg-emerald-700 text-white'
                        : isAbsent
                        ? 'bg-rose-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPresent ? 'PRESENT' : isAbsent ? 'ABSENT' : 'SCHEDULED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (1 col): Query Breakdown Donut Chart */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-emerald-700" />
                <span>Queries Breakdown</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Solved vs pending student queries.</p>
            </div>
            <span className="text-xs font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {solvedQueriesCount} / {totalQueriesCount} Solved
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={queryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {queryPieData.map((entry, index) => (
                    <Cell key={`query-cell-${index}`} fill={QUERY_PIE_COLORS[index % QUERY_PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} Queries`, 'Count']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Weekly Mentoring Class Attendance Roster Table */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-emerald-700" />
            <span>Weekly Mentoring Class Attendance Roster</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {attendedClassesCount} Present • {missedClassesCount} Absent
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Week Number</th>
                <th className="px-5 py-3.5">Session Date</th>
                <th className="px-5 py-3.5 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {weeklyAttendanceList.map((w) => (
                <tr key={w.week} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{w.week}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{w.date}</td>
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
      </div>

      {/* Student Queries & Solutions History Table */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-emerald-700" />
            <span>Queries & Solutions Breakdown</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {solvedQueriesCount} Solved • {pendingQueriesCount} Pending
          </span>
        </div>

        {queries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 font-semibold">
            No queries recorded for this student yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs font-semibold text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Date Raised</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {queries.map((q) => {
                  const isSolved = q.status === 'Resolved' || q.status === 'Closed';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {q.type || 'Academic Query'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-900">{q.subject}</div>
                        <div className="text-[11px] text-slate-500 font-normal italic mt-0.5 truncate max-w-md">
                          "{q.description}"
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-600">
                        {new Date(q.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          isSolved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          {isSolved ? 'SOLVED' : 'PENDING'}
                        </span>
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
  );
}
