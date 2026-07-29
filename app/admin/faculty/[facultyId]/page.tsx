'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { 
  Loader2, ArrowLeft, User, Mail, Phone, BookOpen, 
  Building, ShieldCheck, Users, UserCheck, ExternalLink,
  Plus, ShieldAlert, Trash2
} from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' }
];

const getStudentBTechYear = (acYear: string, roll: string) => {
  const acYearStr = String(acYear || '').toLowerCase();
  if (acYearStr.includes('iv year') || acYearStr.includes('4th year') || acYearStr === '4') return 'IV Year';
  if (acYearStr.includes('iii year') || acYearStr.includes('3rd year') || acYearStr === '3') return 'III Year';
  if (acYearStr.includes('ii year') || acYearStr.includes('2nd year') || acYearStr === '2') return 'II Year';
  if (acYearStr.includes('i year') || acYearStr.includes('1st year') || acYearStr === '1') return 'I Year';

  const r = String(roll || '').trim();
  if (r.length >= 2) {
    const joinYearDigits = parseInt(r.substring(0, 2));
    if (!isNaN(joinYearDigits)) {
      const diff = 26 - joinYearDigits;
      if (diff === 0 || diff === 1) return 'I Year';
      if (diff === 2) return 'II Year';
      if (diff === 3) return 'III Year';
      if (diff >= 4) return 'IV Year';
    }
  }
  return 'I Year';
};

