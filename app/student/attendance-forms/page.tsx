'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
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

export default function StudentAttendanceFormsPage() {
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
        .select('mentor_id, attendance_percentage')
        .eq('user_id', userId)
        .maybeSingle();

      const mentorId = profile?.mentor_id;
      if (!mentorId) {
        setLoading(false);
        return;
      }

      // Fetch attendance forms sent by mentor
      const { data: formsData } = await supabase
        .from('academic_forms')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('form_type', 'attendance')
        .eq('status', 'Active')
        .or(`student_id.is.null,student_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      setForms(formsData || []);

      // Fetch student submissions for attendance forms
      const { data: subsData } = await supabase
        .from('academic_form_submissions')
        .select('*')
        .eq('student_id', userId)
        .eq('form_type', 'attendance');

      const subMap: Record<string, any> = {};
      const stateMap: Record<string, any> = {};

      (subsData || []).forEach((s) => {
        subMap[s.form_id] = s;
      });

      (formsData || []).forEach((f) => {
        const sub = subMap[f.id];
        stateMap[f.id] = {
          overall_attendance: sub?.overall_attendance ?? (profile?.attendance_percentage ?? 85.0)
        };
      });

      setSubmissions(subMap);
      setFormDataState(stateMap);
    } catch (err: any) {
      console.error('Error fetching attendance forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOverallAttendanceChange = (formId: string, val: string) => {
    setFormDataState((prev) => ({
      ...prev,
      [formId]: { ...prev[formId], overall_attendance: val }
    }));
  };

  const handleSubmitForm = async (form: any) => {
    try {
      setSubmittingId(form.id);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Must be logged in');

      const currentInputs = formDataState[form.id] || {};
      const overallAtt = parseFloat(currentInputs.overall_attendance);

      if (isNaN(overallAtt) || overallAtt < 0 || overallAtt > 100) {
        alert('Please enter a valid Overall Attendance Percentage (0-100%).');
        setSubmittingId(null);
        return;
      }

      const existingSub = submissions[form.id];
      const payload = {
        form_id: form.id,
        student_id: userId,
        mentor_id: form.mentor_id,
        form_type: 'attendance',
        semester: form.semester,
        submission_data: [],
        overall_attendance: overallAtt,
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

      setFeedback({ type: 'success', message: 'Attendance Form submitted successfully to your mentor!' });
      fetchData();
    } catch (err: any) {
      console.error('Error submitting attendance form:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to submit attendance form.' });
    } finally {
      setSubmittingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <ProtectedRoute role="student">
      <PageShell title="Attendance Forms" subtitle="Submit 15-day cumulative attendance updates to your mentor">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/student/attendance-forms" items={studentSidebarItems} />

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
                <Calendar className="h-5 w-5 text-emerald-700" />
                <span>15-Day Attendance Progress Forms</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your current overall cumulative attendance percentage across all subjects for this semester.
              </p>
            </div>

            {loading ? (
              <div className="portal-card flex h-[250px] items-center justify-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mr-2" />
                <span>Loading attendance forms...</span>
              </div>
            ) : forms.length === 0 ? (
              <div className="portal-card p-8 text-center text-sm text-slate-500">
                No active attendance forms issued by your mentor at this time.
              </div>
            ) : (
              <div className="space-y-6">
                {forms.map((form) => {
                  const sub = submissions[form.id];
                  const isSubmitted = sub?.status === 'Submitted';
                  const isApproved = sub?.status === 'Approved';
                  const isRejected = sub?.status === 'Rejected';
                  const formInputs = formDataState[form.id] || {};

                  return (
                    <div key={form.id} className="portal-card border border-slate-200 bg-white p-6 rounded-3xl shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-slate-900">{form.title}</h3>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-850">
                              Attendance Form ({form.semester || '3-2'})
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

                      {/* Attendance Card */}
                      <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Overall Attendance Percentage (%)</span>
                          <p className="text-xs text-amber-700 mt-1">Enter your current overall cumulative attendance percentage for this term/semester.</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="85.0"
                            disabled={isSubmitted && !isRejected}
                            value={formInputs.overall_attendance ?? '85'}
                            onChange={(e) => handleOverallAttendanceChange(form.id, e.target.value)}
                            className="w-28 rounded-xl border border-amber-300 bg-white px-3 py-2 font-extrabold text-base text-center text-amber-950 focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
                          />
                          <span className="font-extrabold text-amber-900 text-lg">%</span>
                        </div>
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
                            <span>Submit Attendance Form to Mentor</span>
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
