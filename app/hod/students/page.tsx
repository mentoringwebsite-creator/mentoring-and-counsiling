'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { Loader2, Search, ChevronDown, ChevronUp, GraduationCap, Users, UserMinus, ShieldAlert, Award, Phone } from 'lucide-react';
import { StudentDetailsModal } from '@/components/student-details-modal';
import { FacultyDetailsModal } from '@/components/faculty-details-modal';

export default function HodStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [hodDept, setHodDept] = useState<string>('');
  const [faculty, setFaculty] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track which faculty cards are expanded
  const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);
  const [unassignedExpanded, setUnassignedExpanded] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getStudentBTechYear = (profile: any) => {
    const acYear = profile?.academic_year || '';
    const roll = profile?.roll_number || '';
    const acYearStr = String(acYear).toLowerCase();
    if (acYearStr.includes('1') || acYearStr.includes('i year') || acYearStr.includes('first')) return 'I Year';
    if (acYearStr.includes('2') || acYearStr.includes('ii year') || acYearStr.includes('second')) return 'II Year';
    if (acYearStr.includes('3') || acYearStr.includes('iii year') || acYearStr.includes('third')) return 'III Year';
    if (acYearStr.includes('4') || acYearStr.includes('iv year') || acYearStr.includes('fourth')) return 'IV Year';

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
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      // 1. Get HOD profile to determine department
      const { data: hodProfile } = await supabase
        .from('hod_profiles')
        .select('department')
        .eq('user_id', userId)
        .single();

      const dept = hodProfile?.department || '';
      setHodDept(dept);

      // 2. Fetch approved faculty
      const { data: facultyDb, error: fError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          faculty_profiles!user_id (
            designation, department, contact_number
          )
        `)
        .eq('role', 'faculty')
        .eq('status', 'Approved');

      if (fError) throw fError;

      // Filter faculty by HOD's department
      const deptFaculty = (facultyDb || []).filter((f) => {
        const fDept = f.faculty_profiles?.[0]?.department;
        if (!dept || !fDept) return true;
        return fDept.toLowerCase().trim() === dept.toLowerCase().trim();
      });

      setFaculty(deptFaculty);

      // 3. Fetch approved students
      const { data: studentsDb, error: sError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id (
            roll_number, branch, section, phone, mentor_id, cgpa, backlogs
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (sError) throw sError;

      // Filter students by HOD's department (branch matches department) OR if they are assigned to a mentor in the department
      const deptStudents = (studentsDb || []).filter((s) => {
        const profile = s.student_profiles?.[0] || {};
        const sBranch = profile.branch;
        const mentorId = profile.mentor_id;

        const branchMatches = sBranch && dept && sBranch.toLowerCase().trim() === dept.toLowerCase().trim();
        const mentorInDept = mentorId && deptFaculty.some((f) => f.id === mentorId);

        if (!dept) return true;
        return branchMatches || mentorInDept;
      });

      setStudents(deptStudents);

    } catch (err: any) {
      console.error('Error loading HOD roster:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load roster data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpandFaculty = (id: string) => {
    setExpandedFacultyId(expandedFacultyId === id ? null : id);
  };

  // Group students under their respective faculty
  const getStudentsForFaculty = (facultyId: string) => {
    return students.filter((s) => {
      const profile = s.student_profiles?.[0] || {};
      return profile.mentor_id === facultyId;
    });
  };

  // Get unassigned students list
  const getUnassignedStudents = () => {
    return students.filter((s) => {
      const profile = s.student_profiles?.[0] || {};
      return !profile.mentor_id;
    });
  };

  // Apply search query filter
  const matchesSearch = (item: any) => {
    if (!searchQuery) return true;
    const name = (item.name || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    const roll = (item.student_profiles?.[0]?.roll_number || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || roll.includes(q);
  };

  const unassignedStudents = getUnassignedStudents().filter(matchesSearch);

  return (
    <ProtectedRoute role="hod">
      <PageShell title="Department Roster" subtitle={`${hodDept ? `${hodDept} Department` : 'Mentoring Overview'}`}>
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/hod/students" items={[{ href: '/hod', label: 'HOD Dashboard' }, { href: '/hod/profile', label: 'Profile' }, { href: '/hod/students', label: 'Students' }, { href: '/hod/queries', label: 'Student Queries' }, { href: '/hod/reports', label: 'Reports' }]} />
          
          <div className="space-y-6 w-full min-w-0">
            {/* Header info */}
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Faculty Mentoring & Assignments</h2>
              <p className="mt-2 text-slate-600">Review department mentors, inspect their assigned students, and track unassigned student counts.</p>
            </div>

            {feedback && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800 shadow-sm">
                {feedback.message}
              </div>
            )}

            {/* Search filter */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student / faculty name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-600 focus:outline-none shadow-sm"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#1c5644] mr-2" />
                <span>Loading department roster...</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Unassigned Students Card (Highlighted) */}
                <div className="overflow-hidden rounded-[28px] border border-orange-200 bg-orange-50/20 shadow-sm transition duration-300">
                  <button 
                    onClick={() => setUnassignedExpanded(!unassignedExpanded)}
                    className="flex w-full items-center justify-between p-5 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-800 shadow-sm shrink-0">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-orange-950">Unassigned Students</h3>
                        <p className="text-xs text-orange-700/80 font-medium">Students currently needing a mentor assignment</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-orange-100 px-3.5 py-1 text-xs font-bold text-orange-800 border border-orange-200">
                        {unassignedStudents.length} Students
                      </span>
                      {unassignedExpanded ? <ChevronUp className="h-5 w-5 text-orange-800" /> : <ChevronDown className="h-5 w-5 text-orange-800" />}
                    </div>
                  </button>

                  {unassignedExpanded && (
                    <div className="border-t border-orange-200/50 bg-white p-5">
                      {unassignedStudents.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-3 text-center">No unassigned students found.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 font-bold text-slate-700">
                              <tr>
                                <th className="px-4 py-3">Roll No</th>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Branch & Sec</th>
                                <th className="px-4 py-3">CGPA</th>
                                <th className="px-4 py-3">Risk Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {unassignedStudents.map((s) => {
                                const profile = s.student_profiles?.[0] || {};
                                const cgpaVal = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
                                const backlogsVal = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
                                const risk = getRiskLevel(cgpaVal, backlogsVal);

                                return (
                                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{profile.roll_number || '-'}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                      <button 
                                        onClick={() => setSelectedStudentId(s.id)}
                                        className="hover:underline hover:text-emerald-700 text-left font-semibold focus:outline-none"
                                      >
                                        {s.name}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                      <span className="uppercase">{profile.branch || '-'}</span> | Sec {profile.section || '-'} | <span className="font-bold text-emerald-800">{getStudentBTechYear(profile)}</span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">{cgpaVal.toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        risk === 'High' ? 'bg-rose-100 text-rose-800' :
                                        risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                        'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {risk}
                                      </span>
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
                </div>

                {/* 2. Faculty list with assigned students */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
                    <GraduationCap className="h-5.5 w-5.5 text-emerald-800" />
                    <span>Faculty Mentors ({faculty.length})</span>
                  </h3>

                  {faculty.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-6 text-center bg-slate-50 rounded-3xl border border-slate-200">
                      No approved faculty mentors found in this department.
                    </p>
                  ) : (
                    faculty.map((mentor) => {
                      const mentorProfile = mentor.faculty_profiles?.[0] || {};
                      const mentorStudents = getStudentsForFaculty(mentor.id).filter(matchesSearch);
                      const isExpanded = expandedFacultyId === mentor.id;

                      return (
                        <div 
                          key={mentor.id} 
                          className={`overflow-hidden rounded-[28px] border transition duration-300 bg-white ${
                            isExpanded ? 'border-emerald-700/40 shadow-soft' : 'border-slate-200 shadow-sm hover:shadow-soft'
                          }`}
                        >
                          <button
                            onClick={() => toggleExpandFaculty(mentor.id)}
                            className="flex w-full items-center justify-between p-5 text-left focus:outline-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 shadow-sm shrink-0">
                                <GraduationCap className="h-5.5 w-5.5" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-slate-900">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFacultyId(mentor.id);
                                    }}
                                    className="hover:underline hover:text-emerald-700 text-left font-bold focus:outline-none"
                                  >
                                    {mentor.name}
                                  </button>
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">
                                  {mentorProfile.designation || 'Faculty Mentor'} | {mentor.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-100">
                                {mentorStudents.length} Assigned Students
                              </span>
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-slate-100 p-5 bg-slate-50/20">
                              {mentorStudents.length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-4 text-center">No students currently assigned to this mentor.</p>
                              ) : (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="bg-slate-50 font-bold text-slate-700">
                                      <tr>
                                        <th className="px-4 py-3.5">Roll No</th>
                                        <th className="px-4 py-3.5">Student Name</th>
                                        <th className="px-4 py-3.5">Section & Year</th>
                                        <th className="px-4 py-3.5">Contact Number</th>
                                        <th className="px-4 py-3.5">CGPA</th>
                                        <th className="px-4 py-3.5">Risk Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {mentorStudents.map((student) => {
                                        const profile = student.student_profiles?.[0] || {};
                                        const cgpaVal = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
                                        const backlogsVal = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
                                        const risk = getRiskLevel(cgpaVal, backlogsVal);

                                        return (
                                          <tr key={student.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-700">{profile.roll_number || '-'}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                              <button 
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className="hover:underline hover:text-emerald-700 text-left font-semibold focus:outline-none"
                                              >
                                                {student.name}
                                              </button>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">Sec {profile.section || '-'} | <span className="font-bold text-emerald-800">{getStudentBTechYear(profile)}</span></td>
                                            <td className="px-4 py-3 text-slate-600 font-mono">{profile.phone || '-'}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{cgpaVal.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                                risk === 'High' ? 'bg-rose-100 text-rose-800' :
                                                risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                                'bg-emerald-100 text-emerald-800'
                                              }`}>
                                                {risk}
                                              </span>
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
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
        
        <StudentDetailsModal 
          studentUserId={selectedStudentId}
          isOpen={selectedStudentId !== null}
          onClose={() => setSelectedStudentId(null)}
        />

        <FacultyDetailsModal 
          facultyUserId={selectedFacultyId}
          isOpen={selectedFacultyId !== null}
          onClose={() => setSelectedFacultyId(null)}
        />
      </PageShell>
    </ProtectedRoute>
  );
}