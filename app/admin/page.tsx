'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { 
  Users, UserCheck, ShieldCheck, Building2, ChevronRight, X, 
  Loader2, ExternalLink, Mail, Phone, BookOpen, GraduationCap 
} from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' }
];

const DEFAULT_DEPARTMENTS = ['ECE', 'CSE', 'IT', 'EEE', 'MECH', 'CIVIL'];

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

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    students: 0,
    mentors: 0,
    departments: 0
  });
  const [loading, setLoading] = useState(true);

  // Departments List & Selection Modal State
  const [departmentsList, setDepartmentsList] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'mentors' | 'hod'>('students');

  // Department Roster Data
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allMentors, setAllMentors] = useState<any[]>([]);
  const [allHods, setAllHods] = useState<any[]>([]);
  const [loadingDeptDetails, setLoadingDeptDetails] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        // Fetch student count
        const { count: studentCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // Fetch mentors count
        const { count: mentorCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'faculty');

        // Fetch distinct departments
        const { data: facultyData } = await supabase
          .from('faculty_profiles')
          .select('department');
        const { data: studentData } = await supabase
          .from('student_profiles')
          .select('branch');
        const { data: hodData } = await supabase
          .from('hod_profiles')
          .select('department');

        const deptSet = new Set<string>(DEFAULT_DEPARTMENTS);
        facultyData?.forEach((f) => { if (f.department) deptSet.add(f.department.trim().toUpperCase()); });
        studentData?.forEach((s) => { if (s.branch) deptSet.add(s.branch.trim().toUpperCase()); });
        hodData?.forEach((h) => { if (h.department) deptSet.add(h.department.trim().toUpperCase()); });

        const deptArray = Array.from(deptSet).sort();
        setDepartmentsList(deptArray);

        setStats({
          students: studentCount ?? 0,
          mentors: mentorCount ?? 0,
          departments: deptArray.length
        });
      } catch (err) {
        console.error('Error loading admin stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const openDepartmentDetails = async (dept: string) => {
    setSelectedDept(dept);
    setActiveTab('students');
    setLoadingDeptDetails(true);
    try {
      // 1. Fetch Students in department
      const { data: studentsDb } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id (
            roll_number, branch, section, cgpa, backlogs, academic_year, mentor_id
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      const deptStudents = (studentsDb || []).filter((s: any) => {
        const sp = s.student_profiles?.[0] || {};
        return isBranchInDepartment(sp.branch, dept);
      });

      setAllStudents(deptStudents);

      // 2. Fetch Mentors in department
      const { data: mentorsDb } = await supabase
        .from('users')
        .select(`
          id, name, email,
          faculty_profiles!user_id (
            faculty_id, department, designation, qualification, subjects, contact_number, profile_photo
          )
        `)
        .eq('role', 'faculty')
        .eq('status', 'Approved');

      const deptMentors = (mentorsDb || []).filter((m: any) => {
        const fp = m.faculty_profiles?.[0] || {};
        return isBranchInDepartment(fp.department, dept);
      });

      setAllMentors(deptMentors);

      // 3. Fetch HOD for department
      const { data: hodsDb } = await supabase
        .from('users')
        .select(`
          id, name, email,
          hod_profiles!user_id (
            faculty_id, department, designation, contact_number, profile_photo
          ),
          faculty_profiles!user_id (
            faculty_id, department, designation, contact_number, profile_photo
          )
        `)
        .eq('role', 'hod')
        .eq('status', 'Approved');

      const deptHod = (hodsDb || []).filter((h: any) => {
        const hp = h.hod_profiles?.[0] || {};
        const fp = h.faculty_profiles?.[0] || {};
        return isBranchInDepartment(hp.department || fp.department, dept);
      });

      setAllHods(deptHod);
    } catch (err) {
      console.error('Error fetching department details:', err);
    } finally {
      setLoadingDeptDetails(false);
    }
  };

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Admin Dashboard" subtitle="Manage portal data and analytics">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin" items={adminSidebarItems} />

          <div className="grid gap-6 w-full min-w-0">
            <div className="portal-card">
              <h1 className="text-3xl font-bold">Portal Analytics</h1>
              <p className="mt-2 text-slate-600">
                Administrative controls for users, departments, notifications, and content moderation.
              </p>
            </div>

            {/* Stat Cards Row */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* STUDENTS CARD */}
              <div 
                onClick={() => router.push('/admin/students')}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:shadow-md cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">STUDENTS</span>
                  <div className="h-9 w-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 text-4xl font-black text-slate-900">
                  {loading ? <Loader2 className="h-7 w-7 animate-spin text-slate-400" /> : stats.students}
                </div>
                <p className="mt-2 text-xs font-bold text-emerald-700 group-hover:underline flex items-center gap-1">
                  <span>Manage All Students</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </div>

              {/* MENTORS CARD */}
              <div 
                onClick={() => router.push('/admin/faculty')}
                className="rounded-[28px] border border-slate-200 bg-emerald-50/40 p-6 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:shadow-md cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">MENTORS</span>
                  <div className="h-9 w-9 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition">
                    <UserCheck className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 text-4xl font-black text-slate-900">
                  {loading ? <Loader2 className="h-7 w-7 animate-spin text-slate-400" /> : stats.mentors}
                </div>
                <p className="mt-2 text-xs font-bold text-emerald-800 group-hover:underline flex items-center gap-1">
                  <span>Manage All Mentors</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </div>

              {/* DEPARTMENTS CARD */}
              <div 
                onClick={() => setIsDeptModalOpen(true)}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:shadow-md cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">DEPARTMENTS</span>
                  <div className="h-9 w-9 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 text-4xl font-black text-slate-900">
                  {loading ? <Loader2 className="h-7 w-7 animate-spin text-slate-400" /> : stats.departments}
                </div>
                <p className="mt-2 text-xs font-bold text-teal-700 group-hover:underline flex items-center gap-1">
                  <span>Select Department Roster</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* DEPARTMENT SELECTOR MODAL */}
        {isDeptModalOpen && !selectedDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-emerald-200" />
                    <span>Select Department</span>
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    Click any department to inspect its assigned Students, Mentors, and HOD.
                  </p>
                </div>
                <button
                  onClick={() => setIsDeptModalOpen(false)}
                  className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 backdrop-blur-md transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50">
                {departmentsList.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => openDepartmentDetails(dept)}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-md transition text-center group cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
                      {dept}
                    </div>
                    <span className="text-xs font-black uppercase text-slate-800 group-hover:text-emerald-900">
                      {dept} Department
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">
                      View Roster →
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
                <button
                  onClick={() => setIsDeptModalOpen(false)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-900 px-5 py-2 text-xs font-bold text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEPARTMENT FULL DETAILS MODAL (Students, Mentors & HOD) */}
        {selectedDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col h-[85vh]">
              
              {/* Header */}
              <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shrink-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                      Department View
                    </span>
                    <h3 className="text-2xl font-black">{selectedDept} Department</h3>
                  </div>
                  <p className="text-xs text-emerald-100/90 mt-1">
                    Complete roster of Students, Mentors, and Head of Department for {selectedDept}.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDept(null)}
                  className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 backdrop-blur-md transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 gap-2 pt-3">
                <button
                  onClick={() => setActiveTab('students')}
                  className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'students' 
                      ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl border-t border-x border-slate-200' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="h-4 w-4 text-emerald-700" />
                  <span>Students ({allStudents.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('mentors')}
                  className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'mentors' 
                      ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl border-t border-x border-slate-200' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="h-4 w-4 text-emerald-700" />
                  <span>Faculty Mentors ({allMentors.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('hod')}
                  className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'hod' 
                      ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl border-t border-x border-slate-200' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>HOD ({allHods.length})</span>
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-white">
                {loadingDeptDetails ? (
                  <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                    <span className="text-sm font-semibold">Loading department roster...</span>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: STUDENTS */}
                    {activeTab === 'students' && (
                      <div className="space-y-4">
                        {allStudents.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                            No students registered under {selectedDept} department.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs font-semibold text-slate-700">
                              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Roll No</th>
                                  <th className="px-4 py-3">Student Name</th>
                                  <th className="px-4 py-3">Branch & Section</th>
                                  <th className="px-4 py-3 text-center">CGPA</th>
                                  <th className="px-4 py-3 text-center">Risk Status</th>
                                  <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {allStudents.map((st: any) => {
                                  const sp = st.student_profiles?.[0] || {};
                                  const cgpaVal = sp.cgpa !== null && sp.cgpa !== undefined ? parseFloat(sp.cgpa) : 0;
                                  const backlogsVal = sp.backlogs !== null && sp.backlogs !== undefined ? Number(sp.backlogs) : 0;
                                  const riskLevel = getRiskLevel(cgpaVal, backlogsVal);

                                  return (
                                    <tr key={st.id} className="hover:bg-slate-50/60 transition">
                                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{sp.roll_number || 'N/A'}</td>
                                      <td className="px-4 py-3 font-bold text-slate-900">{st.name}</td>
                                      <td className="px-4 py-3 text-slate-600">
                                        <span className="font-extrabold uppercase text-slate-800">{sp.branch}</span>
                                        {sp.section && <span className="text-slate-400 font-normal"> • Sec {sp.section}</span>}
                                      </td>
                                      <td className="px-4 py-3 text-center font-black text-slate-900">
                                        {cgpaVal > 0 ? cgpaVal.toFixed(2) : 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                          riskLevel === 'Low' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                          riskLevel === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                          'bg-rose-50 border-rose-200 text-rose-800'
                                        }`}>
                                          {riskLevel}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          onClick={() => {
                                            setSelectedDept(null);
                                            setIsDeptModalOpen(false);
                                            router.push(`/admin/students/${st.id}`);
                                          }}
                                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
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
                    )}

                    {/* TAB 2: MENTORS */}
                    {activeTab === 'mentors' && (
                      <div className="space-y-4">
                        {allMentors.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                            No faculty mentors registered under {selectedDept} department.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs font-semibold text-slate-700">
                              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Faculty Name / Email</th>
                                  <th className="px-4 py-3">Mentor ID</th>
                                  <th className="px-4 py-3">Designation</th>
                                  <th className="px-4 py-3">Contact Info</th>
                                  <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {allMentors.map((m: any) => {
                                  const fp = m.faculty_profiles?.[0] || {};
                                  return (
                                    <tr key={m.id} className="hover:bg-slate-50/60 transition">
                                      <td className="px-4 py-3">
                                        <div className="font-bold text-slate-900">{m.name}</div>
                                        <div className="text-[11px] text-slate-500 font-normal">{m.email}</div>
                                      </td>
                                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{fp.faculty_id || 'N/A'}</td>
                                      <td className="px-4 py-3 font-bold text-slate-800">{fp.designation || 'Faculty'}</td>
                                      <td className="px-4 py-3 font-mono text-slate-800">{fp.contact_number || 'N/A'}</td>
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          onClick={() => {
                                            setSelectedDept(null);
                                            setIsDeptModalOpen(false);
                                            router.push(`/admin/faculty/${m.id}` as any);
                                          }}
                                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                                        >
                                          <span>View Mentor Details</span>
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
                    )}

                    {/* TAB 3: HOD */}
                    {activeTab === 'hod' && (
                      <div className="space-y-4">
                        {allHods.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                            No Head of Department assigned to {selectedDept} department.
                          </div>
                        ) : (
                          allHods.map((h: any) => {
                            const hp = h.hod_profiles?.[0] || {};
                            const fp = h.faculty_profiles?.[0] || {};

                            return (
                              <div key={h.id} className="p-6 rounded-3xl border border-emerald-200 bg-emerald-50/40 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-emerald-800 text-white font-black text-lg flex items-center justify-center shrink-0">
                                      {h.name ? h.name.charAt(0).toUpperCase() : 'H'}
                                    </div>
                                    <div>
                                      <h4 className="text-lg font-extrabold text-slate-900">{h.name}</h4>
                                      <p className="text-xs text-slate-500 font-semibold">{h.email}</p>
                                      <span className="inline-flex items-center gap-1 mt-1 rounded-md bg-emerald-700 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase">
                                        HOD • {hp.department || fp.department || selectedDept}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setSelectedDept(null);
                                      setIsDeptModalOpen(false);
                                      router.push(`/admin/hod/${h.id}` as any);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
                                  >
                                    <span>Full HOD Profile</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                                  <div className="p-3 rounded-2xl bg-white border border-slate-100">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Faculty ID</span>
                                    <span className="font-mono font-bold text-slate-800 mt-0.5 block">{hp.faculty_id || fp.faculty_id || 'N/A'}</span>
                                  </div>
                                  <div className="p-3 rounded-2xl bg-white border border-slate-100">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Designation</span>
                                    <span className="font-bold text-slate-800 mt-0.5 block">{hp.designation || fp.designation || 'Head of Department'}</span>
                                  </div>
                                  <div className="p-3 rounded-2xl bg-white border border-slate-100">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Contact Number</span>
                                    <span className="font-mono font-bold text-slate-800 mt-0.5 block">{hp.contact_number || fp.contact_number || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setSelectedDept(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  ← Back to Departments List
                </button>

                <button
                  onClick={() => {
                    setSelectedDept(null);
                    setIsDeptModalOpen(false);
                  }}
                  className="rounded-xl bg-slate-800 hover:bg-slate-900 px-5 py-2 text-xs font-bold text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </PageShell>
    </ProtectedRoute>
  );
}