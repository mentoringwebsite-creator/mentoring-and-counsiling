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
  Loader2, 
  Lock, 
  FileText,
  Percent
} from 'lucide-react';

const studentSidebarItems = [
  { href: '/student', label: 'Profile' },
  { href: '/student/academic', label: 'Academic Profile' },
  { href: '/student/forms', label: 'Academic Forms' },
  { href: '/student/extracurricular', label: 'Extracurricular Activities' },
  { href: '/student/performance', label: 'Performance' },
  { href: '/student/queries', label: 'Problems / Queries' }
];

export default function StudentFormsPage() {
  const [loading, setLoading] = useState(true);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [mentorName, setMentorName] = useState<string>('Assigned Mentor');
  const [assignedForms, setAssignedForms] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Filling State for current active forms
  const [formDataState, setFormDataState] = useState<Record<string, any>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      // 1. Fetch student's assigned mentor_id
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('mentor_id')
        .eq('user_id', userId)
        .maybeSingle();

      const assignedMentorId = profile?.mentor_id;
      setMentorId(assignedMentorId || null);

      if (assignedMentorId) {
        const { data: mentorUser } = await supabase
          .from('users')
          .select('name')
          .eq('id', assignedMentorId)
          .single();
        if (mentorUser) setMentorName(mentorUser.name);
      }

      if (!assignedMentorId) {
        setLoading(false);
        return;
      }

      // 2. Fetch active forms created by student's mentor
      const { data: formsData } = await supabase
        .from('academic_forms')
        .select('*')
        .eq('mentor_id', assignedMentorId)
        .order('created_at', { ascending: false });

      // Filter forms targeted to this student or sent to all
      const myForms = (formsData || []).filter(
        (f: any) => !f.student_id || f.student_id === userId
      );
      setAssignedForms(myForms);

      // 3. Fetch submissions by this student
      const { data: subsData } = await supabase
        .from('academic_form_submissions')
        .select('*')
        .eq('student_id', userId);

      const subMap: Record<string, any> = {};
      const initialFormValues: Record<string, any> = {};

      (subsData || []).forEach((sub: any) => {
        subMap[sub.form_id] = sub;
      });

      myForms.forEach((form: any) => {
        const sub = subMap[form.id];
        if (sub) {
          initialFormValues[form.id] = {
            fields: sub.submission_data || [],
            overall_attendance: sub.overall_attendance || 85.0
          };
        } else {
          // Initialize empty values from form fields definition
          initialFormValues[form.id] = {
            fields: (form.fields || []).map((field: any) => ({
              code: field.code,
              name: field.name,
              internal: '',
              external: '',
              attendance: '85'
            })),
            overall_attendance: '85'
          };
        }
      });

      setSubmissions(subMap);
      setFormDataState(initialFormValues);
    } catch (err: any) {
      console.error('Error fetching student forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFieldChange = (formId: string, subjectIndex: number, key: string, value: string) => {
    const currentFormVal = formDataState[formId] || { fields: [] };
    const updatedFields = [...currentFormVal.fields];
    updatedFields[subjectIndex] = {
      ...updatedFields[subjectIndex],
      [key]: value
    };

    setFormDataState({
      ...formDataState,
      [formId]: {
        ...currentFormVal,
        fields: updatedFields
      }
    });
  };

  const handleOverallAttendanceChange = (formId: string, value: string) => {
    const currentFormVal = formDataState[formId] || { fields: [] };
    setFormDataState({
      ...formDataState,
      [formId]: {
        ...currentFormVal,
        overall_attendance: value
      }
    });
  };

  const handleSubmitForm = async (form: any) => {
    try {
      setSubmittingId(form.id);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Must be logged in to submit form.');

      const formInputs = formDataState[form.id] || {};
      const fieldsData = formInputs.fields || [];

      // Validation
      if (form.form_type === 'semester_marks') {
        const hasMissing = fieldsData.some(
          (f: any) => f.internal === '' || f.external === ''
        );
        if (hasMissing) {
          alert('Please enter both Internal and External marks for all subjects.');
          setSubmittingId(null);
          return;
        }
      }

      const payload = {
        form_id: form.id,
        student_id: userId,
        mentor_id: form.mentor_id,
        form_type: form.form_type,
        semester: form.semester || '3-2',
        submission_data: fieldsData,
        overall_attendance: form.form_type === 'attendance' ? parseFloat(formInputs.overall_attendance || 85.0) : null,
        status: 'Submitted',
        submitted_at: new Date().toISOString()
      };

      const existingSub = submissions[form.id];
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

      setFeedback({ type: 'success', message: 'Form submitted successfully to your mentor for verification!' });
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
      <PageShell title="Academic Forms" subtitle="Fill and submit forms sent by your mentor">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/student/forms" items={studentSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {feedback && (
              <div className={`rounded-2xl border p-4 text-sm font-semibold shadow-sm animate-fade-in ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Header Box */}
            <div className="portal-card">
              <h2 className="text-xl font-bold text-slate-850 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-700" />
                <span>Mentor Academic Forms</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Forms sent by your assigned mentor <strong className="text-slate-800">{mentorName}</strong>. Submissions are verified by your mentor before updating your official academic records.
              </p>
            </div>

            {loading ? (
              <div className="portal-card flex h-[250px] items-center justify-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mr-2" />
                <span>Loading assigned forms...</span>
              </div>
            ) : !mentorId ? (
              <div className="portal-card p-8 text-center text-sm text-slate-500">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                No assigned mentor found. Please contact your department HOD to get assigned to a mentor.
              </div>
            ) : assignedForms.length === 0 ? (
              <div className="portal-card p-8 text-center text-sm text-slate-500">
                No active forms sent by your mentor yet.
              </div>
            ) : (
              <div className="space-y-6">
                {assignedForms.map((form) => {
                  const sub = submissions[form.id];
                  const isSubmitted = sub && (sub.status === 'Submitted' || sub.status === 'Approved');
                  const isApproved = sub && sub.status === 'Approved';
                  const isRejected = sub && sub.status === 'Rejected';
                  const formInputs = formDataState[form.id] || { fields: [] };

                  return (
                    <div key={form.id} className="portal-card border border-slate-200 bg-white p-6 rounded-3xl shadow-sm space-y-4">
                      {/* Form Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{form.title}</h3>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              form.form_type === 'semester_marks' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {form.form_type === 'semester_marks' ? 'Semester Marks' : 'Attendance Form'} ({form.semester || '3-2'})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Issued by Mentor: {mentorName}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {sub ? (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold ${
                              isApproved ? 'bg-emerald-100 text-emerald-800' :
                              isRejected ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-850'
                            }`}>
                              {isApproved ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                              <span>{isApproved ? 'Approved & Verified' : isRejected ? 'Rejected / Resubmit' : 'Pending Verification'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-extrabold">
                              <span>Action Required</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rejection Message if Rejected */}
                      {isRejected && (
                        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                          <strong>Mentor Rejection Reason:</strong> {sub.rejection_reason || 'Please correct marks and resubmit.'}
                        </div>
                      )}

                      {/* Locked Notice */}
                      {isSubmitted && !isRejected && (
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                          <span>Form submitted. Edits locked unless requested by mentor.</span>
                        </div>
                      )}

                      {/* FORM FIELDS BUILDER */}
                      {form.form_type === 'semester_marks' ? (
                        /* Marks Form Fields */
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
                      ) : (
                        /* Attendance Form Fields */
                        <div className="space-y-4">
                          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-amber-900 uppercase">Overall Attendance Percentage (%)</span>
                              <p className="text-[11px] text-amber-700">Enter your current overall cumulative attendance percentage across all subjects.</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="85.0"
                                disabled={isSubmitted && !isRejected}
                                value={formInputs.overall_attendance ?? '85'}
                                onChange={(e) => handleOverallAttendanceChange(form.id, e.target.value)}
                                className="w-24 rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-extrabold text-sm text-center text-amber-900 focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                              />
                              <span className="font-bold text-amber-900">%</span>
                            </div>
                          </div>

                          {/* Per-subject attendance Breakdown */}
                          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="text-slate-500 font-bold uppercase text-[9px] border-b border-slate-200">
                                  <th className="p-2">Subject Code</th>
                                  <th className="p-2">Subject Name</th>
                                  <th className="p-2 text-center w-32">Attendance %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                                {(formInputs.fields || []).map((row: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="p-2 font-mono font-bold">{row.code}</td>
                                    <td className="p-2 font-semibold">{row.name}</td>
                                    <td className="p-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          placeholder="85"
                                          disabled={isSubmitted && !isRejected}
                                          value={row.attendance ?? '85'}
                                          onChange={(e) => handleFieldChange(form.id, idx, 'attendance', e.target.value)}
                                          className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-center font-bold text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                        <span>%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Submit Action */}
                      {(!isSubmitted || isRejected) && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleSubmitForm(form)}
                            disabled={submittingId === form.id}
                            className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] text-white px-6 py-2.5 text-xs font-bold transition flex items-center gap-2 shadow-sm"
                          >
                            {submittingId === form.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span>Submit Form to Mentor</span>
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
