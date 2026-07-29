'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ArrowLeft, User, Mail, MessageSquare, CheckCircle2, 
  Clock, HelpCircle, Send, AlertCircle, RefreshCw 
} from 'lucide-react';

const facultySidebarItems = [
  { href: '/faculty', label: 'Mentor Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/academic-forms', label: 'Academic Forms' },
  { href: '/faculty/attendance-forms', label: 'Attendance Forms' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/mentoring-status', label: 'Mentoring Status' }
];

export default function StudentQueryDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.studentId;
  const router = useRouter();

  const [student, setStudent] = useState<any | null>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<{ [queryId: string]: string }>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStudentQueries = async () => {
    try {
      setLoading(true);
      setFeedback(null);

      // 1. Load Student user & profile info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id ( roll_number, branch, section, academic_year, phone )
        `)
        .eq('id', studentId)
        .single();

      if (userError || !userData) throw new Error('Student not found.');
      setStudent(userData);

      // 2. Load Queries from this student (without updated_at column to prevent Supabase errors)
      const { data: queriesData, error: queriesError } = await supabase
        .from('queries')
        .select(`
          id, type, subject, description, status, created_at
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (queriesError) throw queriesError;

      // 3. Load replies/messages for each query
      const queriesWithMessages = await Promise.all((queriesData || []).map(async (q: any) => {
        try {
          const { data: msgData } = await supabase
            .from('query_messages')
            .select('id, sender_role, message, created_at')
            .eq('query_id', q.id)
            .order('created_at', { ascending: true });

          return {
            ...q,
            messages: msgData || []
          };
        } catch {
          return {
            ...q,
            messages: []
          };
        }
      }));

      setQueries(queriesWithMessages);
    } catch (err: any) {
      console.error('Error loading student query details:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load student query details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentQueries();
  }, [studentId]);

  const handleSendSolution = async (queryId: string) => {
    const replyText = (replyTextMap[queryId] || '').trim();
    if (!replyText) return;

    setSubmittingReply(queryId);
    setFeedback(null);
    try {
      // 1. Insert mentor reply message
      const { error: msgError } = await supabase
        .from('query_messages')
        .insert({
          query_id: queryId,
          sender_role: 'Faculty',
          message: replyText
        });

      if (msgError) throw msgError;

      // 2. Update query status to Resolved (without updating non-existent updated_at column)
      const { error: updateError } = await supabase
        .from('queries')
        .update({ status: 'Resolved' })
        .eq('id', queryId);

      if (updateError) throw updateError;

      setFeedback({ type: 'success', message: 'Solution submitted and query marked as Resolved in Supabase!' });
      setReplyTextMap(prev => ({ ...prev, [queryId]: '' }));
      loadStudentQueries();
    } catch (err: any) {
      console.error('Error sending solution:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to send solution.' });
    } finally {
      setSubmittingReply(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute role="faculty">
        <PageShell title="Student Query Details" subtitle="Loading queries & solutions...">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  if (!student) {
    return (
      <ProtectedRoute role="faculty">
        <PageShell title="Student Query Details" subtitle="Student not found">
          <div className="p-8 text-center">
            <p className="text-slate-500 font-semibold mb-4">Student record not found.</p>
            <button
              onClick={() => router.push('/faculty/mentoring-status')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Mentoring Status</span>
            </button>
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  const profile = student.student_profiles?.[0] || {};
  const totalQueriesCount = queries.length;
  const solvedCount = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;
  const pendingCount = totalQueriesCount - solvedCount;

  return (
    <ProtectedRoute role="faculty">
      <PageShell title={`${student.name} - Queries & Solutions`} subtitle="Review queries raised by this student and provide mentor solutions">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/mentoring-status" items={facultySidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Top Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => router.push('/faculty/mentoring-status')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-700" />
                <span>Back to Mentoring Status</span>
              </button>

              <button
                onClick={() => loadStudentQueries()}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-700" />
                <span>Refresh Queries</span>
              </button>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Student Header Banner */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/10 border-2 border-white/80 font-black text-xl flex items-center justify-center shrink-0">
                      {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h1 className="text-2xl font-black">{student.name}</h1>
                      <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                        Roll No: <span className="font-mono font-bold text-white">{profile.roll_number || 'N/A'}</span> • Branch: <span className="uppercase font-bold text-white">{profile.branch || 'N/A'}</span> {profile.section ? `• Sec ${profile.section}` : ''}
                      </p>
                      <p className="text-xs text-emerald-200/90 mt-0.5">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                      <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Total Queries</span>
                      <span className="text-xl font-black text-white">{totalQueriesCount}</span>
                    </div>
                    <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                      <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Solved</span>
                      <span className="text-xl font-black text-emerald-300">{solvedCount}</span>
                    </div>
                    <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                      <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Pending</span>
                      <span className="text-xl font-black text-amber-300">{pendingCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Queries & Solution Threads List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-emerald-700" />
                  <span>Queries & Solutions Breakdown for {student.name}</span>
                </h3>
              </div>

              {queries.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400 font-semibold">
                  No queries raised by {student.name} yet.
                </div>
              ) : (
                queries.map((q) => {
                  const isSolved = q.status === 'Resolved' || q.status === 'Closed';

                  return (
                    <div key={q.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                      {/* Query Top Header */}
                      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                              {q.type || 'Academic Query'}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              Date: {new Date(q.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900 mt-1">{q.subject}</h4>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border shrink-0 ${
                          isSolved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          {isSolved ? 'SOLVED' : 'PENDING SOLUTION'}
                        </span>
                      </div>

                      {/* Question Box */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Student Question</span>
                        <p className="text-xs font-semibold text-slate-800 whitespace-pre-line">
                          "{q.description || 'No description provided.'}"
                        </p>
                      </div>

                      {/* Mentor Solution Messages Thread */}
                      {q.messages && q.messages.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                            Solution & Conversation Thread ({q.messages.length} replies)
                          </span>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {q.messages.map((msg: any) => {
                              const isFaculty = msg.sender_role === 'Faculty';

                              return (
                                <div 
                                  key={msg.id} 
                                  className={`p-3 rounded-2xl text-xs ${
                                    isFaculty 
                                      ? 'bg-emerald-50 border border-emerald-200 ml-6 text-emerald-950 font-semibold' 
                                      : 'bg-slate-100 border border-slate-200 mr-6 text-slate-800 font-medium'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
                                    <span className={isFaculty ? 'text-emerald-800' : 'text-slate-600'}>
                                      {isFaculty ? 'Mentor Solution' : student.name}
                                    </span>
                                    <span className="text-slate-400 font-mono">
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p>{msg.message}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mentor Reply / Solution Input Box */}
                      <div className="pt-2">
                        <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                          Provide / Update Solution for {student.name}
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            placeholder="Type mentor solution or response..."
                            value={replyTextMap[q.id] || ''}
                            onChange={(e) => setReplyTextMap(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSendSolution(q.id)}
                            disabled={submittingReply === q.id || !replyTextMap[q.id]?.trim()}
                            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 text-xs font-extrabold transition shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {submittingReply === q.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                <span>Solve</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
