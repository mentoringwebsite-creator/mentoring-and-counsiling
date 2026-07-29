'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, CheckCircle2, XCircle, Clock, MessageSquare, 
  HelpCircle, Loader2, UserCheck, ShieldCheck, CheckCircle 
} from 'lucide-react';

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
      
      // Find mentor ID if not explicitly passed
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

  const totalQueriesCount = queries.length;
  const solvedQueriesCount = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;
  const pendingQueriesCount = totalQueriesCount - solvedQueriesCount;

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
      
      {/* Stat Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Recorded Sessions</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">{totalClassesRecorded} Sessions</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Classes Attended</span>
          <span className="text-lg font-black text-emerald-800 mt-1 block">{attendedClassesCount} Present</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">Classes Missed</span>
          <span className="text-lg font-black text-rose-800 mt-1 block">{missedClassesCount} Absent</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">Queries Solved</span>
          <span className="text-lg font-black text-teal-900 mt-1 block">{solvedQueriesCount} / {totalQueriesCount}</span>
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
            {totalClassesRecorded > 0 ? `${Math.round((attendedClassesCount / totalClassesRecorded) * 100)}% Attendance Rate` : '100% Attendance Rate'}
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

      {/* Student Queries & Solutions History */}
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
          <div className="space-y-3">
            {queries.map((q) => {
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
                      {isSolved ? 'SOLVED' : 'PENDING'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 italic">
                    "{q.description || 'No description provided'}"
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