export default function AdminMentorDetailPage({ params }: { params: Promise<{ facultyId: string }> }) {
  const resolvedParams = use(params);
  const facultyId = resolvedParams.facultyId;
  const router = useRouter();

  const [mentor, setMentor] = useState<any | null>(null);
  const [hodName, setHodName] = useState<string>('Unassigned');
  const [assignedMentees, setAssignedMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadMentorData = async () => {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, name, email, role, status,
          faculty_profiles!user_id (
            id, faculty_id, department, designation, qualification, subjects, contact_number, profile_photo, hod_id
          )
        `)
        .eq('id', facultyId)
        .single();

      if (userError || !userData) throw new Error('Mentor not found.');

      setMentor(userData);

      const fProfile = userData.faculty_profiles?.[0] || {};
      const fProfileId = fProfile.id;

      if (fProfile.hod_id) {
        const { data: hodData } = await supabase
          .from('users')
          .select('name')
          .eq('id', fProfile.hod_id)
          .maybeSingle();
        if (hodData) setHodName(hodData.name);
      } else {
        setHodName('Unassigned');
      }

      // Fetch all approved students and filter by matching mentor_id
      const { data: studentsDb, error: studentError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id (
            user_id, roll_number, branch, section, cgpa, backlogs, academic_year, attendance_percentage, mentor_id
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (studentError) throw studentError;

      const matchedMentees = (studentsDb || [])
        .filter((u: any) => {
          const sp = u.student_profiles?.[0] || {};
          if (!sp.mentor_id) return false;
          return sp.mentor_id === facultyId || (fProfileId && sp.mentor_id === fProfileId);
        })
        .map((u: any) => {
          const sp = u.student_profiles?.[0] || {};
          const cgpaVal = sp.cgpa !== null && sp.cgpa !== undefined ? parseFloat(sp.cgpa) : 0;
          const backlogsVal = sp.backlogs !== null && sp.backlogs !== undefined ? Number(sp.backlogs) : 0;
          const riskLevel = getRiskLevel(cgpaVal, backlogsVal);

          return {
            userId: u.id,
            name: u.name || 'Student',
            email: u.email || '',
            rollNumber: sp.roll_number || 'N/A',
            branch: sp.branch || 'N/A',
            section: sp.section || '',
            btechYear: getStudentBTechYear(sp.academic_year, sp.roll_number),
            cgpa: cgpaVal,
            backlogs: backlogsVal,
            riskLevel: riskLevel
          };
        });

      setAssignedMentees(matchedMentees);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load mentor details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentorData();
  }, [facultyId]);

  const handleStatusUpdate = async (newStatus: 'Pending' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', facultyId);

      if (error) throw error;

      setFeedback({ type: 'success', message: `Mentor status changed to ${newStatus}.` });
      loadMentorData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update mentor status.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to completely delete this mentor account? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', facultyId);

      if (error) throw error;

      router.push('/admin/faculty');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete mentor.' });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute role="admin">
        <PageShell title="Mentor Details" subtitle="Loading mentor profile...">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  if (!mentor) {
    return (
      <ProtectedRoute role="admin">
        <PageShell title="Mentor Details" subtitle="Mentor not found">
          <div className="p-8 text-center">
            <p className="text-slate-500 font-semibold mb-4">The requested mentor profile could not be found.</p>
            <button
              onClick={() => router.push('/admin/faculty')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Manage Mentors</span>
            </button>
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  const profile = mentor.faculty_profiles?.[0] || {};

  return (
    <ProtectedRoute role="admin">
      <PageShell title={`${mentor.name} - Mentor Details`} subtitle="Manage mentor details, qualifications, and assigned student roster">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/faculty" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => router.push('/admin/faculty')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-700" />
                <span>Back to Manage Mentors</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusUpdate('Pending')}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Suspend Account</span>
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Faculty</span>
                </button>
              </div>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Profile Header Banner */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 md:p-8 text-white">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/80 bg-white/10 flex items-center justify-center shrink-0 shadow-lg">
                    {profile.profile_photo ? (
                      <img src={profile.profile_photo} alt={mentor.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-white/90" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl md:text-3xl font-black">{mentor.name}</h1>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-white/20 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-emerald-100 backdrop-blur-md">
                        <ShieldCheck className="h-3.5 w-3.5" /> Faculty Mentor
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-emerald-100/90 mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-300" />
                      <span>{mentor.email}</span>
                      {profile.contact_number && (
                        <>
                          <span>•</span>
                          <Phone className="h-4 w-4 text-emerald-300" />
                          <span>{profile.contact_number}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Mentor ID</span>
                  <span className="text-base font-black font-mono text-slate-900 mt-1 block">{profile.faculty_id || 'N/A'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Department</span>
                  <span className="text-base font-black text-slate-900 uppercase mt-1 block">{profile.department || 'N/A'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Designation</span>
                  <span className="text-base font-black text-slate-900 mt-1 block truncate">{profile.designation || 'N/A'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned HOD</span>
                  <span className="text-base font-black text-slate-900 mt-1 block truncate">{hodName}</span>
                </div>
              </div>
            </div>

            {/* Qualification & Subjects Info Card */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-emerald-700" />
                <span>Qualification & Academic Responsibilities</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block font-normal text-[11px]">Qualification:</span>
                  <span className="text-sm font-extrabold text-slate-900 uppercase mt-0.5 block">{profile.qualification || 'Not Specified'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block font-normal text-[11px]">Subjects Handling:</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{profile.subjects || 'Not Specified'}</span>
                </div>
              </div>
            </div>

            {/* Assigned Students Roster Table */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-700" />
                    <span>Assigned Students ({assignedMentees.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Full list of student mentees assigned to {mentor.name}.</p>
                </div>

                <button
                  onClick={() => router.push(`/admin/faculty/${facultyId}/assign` as any)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white transition shadow-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Assign / Manage Students</span>
                </button>
              </div>

              {assignedMentees.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
                  No students are currently assigned to {mentor.name}. Click <b>+ Assign / Manage Students</b> to allocate students.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-semibold text-slate-700">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Roll No</th>
                        <th className="px-5 py-3.5">Student Name</th>
                        <th className="px-5 py-3.5">Branch & Section</th>
                        <th className="px-5 py-3.5 text-center">CGPA</th>
                        <th className="px-5 py-3.5 text-center">Risk Status</th>
                        <th className="px-5 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {assignedMentees.map((st) => (
                        <tr key={st.userId} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-4 font-mono font-bold text-slate-900">{st.rollNumber}</td>
                          <td className="px-5 py-4 font-bold text-slate-900">{st.name}</td>
                          <td className="px-5 py-4 text-slate-600">
                            <span className="font-extrabold uppercase text-slate-800">{st.branch}</span>
                            <span className="text-slate-400 font-normal ml-1">
                              {st.section ? `Sec ${st.section} • ` : ''}{st.btechYear}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center font-black text-slate-900">
                            {st.cgpa > 0 ? st.cgpa.toFixed(2) : 'N/A'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              st.riskLevel === 'Low' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                              st.riskLevel === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                              'bg-rose-50 border-rose-200 text-rose-800'
                            }`}>
                              {st.riskLevel}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => router.push(`/admin/students/${st.userId}`)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                            >
                              <span>View Profile</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
