'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, CheckCircle2, XCircle, Clock, MessageSquare, 
  HelpCircle, Loader2, UserCheck, ShieldCheck, CheckCircle,
  TrendingUp, BarChart3, PieChart as PieIcon, Award, Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
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

const PIE_COLORS = ['#10b981', '#f59e0b', '#64748b'];

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
        const topic = record.topic || 'Weekly Counseling & Academic Progress';
        const hasRecord = Boolean(record.updatedAt || record.attendance);

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
    if (studentId) loadData();
  }, [studentId, mentorId]);

  const totalClassesRecorded = weeklyAttendanceList.filter((w) => w.hasRecord).length;
  const attendedClassesCount = weeklyAttendanceList.filter((w) => w.hasRecord && w.isPresent).length;
  const missedClassesCount = totalClassesRecorded - attendedClassesCount;
  const attendancePercentage = totalClassesRecorded > 0 ? Math.round((attendedClassesCount / totalClassesRecorded) * 100) : 100;

  const totalQueriesCount = queries.length;
  const solvedQueriesCount = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;
  const pendingQueriesCount = totalQueriesCount - solvedQueriesCount;
  const queryResolutionPercentage = totalQueriesCount > 0 ? Math.round((solvedQueriesCount / totalQueriesCount) * 100) : 100;

  // Chart 1 Data: Weekly Attendance Bar Chart
  const attendanceChartData = weeklyAttendanceList.map((w, idx) => ({
    week: `W${idx + 1}`,
    statusScore: w.hasRecord ? (w.isPresent ? 100 : 0) : null,
    statusText: w.hasRecord ? (w.isPresent ? 'Present' : 'Absent') : 'Scheduled'
  }));

  // Chart 2 Data: Query Breakdown Pie Chart
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
        <span className="text-xs font-semibold text-slate-500">Loading mentoring status & analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Stat Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Recorded Sessions</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{totalClassesRecorded} Sessions</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Attendance Rate</span>
          <span className="text-xl font-black text-emerald-800 mt-1 block">{attendancePercentage}% ({attendedClassesCount}/{totalClassesRecorded})</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">Classes Missed</span>
          <span className="text-xl font-black text-rose-800 mt-1 block">{missedClassesCount} Absent</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">Query Resolution Rate</span>
          <span className="text-xl font-black text-teal-900 mt-1 block">{queryResolutionPercentage}% ({solvedQueriesCount}/{totalQueriesCount})</span>
        </div>
      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Graph 1: Weekly Mentoring Class Attendance Trend */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-emerald-700" />
                <span>Weekly Class Attendance Trend</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Presence per week across 16 mentoring sessions.</p>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {attendancePercentage}% Attended
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [
                    item.payload.statusText, 'Attendance Status'
                  ]}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 700 }}
                />
                <Bar dataKey="statusScore" radius={[6, 6, 0, 0]}>
                  {attendanceChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.statusScore === 100 ? '#10b981' : 
                        entry.statusScore === 0 ? '#f43f5e' : '#cbd5e1'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Query Breakdown Pie Chart */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="h-4.5 w-4.5 text-emerald-700" />
                <span>Query Resolution Breakdown</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribution of solved vs pending student queries.</p>
            </div>
            <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {solvedQueriesCount} / {totalQueriesCount} Solved
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center pt-2">
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
                    <Cell key={`pie-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
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
            {attendancePercentage}% Attendance Rate
          </span>
        </div>

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
