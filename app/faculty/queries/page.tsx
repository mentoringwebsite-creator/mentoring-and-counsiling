'use client';

import { useEffect, useState, useRef } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, Send, MessageSquare, AlertCircle, RefreshCw, User, UserCheck } from 'lucide-react';

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

export default function FacultyQueriesPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [showQueryList, setShowQueryList] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const facultyId = sessionData?.session?.user?.id;
      if (!facultyId) return;

      // 1. Fetch assigned student IDs
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('mentor_id', facultyId);

      if (studentsError) throw studentsError;
      
      const studentIds = (studentsData || []).map((s: any) => s.user_id);
      
      if (studentIds.length === 0) {
        setQueries([]);
        return;
      }

      // 2. Fetch queries from those students
      const { data: queriesData, error: queriesError } = await supabase
        .from('queries')
        .select(`
          id,
          type,
          subject,
          description,
          status,
          created_at,
          student_id,
          student:student_id (
            name,
            email
          )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (queriesError) throw queriesError;
      
      // Filter out queries explicitly raised to HOD
      const filteredQueries = (queriesData || []).filter((q: any) => {
        const { raisedTo } = parseQueryMetadata(q.description);
        return raisedTo !== 'HOD';
      });
      
      setQueries(filteredQueries);
    } catch (err: any) {
      console.error('Error fetching queries:', err);
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
    fetchQueries();
  }, []);

  useEffect(() => {
    if (selectedQuery) {
      fetchMessages(selectedQuery.id);
      
      // Set up real-time subscription for new messages in this query
      const channel = supabase
        .channel(`faculty-query-messages-${selectedQuery.id}`)
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

  useEffect(() => {
    setShowQueryList(!selectedQuery);
  }, [selectedQuery]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedQuery) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { error } = await supabase
        .from('query_messages')
        .insert([
          {
            query_id: selectedQuery.id,
            sender_id: userId,
            message: newMessage.trim(),
          }
        ]);

      if (error) throw error;
      setNewMessage('');
      fetchMessages(selectedQuery.id);
    } catch (err: any) {
      console.error('Error sending message:', err);
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
      fetchQueries();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <ProtectedRoute role="faculty">
      <PageShell title="Student Queries" subtitle="Mentor response queue">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/queries" items={[{ href: '/faculty', label: 'Faculty Dashboard' }, { href: '/faculty/profile', label: 'Profile' }, { href: '/faculty/students', label: 'My Students' }, { href: '/faculty/queries', label: 'Student Queries' }, { href: '/faculty/notes', label: 'Mentor Notes' }]} />
          
          <div className={selectedQuery ? "grid gap-6 lg:grid-cols-[1fr_400px] w-full min-w-0" : "grid gap-6 w-full min-w-0"}>
            {/* Left Column: Queries List */}
            <div className={showQueryList ? "space-y-6 w-full min-w-0" : "hidden"}>
              <div className="portal-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Mentees' Queries</h2>
                  <button 
                    onClick={fetchQueries}
                    className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 transition"
                    title="Refresh Queries"
                  >
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                {feedback && (
                  <div className={`mt-4 rounded-2xl border p-3 text-sm font-semibold ${
                    feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}>
                    {feedback.message}
                  </div>
                )}

                 <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm w-full min-w-0">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full border-collapse text-left text-sm min-w-[360px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                          <th className="p-4">Student</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Raised By</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td className="p-8 text-center text-slate-500" colSpan={4}>
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                                <span>Loading student queries...</span>
                              </div>
                            </td>
                          </tr>
                        ) : queries.length === 0 ? (
                          <tr>
                            <td className="p-8 text-center text-slate-500" colSpan={4}>
                              No queries raised by your assigned mentees.
                            </td>
                          </tr>
                        ) : null}
                        {queries.map((query) => {
                          const { raisedBy } = parseQueryMetadata(query.description);
                          return (
                          <tr 
                            key={query.id} 
                            onClick={() => setSelectedQuery(query)}
                            className={`cursor-pointer hover:bg-slate-50/70 transition-colors ${
                              selectedQuery?.id === query.id ? 'bg-emerald-50/30 font-semibold' : ''
                            }`}
                          >
                            <td className="p-4">
                              <div className="font-semibold text-slate-900">{query.student?.name || 'Unknown Student'}</div>
                              <div className="text-[10px] text-slate-400">{query.student?.email}</div>
                            </td>
                            <td className="p-4">
                              <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {query.type}
                              </span>
                            </td>
                            <td className="p-4 text-slate-800 max-w-[150px] truncate">{query.subject}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <User className="h-3.5 w-3.5 text-emerald-700" />
                                <span className="text-xs font-semibold">{raisedBy}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                query.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                query.status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {query.status}
                              </span>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Chat Window */}
            <div className={selectedQuery ? "portal-card h-[600px] flex flex-col justify-between border border-slate-200 bg-white" : "hidden"}>
              {selectedQuery ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b border-slate-200 pb-4">
                    {/* Back Button */}
                    <button
                      onClick={() => {
                        setSelectedQuery(null);
                        setShowQueryList(true);
                      }}
                      className="mb-3 flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      &larr; Back to Queries
                    </button>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          From: {selectedQuery.student?.name || 'Student'}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{selectedQuery.subject}</h3>
                      </div>
                      
                      {/* Status Dropdown */}
                      <div className="flex items-center gap-1">
                        {updatingStatus && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
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
                      </div>
                    </div>
                    {selectedQuery.description && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 max-h-[80px] overflow-y-auto">
                        <strong>Problem Detail:</strong> {parseQueryMetadata(selectedQuery.description).cleanDesc}
                      </p>
                    )}
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-700 mr-1" />
                        <span>Loading messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-4">
                        <MessageSquare className="h-8 w-8 mb-2 stroke-1" />
                        <p className="text-xs font-semibold">No messages yet. Send a message to start the mentoring discussion.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.users?.role === 'faculty' || msg.users?.role === 'hod';
                        const senderRole = msg.users?.role === 'student' ? 'Student' : msg.users?.role === 'hod' ? 'HOD' : 'Mentor';

                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="text-[10px] text-slate-400 font-semibold mb-1 px-1">
                              {isMe ? 'You' : `${msg.users?.name || 'Student'} (${senderRole})`} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`max-w-[85%] rounded-[20px] px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                              isMe 
                                ? 'bg-emerald-700 text-white rounded-tr-none' 
                                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-slate-200 pt-3">
                    {selectedQuery.status === 'Resolved' ? (
                      <div className="flex items-center gap-1.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 p-3 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>This query has been resolved and closed.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a response to the student..."
                          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 p-2.5 text-white transition flex items-center justify-center shrink-0"
                          disabled={!newMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}