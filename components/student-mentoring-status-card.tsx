'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, CheckCircle2, XCircle, Clock, MessageSquare, 
  HelpCircle, Loader2, UserCheck, ShieldCheck, CheckCircle,
  X, ChevronRight, Send, AlertCircle, Maximize2, Minimize2
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
  const [studentName, setStudentName] = useState<string>('Student');

  // Selected Week Modal State & Fullscreen Toggle
  const [selectedWeekData, setSelectedWeekData] = useState<any | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);
  const [weekQueriesMessages, setWeekQueriesMessages] = useState<{ [queryId: string]: any[] }>({});
  const [loadingModalMessages, setLoadingModalMessages] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch student user info
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', studentId)
        .maybeSingle();

      if (userData?.name) setStudentName(userData.name);

      // 2. Fetch student queries from Supabase
      const { data: queriesData } = await supabase
        .from('queries')
        .select(`
          id, type, subject, description, status, created_at
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      setQueries(queriesData || []);

      // 3. Fetch weekly mentoring attendance from Supabase
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

  // Fetch conversation messages when modal opens
  const openWeekDetailsModal = async (weekItem: any) => {
    setSelectedWeekData(weekItem);
    setIsFullscreenModal(false);
    setLoadingModalMessages(true);
    try {
      if (queries.length > 0) {
        const queryIds = queries.map((q) => q.id);
        const { data: msgs, error } = await supabase
          .from('query_messages')
          .select(`
            id, query_id, sender_id, message, created_at,
            users:sender_id ( name, role )
          `)
          .in('query_id', queryIds)
          .order('created_at', { ascending: true });

        if (!error && msgs) {
          const grouped: { [key: string]: any[] } = {};
          msgs.forEach((m: any) => {
            if (!grouped[m.query_id]) grouped[m.query_id] = [];
            grouped[m.query_id].push(m);
          });
          setWeekQueriesMessages(grouped);
        }
      }
    } catch (err) {
      console.error('Error fetching query messages for week:', err);
    } finally {
      setLoadingModalMessages(false);
    }
  };

  const totalClassesRecorded = weeklyAttendanceList.filter((w) => w.hasRecord).length;
  const attendedClassesCount = weeklyAttendanceList.filter((w) => w.hasRecord && w.isPresent).length;
  const missedClassesCount = totalClassesRecorded - attendedClassesCount;

  const totalQueriesCount = queries.length;
  const solvedQueriesCount = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;

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

      {/* 16-Week Mentoring Attendance Progress Grid */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-700" />
              <span>16-Week Mentoring Attendance & Details</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Click any week card below to inspect full session details, queries raised, and solutions.</p>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {attendedClassesCount} Attended
          </span>
        </div>

        {/* 16-Week Clickable Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {weeklyAttendanceList.map((w) => {
            const isPresent = w.hasRecord && w.isPresent;
            const isAbsent = w.hasRecord && !w.isPresent;

            return (
              <div 
                key={w.week}
                onClick={() => openWeekDetailsModal(w)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md ${
                  isPresent
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs hover:border-emerald-500'
                    : isAbsent
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs hover:border-rose-500'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">{w.week}</span>
                  {isPresent ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  ) : isAbsent ? (
                    <XCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </div>
                
                <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                  Date: {w.date}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    isPresent
                      ? 'bg-emerald-700 text-white'
                      : isAbsent
                      ? 'bg-rose-700 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isPresent ? 'PRESENT' : isAbsent ? 'ABSENT' : 'SCHEDULED'}
                  </span>

                  <span className="text-[10px] font-extrabold text-emerald-700 hover:underline flex items-center gap-0.5">
                    <span>Details</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Details Modal with Fullscreen Toggle */}
      {selectedWeekData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 animate-fade-in">
          <div className={`relative flex flex-col transition-all duration-300 overflow-hidden bg-white border border-slate-200 shadow-2xl p-6 space-y-6 ${
            isFullscreenModal 
              ? 'w-[98vw] max-w-none h-[96vh] max-h-none rounded-[28px]' 
              : 'w-full max-w-4xl max-h-[90vh] rounded-[32px]'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Mentoring Session Details
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-700" />
                  <span>{selectedWeekData.week} Details - {studentName}</span>
                </h3>
              </div>

              {/* Header Action Buttons: Fullscreen & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreenModal(!isFullscreenModal)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-200"
                  title={isFullscreenModal ? "Exit Fullscreen" : "Full Screen"}
                >
                  {isFullscreenModal ? (
                    <>
                      <Minimize2 className="h-4 w-4 text-emerald-700" />
                      <span className="hidden sm:inline">Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4 text-emerald-700" />
                      <span className="hidden sm:inline">Full Screen</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedWeekData(null);
                    setIsFullscreenModal(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer border border-slate-200"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              
              {/* Session Info Bar */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Session Date</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{selectedWeekData.date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Attendance Status</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase mt-1 ${
                    selectedWeekData.isPresent && selectedWeekData.hasRecord
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : selectedWeekData.hasRecord
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedWeekData.isPresent && selectedWeekData.hasRecord ? '✓ PRESENT' : selectedWeekData.hasRecord ? '✗ ABSENT' : '🕒 SCHEDULED'}
                  </span>
                </div>
              </div>

              {/* Queries & Solutions Resolution Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <HelpCircle className="h-4 w-4 text-emerald-700" />
                  <span>Student Queries & Mentor Resolutions</span>
                </h4>

                {loadingModalMessages ? (
                  <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    <span className="text-xs font-semibold">Loading queries & conversation history...</span>
                  </div>
                ) : queries.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-semibold">
                    No student queries recorded.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queries.map((q) => {
                      const messagesList = weekQueriesMessages[q.id] || [];
                      const isSolved = q.status === 'Resolved' || q.status === 'Closed';

                      return (
                        <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                          
                          {/* Query Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                {q.type || 'Academic Query'}
                              </span>
                              <h5 className="text-base font-extrabold text-slate-900 mt-1">{q.subject}</h5>
                              <span className="text-[10px] font-mono text-slate-400">Date Raised: {new Date(q.created_at).toLocaleDateString()}</span>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shrink-0 ${
                              isSolved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                              {isSolved ? 'SOLVED' : 'PENDING'}
                            </span>
                          </div>

                          {/* Question Description */}
                          {q.description && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                              <span className="font-bold not-italic text-slate-900 block text-[10px] uppercase mb-1">Student Question:</span>
                              "{q.description}"
                            </div>
                          )}

                          {/* Conversation Thread / How It Was Resolved */}
                          <div className="pt-2">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                              Mentor Resolution & Discussion History ({messagesList.length} Messages):
                            </span>

                            {messagesList.length === 0 ? (
                              <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-400 italic">
                                No mentor responses or chat messages logged for this query yet.
                              </div>
                            ) : (
                              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {messagesList.map((m: any) => {
                                  const isFaculty = m.users?.role === 'faculty' || m.sender_id !== studentId;

                                  return (
                                    <div 
                                      key={m.id} 
                                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                                        isFaculty 
                                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium' 
                                          : 'bg-slate-100 border border-slate-200 text-slate-800 font-medium'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className={`font-black uppercase ${isFaculty ? 'text-emerald-800' : 'text-slate-600'}`}>
                                          {isFaculty ? '👨‍🏫 Mentor Response' : `👤 Student (${m.users?.name || studentName})`}
                                        </span>
                                        <span className="font-mono text-slate-400">
                                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {isFullscreenModal ? "Press Exit Fullscreen to minimize view" : "Click Full Screen to expand modal width"}
              </span>
              
              <button
                onClick={() => {
                  setSelectedWeekData(null);
                  setIsFullscreenModal(false);
                }}
                className="px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
