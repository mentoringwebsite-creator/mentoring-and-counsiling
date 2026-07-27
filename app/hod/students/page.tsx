"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { 
  Loader2, Search, UserCheck, UserPlus, UserMinus, User, Mail, Phone, 
  GraduationCap, Briefcase, Award, ChevronDown, ChevronUp, ExternalLink, ShieldCheck 
} from 'lucide-react';

const hodSidebarItems = [
  { href: '/hod', label: 'HOD Dashboard' },
  { href: '/hod/students', label: 'Students' },
  { href: '/hod/queries', label: 'Student Queries' }
];

const isBranchInDepartment = (branch: string, department: string) => {
  if (!branch || !department) return false;
  const b = branch.toLowerCase().trim();
  const d = department.toLowerCase().trim();
  if (b === d) return true;
  if (b === 'ece' && (d.includes('electronics') || d.includes('ece'))) return true;
  if (d.includes('electronics') && b.includes('ece')) return true;
  if (b === 'cse' && (d.includes('computer science') || d.includes('cse'))) return true;
  if (d.includes('computer science') && b.includes('cse')) return true;
  if (b === 'it' && (d.includes('information technology') || d.includes('it'))) return true;
  if (d.includes('information technology') && b.includes('it')) return true;
  if (b === 'eee' && (d.includes('electrical') || d.includes('eee'))) return true;
  if (d.includes('electrical') && b.includes('eee')) return true;
  if ((b === 'me' || b === 'mech' || b.includes('mechanical')) && (d.includes('mechanical') || d.includes('mech') || d === 'me')) return true;
  if ((b === 'ce' || b.includes('civil')) && (d.includes('civil') || d === 'ce')) return true;
  return d.includes(b) || b.includes(d);
};

