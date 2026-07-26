'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardList, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

const studentSidebarItems = [
  { href: '/student', label: 'Profile' },
  { href: '/student/academic', label: 'Academic Profile' },
  { href: '/student/academic-forms', label: 'Academic Forms' },
  { href: '/student/attendance-forms', label: 'Attendance Forms' },
  { href: '/student/extracurricular', label: 'Extracurricular Activities' },
  { href: '/student/performance', label: 'Performance' },
  { href: '/student/queries', label: 'Problems / Queries' }
];

export default function StudentAcademicFormsPage() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [formDataState, setFormDataState] = useState<Record<string, any>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('mentor_id')
        .eq('user_id', userId)
        .maybeSingle();

      const mentorId = profile?.mentor_id;
      if (!mentorId) {
        setLoading(false);
        return;
      }

      // Fetch semester_marks forms sent by mentor
      const { data: formsData } = await supabase
        .from('academic_forms')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('form_type', 'semester_marks')
        .eq('status', 'Active')
        .or(`student_id.is.null,student_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      setForms(formsData || []);

      // Fetch student submissions for marks forms
      const { data: subsData } = await supabase
        .from('academic_form_submissions')
        .select('*')
        .eq('student_id', userId)
        .eq('form_type', 'semester_marks');

      const subMap: Record<string, any> = {};
      const stateMap: Record<string, any> = {};

      (subsData || []).forEach((s) => {
        subMap[s.form_id] = s;
      });

      (formsData || []).forEach((f) => {
        const sub = subMap[f.id];
        if (sub) {
          stateMap[f.id] = {
            fields: sub.submission_data || f.fields || []
          };
        } else {
          stateMap[f.id] = {
            fields: (f.fields || []).map((row: any) => ({
              ...row,
              internal: '',
              external: ''
            }))
          };
        }
      });

      setSubmissions(subMap);
      setFormDataState(stateMap);
    } catch (err: any) {
      console.error('Error fetching academic forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFieldChange = (formId: string, idx: number, key: string, value: any) => {
    setFormDataState((prev) => {
      const currentForm = prev[formId] || { fields: [] };
      const newFields = [...currentForm.fields];
      newFields[idx] = { ...newFields[idx], [key]: value };
      return {
        ...prev,
        [formId]: { ...currentForm, fields: newFields }
      };
    });
  };

  const handleSubmitForm = async (form: any) => {
    try {
      setSubmittingId(form.id);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Must be logged in');

      const currentInputs = formDataState[form.id] || {};
      const fields = currentInputs.fields || [];

      // Validate marks
      for (const row of fields) {
        const internalNum = parseInt(row.internal);
        const externalNum = parseInt(row.external);
        if (isNaN(internalNum) || internalNum < 0 || internalNum > 40) {
          alert(`Please enter valid Internal Marks (0-40) for ${row.name || row.code}.`);
          setSubmittingId(null);
          return;
        }
        if (isNaN(externalNum) || externalNum < 0 || externalNum > 60) {
          alert(`Please enter valid External Marks (0-60) for ${row.name || row.code}.`);
          setSubmittingId(null);
          return;
        }
      }

      const existingSub = submissions[form.id];
      const payload = {
        form_id: form.id,
        student_id: userId,
        mentor_id: form.mentor_id,
        form_type: 'semester_marks',
        semester: form.semester,
        submission_data: fields,
        status: 'Submitted',
        submitted_at: new Date().toISOString()
      };

      if (existingSub) {
        const { error } = await supabase
          .from('academic_form_submissions')
          .update(payload)
          .eq('id', existingSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('academic_form_submissions')
          .insert(payload);
        if (error) throw error;
      }

      setFeedback({ type: 'success', message: 'Semester Marks Form submitted successfully to your mentor!' });
      fetchData();
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to submit form.' });
    } finally {
      setSubmittingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <ProtectedRoute role="student">
      <PageShell title="Academic Forms" subtitle="Fill and submit Semester Marks Forms from your mentor">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/student/academic-forms" items={studentSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {feedback && (
              <div className={`rounded-2xl border p-4 text-sm font-semibold shadow-sm animate-fade-in ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            <div className="portal-card">
              <h2 className="text-xl font-bold text-slate-850 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-700" />
                <span>Semester Marks Forms</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your subject internal (out of 40) and external marks (out of 60) issued by your assigned mentor.
              </p>
            </div>

            {loading ? (
              <div className="portal-card flex h-[250px] items-center justify-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mr-2" />
                <span>Loading marks forms...</span>
              </div>
            ) : forms.length === 0 ? (
              <div className="portal-card p-8 text-center text-sm text-slate-500">
                No active marks forms issued by your mentor at this time.
              </div>
            ) : (
              <div className="space-y-6">
                {forms.map((form) => {
                  const sub = submissions[form.id];
                  const isSubmitted = sub?.status === 'Submitted';
                  const isApproved = sub?.status === 'Approved';
                  const isRejected = sub?.status === 'Rejected';
                  const formInputs = formDataState[form.id] || { fields: [] };

                  return (
                    <div key={form.id} className="portal-card border border-slate-200 bg-white p-6 rounded-3xl shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-slate-900">{form.title}</h3>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              Semester {form.semester || '3-2'} Marks
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Issued by Mentor: Assigned Mentor</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                              <CheckCircle className="h-4 w-4 text-emerald-700" />
                              <span>Verified & Synced</span>
                            </span>
                          )}
                          {isSubmitted && !isApproved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-850 px-3 py-1 text-xs font-bold">
                              <Clock className="h-4 w-4 text-amber-700" />
                              <span>Submitted (Awaiting Mentor Approval)</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-3 py-1 text-xs font-bold">
                              <AlertCircle className="h-4 w-4 text-rose-700" />
                              <span>Resubmission Required ({sub.rejection_reason})</span>
                            </span>
                          )}
                          {!sub && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold">
                              <span>Action Required</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Marks Table */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="text-slate-500 font-bold uppercase text-[9px] border-b border-slate-200">
                              <th className="p-2">Subject Code</th>
                              <th className="p-2">Subject Name</th>
                              <th className="p-2 text-center w-28">Internal Marks (40)</th>
                              <th className="p-2 text-center w-28">External Marks (60)</th>
                              <th className="p-2 text-center w-24">Total (100)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                            {(formInputs.fields || []).map((row: any, idx: number) => {
                              const internalNum = parseInt(row.internal) || 0;
                              const externalNum = parseInt(row.external) || 0;
                              const total = internalNum + externalNum;

                              return (
                                <tr key={idx}>
                                  <td className="p-2 font-mono font-bold">{row.code}</td>
                                  <td className="p-2 font-semibold">{row.name}</td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="40"
                                      placeholder="0-40"
                                      disabled={isSubmitted && !isRejected}
                                      value={row.internal ?? ''}
                                      onChange={(e) => handleFieldChange(form.id, idx, 'internal', e.target.value)}
                                      className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-center font-bold text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="60"
                                      placeholder="0-60"
                                      disabled={isSubmitted && !isRejected}
                                      value={row.external ?? ''}
                                      onChange={(e) => handleFieldChange(form.id, idx, 'external', e.target.value)}
                                      className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-center font-bold text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                    />
                                  </td>
                                  <td className="p-2 text-center font-bold text-emerald-800">
                                    {total}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Submit Button */}
                      {(!isSubmitted || isRejected) && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleSubmitForm(form)}
                            disabled={submittingId === form.id}
                            className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] text-white px-6 py-2.5 text-xs font-extrabold transition flex items-center gap-2 shadow-sm"
                          >
                            {submittingId === form.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span>Submit Marks Form to Mentor</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
