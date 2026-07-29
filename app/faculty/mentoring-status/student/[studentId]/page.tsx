'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ArrowLeft, User, Mail, MessageSquare, CheckCircle2, 
  Send, AlertCircle, RefreshCw, Trash2, ChevronLeft, ChevronRight 
} from 'lucide-react';

const facultySidebarItems = [
  { href: '/faculty', label: 'Mentor Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/academic-forms', label: 'Academic Forms' },
  { href: '/faculty/attendance-forms', label: 'Attendance Forms' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/mentoring-status', label: 'Mentoring Status' }
];

const parseQueryMetadata = (description: string) => {
  let raisedBy = 'Student';
  let raisedTo = 'Faculty';
  let cleanDesc = description || '';

  if (cleanDesc.includes('Raised By:')) {
    const byMatch = cleanDesc.match(/Raised By:\s*([^\n]*)/);
    if (byMatch) raisedBy = byMatch[1].trim();
    
    const toMatch = cleanDesc.match(/Raised To:\s*([^\n]*)/);
    if (toMatch) raisedTo = toMatch[1].trim();
    
    cleanDesc = cleanDesc.replace(/Raised By:.*\nRaised To:.*\n\n?/, '').trim();
  }
  return { raisedBy, raisedTo, cleanDesc };
};

export default function StudentQueryDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.studentId;
  const router = useRouter();

  const [student, setStudent] = useState<any | null>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

      // 2. Load Queries from this student
      const { data: queriesData, error: queriesError } = await supabase
        .from('queries')
        .select(`
          id, type, subject, description, status, created_at
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (queriesError) throw queriesError;

      // Filter OUT queries explicitly raised to HOD — ONLY show queries raised to Faculty / Mentor
      const mentorOnlyQueries = (queriesData || []).filter((q: any) => {
        const { raisedTo } = parseQueryMetadata(q.description);
        const targetRole = (q.raised_to_role || raisedTo || 'Faculty').toUpperCase();
        return targetRole !== 'HOD';
      });

      setQueries(mentorOnlyQueries);

      // Auto select first query if none selected
      if (mentorOnlyQueries.length > 0 && !selectedQuery) {
        setSelectedQuery(mentorOnlyQueries[0]);
      }
    } catch (err: any) {
      console.error('Error loading student query details:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load student query details.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (queryId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('query_messages')
        .select(`
          id,
          query_id,
          sender_id,
          message,
          created_at,
          users:sender_id (
            name,
            role
          )
        `)
        .eq('query_id', queryId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadStudentQueries();
  }, [studentId]);

  useEffect(() => {
    if (selectedQuery) {
      fetchMessages(selectedQuery.id);

      // Realtime channel subscription for new messages
      const channel = supabase
        .channel(`mentoring-query-msgs-${selectedQuery.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'query_messages',
            filter: `query_id=eq.${selectedQuery.id}`,
          },
          () => {
            fetchMessages(selectedQuery.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgText = newMessage.trim();
    if (!msgText || !selectedQuery) return;

    setSendingMsg(true);
    setFeedback(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('User session not found.');

      // 1. Insert message into query_messages
      const { error: insertError } = await supabase
        .from('query_messages')
        .insert([
          {
            query_id: selectedQuery.id,
            sender_id: userId,
            message: msgText
          }
        ]);

      if (insertError) throw insertError;

      // 2. Update query status to Resolved when mentor responds
      const { error: updateError } = await supabase
        .from('queries')
        .update({ status: 'Resolved' })
        .eq('id', selectedQuery.id);

      if (updateError) console.error('Status update warning:', updateError);

      setSelectedQuery((prev: any) => prev ? { ...prev, status: 'Resolved' } : null);
      setNewMessage('');
      await fetchMessages(selectedQuery.id);
      loadStudentQueries();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to send message.' });
    } fontally: {
      setSendingMsg(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedQuery) return;

    try {
      setUpdatingStatus(true);
      setFeedback(null);
      const { error } = await supabase
        .from('queries')
        .update({ status: newStatus })
        .eq('id', selectedQuery.id);

      if (error) throw error;
      
      setSelectedQuery((prev: any) => prev ? { ...prev, status: newStatus } : null);
      setFeedback({ type: 'success', message: `Query status updated to ${newStatus}.` });
      loadStudentQueries();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteQueryById = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this query completely? This action cannot be undone.')) return;

    try {
      setUpdatingStatus(true);
      setFeedback(null);
      const { error } = await supabase
        .from('queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;
      
      if (selectedQuery?.id === queryId) {
        setSelectedQuery(null);
      }
      setFeedback({ type: 'success', message: 'Query deleted successfully.' });
      loadStudentQueries();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete query.' });
    } finally {
      setUpdatingStatus(false);
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
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white cursor-pointer"
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

  const showChat = Boolean(selectedQuery && !chatCollapsed);

  return (
    <ProtectedRoute role="faculty">
      <PageShell title={`${student.name} - Queries & Solutions`} subtitle="Review queries raised by this student to mentor and provide solutions">
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
                      <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider font-extrabold">Mentor Queries</span>
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

            {/* Queries List & Chat Section Layout */}
            <div className={showChat ? "grid gap-6 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] w-full min-w-0" : "grid grid-cols-1 gap-6 w-full min-w-0"}>
              
              {/* Left Side Table: Mentees' Queries (Identical to Student Queries page layout) */}
              <div className={`${showChat ? 'hidden lg:block' : 'block'} space-y-6 w-full min-w-0`}>
                <div className="portal-card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-900">Queries & Solutions Breakdown for {student.name}</h2>
                    {selectedQuery && chatCollapsed && (
                      <button
                        onClick={() => setChatCollapsed(false)}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Show Chat</span>
                      </button>
                    )}
                  </div>

                  {/* Clean Queries Table matching Student Queries page */}
                  <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm w-full min-w-0">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full border-collapse text-left text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 text-xs">
                            <th className="p-4">Student</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Raised By</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {queries.length === 0 ? (
                            <tr>
                              <td className="p-8 text-center text-slate-500 text-xs font-semibold" colSpan={6}>
                                No mentor queries raised by {student.name} yet.
                              </td>
                            </tr>
                          ) : (
                            queries.map((query) => {
                              const { raisedBy } = parseQueryMetadata(query.description);
                              const effectiveRaisedBy = query.raised_by_role || raisedBy;
                              const isSelected = selectedQuery?.id === query.id;

                              return (
                                <tr 
                                  key={query.id}
                                  onClick={() => {
                                    setSelectedQuery(query);
                                    setChatCollapsed(false);
                                  }}
                                  className={`cursor-pointer hover:bg-slate-50/70 transition-colors ${
                                    isSelected ? 'bg-emerald-50/40 font-semibold' : ''
                                  }`}
                                >
                                  <td className="p-4">
                                    <div className="font-bold text-slate-900">{student.name}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">{student.email}</div>
                                  </td>

                                  <td className="p-4">
                                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                      {query.type || 'Academic'}
                                    </span>
                                  </td>

                                  <td className="p-4 text-slate-800 font-medium max-w-[160px] truncate">
                                    {query.subject}
                                  </td>

                                  <td className="p-4">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                      <User className="h-3.5 w-3.5 text-emerald-700" />
                                      <span className="text-xs font-semibold">{effectiveRaisedBy}</span>
                                    </div>
                                  </td>

                                  <td className="p-4">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                                      query.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                      query.status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                                      'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {query.status}
                                    </span>
                                  </td>

                                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-3">
                                      <button 
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition hover:underline"
                                        onClick={() => {
                                          setSelectedQuery(query);
                                          setChatCollapsed(false);
                                        }}
                                      >
                                        View Chat
                                      </button>
                                      <button
                                        onClick={() => deleteQueryById(query.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition"
                                        title="Delete Query"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Chat Window */}
              <div className={showChat ? "portal-card h-[600px] flex flex-col justify-between border border-slate-200 bg-white shadow-md rounded-[28px]" : "hidden"}>
                {selectedQuery && (
                  <>
                    {/* Chat Header */}
                    <div className="border-b border-slate-200 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => {
                            setSelectedQuery(null);
                            setChatCollapsed(false);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                        >
                          &larr; Back to Queries Table
                        </button>

                        <button
                          onClick={() => setChatCollapsed(true)}
                          className="hidden lg:flex items-center justify-center p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                          title="Collapse Chat"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            FROM: {student.name}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{selectedQuery.subject}</h3>
                        </div>

                        {/* Status Dropdown & Delete */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedQuery.status}
                            disabled={updatingStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Review">In Review</option>
                            <option value="Resolved">Resolved</option>
                          </select>

                          <button
                            onClick={() => deleteQueryById(selectedQuery.id)}
                            disabled={updatingStatus}
                            title="Delete Query"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Description Box */}
                      {selectedQuery.description && (
                        <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100 max-h-[80px] overflow-y-auto italic">
                          "{parseQueryMetadata(selectedQuery.description).cleanDesc || selectedQuery.description}"
                        </p>
                      )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
                      {loadingMessages ? (
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                          No messages yet. Send a response below to start conversation.
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const senderRole = msg.users?.role;
                          const isFaculty = senderRole === 'faculty' || msg.sender_id !== studentId;

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isFaculty ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-2xs ${
                                  isFaculty
                                    ? 'bg-emerald-700 text-white rounded-br-none font-medium'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200 font-medium'
                                }`}
                              >
                                <div className={`text-[10px] font-black uppercase mb-1 ${isFaculty ? 'text-emerald-200' : 'text-slate-500'}`}>
                                  {isFaculty ? 'Mentor (You)' : (msg.users?.name || student.name)}
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                              </div>
                              <span className="mt-1 text-[9px] text-slate-400 font-mono">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input Form */}
                    <form onSubmit={handleSendMessage} className="border-t border-slate-200 pt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type mentor response..."
                          className="flex-1 rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={sendingMsg || !newMessage.trim()}
                          className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {sendingMsg ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              <span>Send</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>

            </div>

          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