export default function HodStudentsPage() {
  const router = useRouter();
  const [hodId, setHodId] = useState<string | null>(null);
  const [hodDepartment, setHodDepartment] = useState<string>('');
  const [departmentMentorIds, setDepartmentMentorIds] = useState<string[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'mentors' | 'assigned' | 'unassigned' | 'all'>('mentors');
  const [expandedMentorId, setExpandedMentorId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getStudentBTechYear = (profile: any) => {
    const acYear = profile?.academic_year || '';
    const roll = profile?.roll_number || '';
    const acYearStr = String(acYear).toLowerCase();
    if (acYearStr.includes('iv year') || acYearStr.includes('4th year') || acYearStr === '4' || acYearStr.includes('fourth')) return 'IV Year';
    if (acYearStr.includes('iii year') || acYearStr.includes('3rd year') || acYearStr === '3' || acYearStr.includes('third')) return 'III Year';
    if (acYearStr.includes('ii year') || acYearStr.includes('2nd year') || acYearStr === '2' || acYearStr.includes('second')) return 'II Year';
    if (acYearStr.includes('i year') || acYearStr.includes('1st year') || acYearStr === '1' || acYearStr.includes('first')) return 'I Year';

    const r = String(roll).trim();
    if (r.length >= 2) {
      const joinYearDigits = parseInt(r.substring(0, 2));
      if (!isNaN(joinYearDigits)) {
        const currentYear = 2026;
        const currentYearDigits = currentYear % 100; // 26
        const diff = currentYearDigits - joinYearDigits;
        if (diff === 0 || diff === 1) return 'I Year';
        if (diff === 2) return 'II Year';
        if (diff === 3) return 'III Year';
        if (diff >= 4) return 'IV Year';
      }
    }
    return 'I Year';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const hId = session.user.id;
      setHodId(hId);

      const { data: hodProfile } = await supabase
        .from('hod_profiles')
        .select('department')
        .eq('user_id', hId)
        .maybeSingle();
      const dept = hodProfile?.department || '';
      setHodDepartment(dept);

      // Fetch all approved faculty mentors
      const { data: mentorsDb, error: mentorsError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          faculty_profiles!user_id (
            faculty_id, designation, department, qualification, year_joined, contact_number, office_room
          )
        `)
        .eq('role', 'faculty')
        .eq('status', 'Approved');
      if (mentorsError) throw mentorsError;

      const departmentMentors = (mentorsDb || [])
        .filter((mentor: any) => isBranchInDepartment(mentor.faculty_profiles?.[0]?.department, dept));

      const mentorIds = departmentMentors.map((m: any) => m.id);
      setDepartmentMentorIds(mentorIds);
      setMentors(departmentMentors);

      // Expand first mentor by default if available
      if (departmentMentors.length > 0 && !expandedMentorId) {
        setExpandedMentorId(departmentMentors[0].id);
      }

      // Fetch all approved students
      const { data: studentsDb, error } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id (
            roll_number, branch, section, phone, dob, profile_photo, mentor_id, cgpa, backlogs, academic_year
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (error) throw error;

      const deptStudents = (studentsDb || []).filter((student: any) => {
        const profile = student.student_profiles?.[0] || {};
        return isBranchInDepartment(profile.branch, dept) || (profile.mentor_id && mentorIds.includes(profile.mentor_id));
      });

      setStudents(deptStudents);
    } catch (err: any) {
      console.error('Error loading student & mentor roster:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (studentUserId: string, assign: boolean) => {
    try {
      setFeedback(null);
      const newMentorId = assign ? hodId : null;

      const { error } = await supabase
        .from('student_profiles')
        .update({ mentor_id: newMentorId })
        .eq('user_id', studentUserId);

      if (error) throw error;

      setFeedback({ type: 'success', message: assign ? 'Student assigned to you successfully!' : 'Student removed from your list.' });
      await loadData();
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to update assignment.' });
    }
  };

  const filteredStudents = students.filter((student) => {
    const profile = student.student_profiles?.[0] || {};
    const isMine = profile.mentor_id === hodId;
    const isAssigned = !!profile.mentor_id && (departmentMentorIds.includes(profile.mentor_id) || profile.mentor_id === hodId);
    const isUnassigned = !profile.mentor_id;

    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || (profile.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'assigned') return isAssigned;
    if (activeTab === 'unassigned') return isUnassigned;
    return true;
  });

  const filteredMentors = mentors.filter((mentor) => {
    const fProfile = mentor.faculty_profiles?.[0] || {};
    return mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (fProfile.faculty_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (fProfile.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <ProtectedRoute role="hod">
      <PageShell title="Faculty Mentors & Students" subtitle="Manage department faculty mentors and student assignments">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/hod/students" items={hodSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Faculty Mentors & Student Assignments</h2>
              <p className="mt-2 text-slate-600">Review department mentors, inspect their assigned students, and manage unassigned student queues.</p>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Filter Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button 
                  onClick={() => setActiveTab('mentors')} 
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === 'mentors' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Faculty & Mentors ({mentors.length})
                </button>
                <button 
                  onClick={() => setActiveTab('assigned')} 
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === 'assigned' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Assigned Students
                </button>
                <button 
                  onClick={() => setActiveTab('unassigned')} 
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === 'unassigned' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Unassigned
                </button>
                <button 
                  onClick={() => setActiveTab('all')} 
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-emerald-800'}`}
                >
                  All Approved
                </button>
              </div>

              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'mentors' ? "Search mentor name or ID..." : "Search student name or roll no..."} 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-600 focus:outline-none" 
                />
              </div>
            </div>

            {/* TAB 1: FACULTY & MENTORS ROSTER */}
            {activeTab === 'mentors' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="portal-card flex h-48 items-center justify-center">
                    <div className="flex items-center gap-3 text-slate-500 font-semibold">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      <span>Loading faculty mentors list...</span>
                    </div>
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <div className="portal-card p-8 text-center text-slate-500">
                    <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-sm">No Faculty Mentors Found</p>
                    <p className="text-xs text-slate-400 mt-1">No faculty mentors match the selected department or query.</p>
                  </div>
                ) : (
                  filteredMentors.map((mentor) => {
                    const fProfile = mentor.faculty_profiles?.[0] || {};
                    const assignedStudentsList = students.filter((s) => {
                      const sp = s.student_profiles?.[0] || {};
                      return sp.mentor_id === mentor.id;
                    });
                    const isExpanded = expandedMentorId === mentor.id;

                    return (
                      <div key={mentor.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                        {/* Mentor Header Bar */}
                        <div 
                          onClick={() => setExpandedMentorId(isExpanded ? null : mentor.id)}
                          className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer bg-slate-50/50 hover:bg-slate-50 border-b border-slate-100"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-800 text-white font-black text-lg flex items-center justify-center shrink-0 border border-emerald-700 shadow-sm">
                              {mentor.name ? mentor.name.substring(0, 2).toUpperCase() : 'FC'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-extrabold text-slate-900 truncate">{mentor.name}</h3>
                                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                  Mentor
                                </span>
                              </div>
                              <p className="text-xs text-emerald-700 font-bold uppercase mt-0.5">
                                {fProfile.designation || 'Faculty Member'} • {fProfile.department || 'Department'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                                EMP ID: {fProfile.faculty_id || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-black text-slate-900">{assignedStudentsList.length}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Students</div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Faculty Info Card & Assigned Students Grid */}
                        {isExpanded && (
                          <div className="p-6 space-y-6 bg-white animate-fade-in">
                            {/* Faculty Profile Summary */}
                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-150 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Qualification</span>
                                <span className="font-bold text-slate-800 uppercase">{fProfile.qualification || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Joining Year</span>
                                <span className="font-bold text-slate-800">{fProfile.year_joined || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Contact Number</span>
                                <span className="font-mono font-bold text-slate-800">{fProfile.contact_number || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Official Email</span>
                                <a href={`mailto:${mentor.email}`} className="font-semibold text-emerald-700 hover:underline truncate block">{mentor.email}</a>
                              </div>
                            </div>

                            {/* Assigned Students List Table */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <UserCheck className="h-4 w-4 text-emerald-700" />
                                  <span>Assigned Students ({assignedStudentsList.length})</span>
                                </h4>
                              </div>

                              {assignedStudentsList.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 italic">
                                  No students are currently assigned to {mentor.name}.
                                </div>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                  <table className="w-full text-left text-xs font-semibold text-slate-700">
                                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                                      <tr>
                                        <th className="px-4 py-3">Roll No</th>
                                        <th className="px-4 py-3">Student Name</th>
                                        <th className="px-4 py-3">Branch & Section</th>
                                        <th className="px-4 py-3 text-center">CGPA</th>
                                        <th className="px-4 py-3 text-center">Risk Status</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {assignedStudentsList.map((student: any) => {
                                        const sp = student.student_profiles?.[0] || {};
                                        const cgpaVal = sp.cgpa !== undefined && sp.cgpa !== null ? Number(sp.cgpa) : 8.0;
                                        const backlogsVal = sp.backlogs !== undefined && sp.backlogs !== null ? Number(sp.backlogs) : 0;
                                        const risk = getRiskLevel(cgpaVal, backlogsVal);

                                        return (
                                          <tr key={student.id} className="hover:bg-emerald-50/20 transition">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{sp.roll_number || '—'}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900">
                                              <button 
                                                onClick={() => router.push(`/hod/students/${student.id}` as any)}
                                                className="hover:underline hover:text-emerald-700 text-left font-bold"
                                              >
                                                {student.name}
                                              </button>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                              <span className="uppercase font-bold">{sp.branch || '—'}</span>
                                              <span className="text-[10px] text-slate-400 block">Sec {sp.section || '-'} • {getStudentBTechYear(sp)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-black text-slate-800">{cgpaVal.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                                risk === 'High' ? 'bg-rose-100 text-rose-800' :
                                                risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                                'bg-emerald-100 text-emerald-800'
                                              }`}>
                                                {risk}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <button
                                                onClick={() => router.push(`/hod/students/${student.id}` as any)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold transition"
                                              >
                                                <span>View Profile</span>
                                                <ExternalLink className="h-3 w-3" />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2, 3, 4: STUDENTS LIST TABLE */}
            {activeTab !== 'mentors' && (
              <div className="overflow-x-auto w-full rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Roll No</th>
                      <th className="px-5 py-4 font-semibold">Name</th>
                      <th className="px-5 py-4 font-semibold">Branch & Section</th>
                      <th className="px-5 py-4 font-semibold">CGPA</th>
                      <th className="px-5 py-4 font-semibold">Risk</th>
                      <th className="px-5 py-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td className="px-5 py-8 text-slate-500" colSpan={6}>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                            <span>Loading student list…</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td className="px-5 py-8 text-slate-500" colSpan={6}>No students found in this category.</td>
                      </tr>
                    ) : null}
                    {!loading && filteredStudents.map((student) => {
                      const profile = student.student_profiles?.[0] || {};
                      const cgpaVal = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
                      const backlogsVal = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
                      const risk = getRiskLevel(cgpaVal, backlogsVal);

                      const isMine = profile.mentor_id === hodId;
                      const isUnassigned = !profile.mentor_id;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.roll_number || '-'}</td>
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            <button onClick={() => router.push(`/hod/students/${student.id}` as any)} className="hover:underline hover:text-emerald-700 text-left font-semibold focus:outline-none">{student.name}</button>
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            <div className="font-semibold uppercase">{profile.branch || '-'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Sec: {profile.section || '-'} | <span className="font-bold text-emerald-800">{getStudentBTechYear(profile)}</span></div>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-medium">{cgpaVal.toFixed(2)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                              risk === 'High' ? 'bg-rose-100 text-rose-800' : risk === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>{risk}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {isMine ? (
                              <button onClick={() => handleAssign(student.id, false)} className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"><UserMinus className="h-3.5 w-3.5" /><span>Remove</span></button>
                            ) : isUnassigned ? (
                              <button onClick={() => handleAssign(student.id, true)} className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"><UserPlus className="h-3.5 w-3.5" /><span>Assign to Me</span></button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Assigned to other mentor</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>

      </PageShell>
    </ProtectedRoute>
  );
}
