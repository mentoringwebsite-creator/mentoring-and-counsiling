'use client';

import { useEffect, useState, useRef } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, Send, MessageSquare, AlertCircle, X, CheckCircle, User, UserCheck, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function QueriesPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [showQueryList, setShowQueryList] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQueryType, setNewQueryType] = useState('Academic');
  const [newQueryRaisedTo, setNewQueryRaisedTo] = useState('Faculty');
  const [newQueryRaisedBy, setNewQueryRaisedBy] = useState('Student');
  const [newQuerySubject, setNewQuerySubject] = useState('');
  const [newQueryDescription, setNewQueryDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueries(data || []);
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
        .channel(`query-messages-${selectedQuery.id}`)
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // We don't hide the list unconditionally anymore. It's handled via CSS for responsive side-by-side view.

  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuerySubject.trim()) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('You must be logged in to raise a query.');

      const { data, error } = await supabase
        .from('queries')
        .insert([
          {
            student_id: userId,
            type: newQueryType,
            subject: newQuerySubject.trim(),
            description: `Raised By: ${newQueryRaisedBy}\nRaised To: ${newQueryRaisedTo}\n\n${newQueryDescription.trim()}`,
            status: 'Pending',
          }
        ])
        .select();

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Query raised successfully!' });
      setNewQuerySubject('');
      setNewQueryDescription('');
      setNewQueryRaisedTo('Faculty');
      setNewQueryRaisedBy('Student');
      setIsModalOpen(false);
      fetchQueries();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to raise query.' });
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleCloseQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to mark this query as Resolved? This will close the discussion.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('queries')
        .update({ status: 'Resolved' })
        .eq('id', queryId);

      if (error) throw error;
      
      setSelectedQuery((prev: any) => prev ? { ...prev, status: 'Resolved' } : null);
      fetchQueries();
    } catch (err: any) {
      console.error('Error closing query:', err);
    }
  const deleteQueryById = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this query completely? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;
      
      if (selectedQuery?.id === queryId) {
        setSelectedQuery(null);
      }
      setFeedback({ type: 'success', message: 'Query deleted successfully.' });
      fetchQueries();
    } catch (err: any) {
      console.error('Error deleting query:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to delete query.' });
    }
  };

  const showChat = selectedQuery && !chatCollapsed;

  return (
    <ProtectedRoute role="student">
      <PageShell title="Problems & Queries" subtitle="Raise and track support requests">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/student/queries" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/performance', label: 'Performance' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
          
          <div className={showChat ? "grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] w-full min-w-0" : "grid grid-cols-1 gap-6 w-full min-w-0"}>
            {/* Left side: Query List */}
            <div className={`${showChat ? 'hidden lg:block' : 'block'} space-y-6 w-full min-w-0`}>
              <div className="portal-card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold">Recent Queries</h2>
                  <div className="flex items-center gap-2">
                    {selectedQuery && chatCollapsed && (
                      <button
                        onClick={() => setChatCollapsed(false)}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
                        title="Expand Chat"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Show Chat</span>
                      </button>
                    )}
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white transition shadow-sm"
                    >
                      + Raise Query
                    </button>
                  </div>
                </div>

                {feedback && (
                  <div className={`mt-4 rounded-2xl border p-3 text-sm font-semibold ${
                    feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}>
                    {feedback.message}
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white w-full min-w-0">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full border-collapse text-left text-sm min-w-[360px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                          <th className="p-4">Type</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Raised To</th>
                          <th className="p-4">Raised By</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td className="p-8 text-center text-slate-500" colSpan={6}>
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                <span>Loading queries...</span>
                              </div>
                            </td>
                          </tr>
                        ) : queries.length === 0 ? (
                          <tr>
                            <td className="p-8 text-center text-slate-500" colSpan={6}>
                              You have not raised any queries yet.
                            </td>
                          </tr>
                        ) : null}
                        {queries.map((query) => {
                          const { raisedBy, raisedTo } = parseQueryMetadata(query.description);
                          const effectiveRaisedBy = query.raised_by_role || raisedBy;
                          const effectiveRaisedTo = query.raised_to_role || raisedTo;
                          return (
                          <tr 
                            key={query.id} 
                            onClick={() => {
                              setSelectedQuery(query);
                              setChatCollapsed(false);
                            }}
                            className={`cursor-pointer hover:bg-slate-50/70 transition-colors ${
                              selectedQuery?.id === query.id ? 'bg-emerald-50/40 font-semibold' : ''
                            }`}
                          >
                            <td className="p-4">
                              <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {query.type}
                              </span>
                            </td>
                            <td className="p-4 text-slate-900 max-w-[200px] truncate">{query.subject}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-xs font-semibold">{effectiveRaisedTo}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs">{effectiveRaisedBy}</span>
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
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Chat Window */}
            <div className={showChat ? "portal-card h-[600px] flex flex-col justify-between border border-slate-200 bg-white" : "hidden"}>
              {selectedQuery ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b border-slate-200 pb-4">
                    {/* Back Button (Mobile Only) */}
                    <button
                      onClick={() => setSelectedQuery(null)}
                      className="mb-3 flex lg:hidden items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      &larr; Back to Queries
                    </button>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setChatCollapsed(true)}
                          className="hidden lg:flex items-center justify-center p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition border border-slate-200 hover:text-slate-700 hover:border-slate-300"
                          title="Collapse Chat"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedQuery.type} Query</span>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">{selectedQuery.subject}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedQuery.status !== 'Resolved' && (
                          <button
                            onClick={() => handleCloseQuery(selectedQuery.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-2.5 py-1.5 transition"
                            title="Mark query as resolved"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Resolve</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteQueryById(selectedQuery.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Query"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                    {selectedQuery.description && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 max-h-[80px] overflow-y-auto">
                        <strong>Problem:</strong> {parseQueryMetadata(selectedQuery.description).cleanDesc}
                      </p>
                    )}
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600 mr-1" />
                        <span>Loading messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-4">
                        <MessageSquare className="h-8 w-8 mb-2 stroke-1" />
                        <p className="text-xs font-semibold">No messages yet. Send a message to start chatting!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.users?.role === 'student';
                        const roleLabel = msg.users?.role === 'faculty' ? 'Mentor' : msg.users?.role === 'hod' ? 'HOD' : msg.users?.role || 'User';

                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="text-[10px] text-slate-400 font-semibold mb-1 px-1">
                              {isMe ? 'You' : `${msg.users?.name || 'Faculty'} (${roleLabel})`} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`max-w-[85%] rounded-[20px] px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                              isMe 
                                ? 'bg-emerald-600 text-white rounded-tr-none' 
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
                      <div className="flex items-center gap-1.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>This query has been marked as Resolved. The conversation is closed.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a response to join the discussion..."
                          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 p-2.5 text-white transition flex items-center justify-center shrink-0"
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

        {/* Raise New Query Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900">Raise New Query</h3>
              <p className="text-xs text-slate-500 mt-1">Submit your academic, personal, or administrative concern. Your selected recipient will be notified.</p>

              <form onSubmit={handleCreateQuery} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Query Type</label>
                  <select
                    value={newQueryType}
                    onChange={(e) => setNewQueryType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Financial">Financial</option>
                    <option value="Personal">Personal</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Raised To</label>
                    <select
                      value={newQueryRaisedTo}
                      onChange={(e) => setNewQueryRaisedTo(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                    >
                      <option value="Faculty">Faculty</option>
                      <option value="HOD">HOD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Raised By</label>
                    <select
                      value={newQueryRaisedBy}
                      onChange={(e) => setNewQueryRaisedBy(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                    >
                      <option value="Student">Student</option>
                      <option value="Parent">Parent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={newQuerySubject}
                    onChange={(e) => setNewQuerySubject(e.target.value)}
                    placeholder="Short summary of the issue (e.g. Scholarship Delay)"
                    maxLength={100}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description / Details</label>
                  <textarea
                    value={newQueryDescription}
                    onChange={(e) => setNewQueryDescription(e.target.value)}
                    placeholder="Describe your issue in detail so your mentor can help you..."
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                    <span>Submit Query</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}