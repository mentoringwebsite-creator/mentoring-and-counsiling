'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { Loader2 } from 'lucide-react';

export default function HodPage() {
  const [loading, setLoading] = useState(true);
  const [hodName, setHodName] = useState('HOD User');
  const [hodDesignation, setHodDesignation] = useState('Professor & HOD');
  const [hodDept, setHodDept] = useState('');
  
  // Dashboard stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [avgCgpa, setAvgCgpa] = useState(0);
  const [totalBacklogs, setTotalBacklogs] = useState(0);
  const [highRiskStudents, setHighRiskStudents] = useState(0);
  const [reportsGenerated, setReportsGenerated] = useState(0);
  const [facultyCoverage, setFacultyCoverage] = useState(100);

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      // 1. Fetch HOD name from users table
      const { data: userDb } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (userDb) {
        setHodName(userDb.name);
      }

      // 2. Get HOD profile to determine designation and department
      const { data: hodProfile } = await supabase
        .from('hod_profiles')
        .select('designation, department')
        .eq('user_id', userId)
        .single();

      const dept = hodProfile?.department || '';
      setHodDept(dept);
      if (hodProfile?.designation) {
        setHodDesignation(hodProfile.designation);
      }

      // 3. Fetch approved faculty in HOD's department
      const { data: facultyDb, error: fError } = await supabase
        .from('users')
        .select(`
          id,
          faculty_profiles!user_id (department)
        `)
        .eq('role', 'faculty')
        .eq('status', 'Approved');

      if (fError) throw fError;

      const deptFaculty = (facultyDb || []).filter((f) => {
        const fDept = f.faculty_profiles?.[0]?.department;
        if (!dept || !fDept) return false;
        return fDept.toLowerCase().trim() === dept.toLowerCase().trim();
      });

      const deptFacultyIds = deptFaculty.map((f) => f.id);

      // 4. Fetch approved students
      const { data: studentsDb, error: sError } = await supabase
        .from('users')
        .select(`
          id,
          student_profiles!user_id (
            branch, cgpa, backlogs, mentor_id
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
        const mentorInDept = mentorId && deptFacultyIds.includes(mentorId);

        if (!dept) return true;
        return branchMatches || mentorInDept;
      });

      // Calculate stats
      const totalCount = deptStudents.length;
      setTotalStudents(totalCount);

      if (totalCount > 0) {
        // Average CGPA
        const totalCgpa = deptStudents.reduce((sum, s) => {
          const profile = s.student_profiles?.[0] || {};
          const cgpa = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
          return sum + cgpa;
        }, 0);
        setAvgCgpa(totalCgpa / totalCount);

        // Total Backlogs
        const totalB = deptStudents.reduce((sum, s) => {
          const profile = s.student_profiles?.[0] || {};
          const backlogs = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
          return sum + backlogs;
        }, 0);
        setTotalBacklogs(totalB);

        // High Risk Students
        const highRisk = deptStudents.filter((s) => {
          const profile = s.student_profiles?.[0] || {};
          const cgpa = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
          const backlogs = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
          return getRiskLevel(cgpa, backlogs) === 'High';
        }).length;
        setHighRiskStudents(highRisk);

        // Faculty coverage
        const assignedCount = deptStudents.filter((s) => s.student_profiles?.[0]?.mentor_id).length;
        setFacultyCoverage(Math.round((assignedCount / totalCount) * 100));
      } else {
        setAvgCgpa(0);
        setTotalBacklogs(0);
        setHighRiskStudents(0);
        setFacultyCoverage(100);
      }

      // 5. Fetch student queries to determine reports generated (we use Resolved student queries as dynamic reports indicator)
      const studentUserIds = deptStudents.map((s) => s.id);
      if (studentUserIds.length > 0) {
        const { data: queriesDb } = await supabase
          .from('queries')
          .select('status')
          .in('student_id', studentUserIds);

        const resolvedQueries = queriesDb?.filter((q) => q.status === 'Resolved').length || 0;
        setReportsGenerated(resolvedQueries);
      } else {
        setReportsGenerated(0);
      }

    } catch (err: any) {
      console.error('Error loading HOD dashboard stats:', err);
      setFeedback(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <ProtectedRoute role="hod">
      <PageShell title="HOD Dashboard" subtitle={`${hodDept ? `${hodDept} Department` : 'Department Analytics'}`}>
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/hod" items={[{ href: '/hod', label: 'HOD Dashboard' }, { href: '/hod/profile', label: 'Profile' }, { href: '/hod/students', label: 'Students' }, { href: '/hod/queries', label: 'Student Queries' }, { href: '/hod/reports', label: 'Reports' }]} />
          
          <div className="grid gap-6 w-full min-w-0">
            {feedback && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800 shadow-sm">
                {feedback}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#1c5644] mr-2" />
                <span>Loading department dashboard...</span>
              </div>
            ) : (
              <>
                <div className="portal-card grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 leading-tight">Welcome, {hodName}</h1>
                    <p className="mt-2 text-sm text-slate-600 font-bold">
                      {hodDesignation || 'Professor & HOD'}{hodDept ? `, ${hodDept} Department` : ''}
                    </p>
                    <p className="mt-4 text-xs text-slate-605 leading-relaxed font-medium">
                      Department-level overview with student risk detection, backlog trends, and faculty mentoring performance.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard title="Total Students" value={totalStudents.toString()} tone="neutral" />
                    <StatCard title="Average CGPA" value={avgCgpa > 0 ? avgCgpa.toFixed(2) : '0.00'} tone="green" />
                    <StatCard title="Active Backlogs" value={totalBacklogs.toString()} tone="orange" />
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard title="High Risk Students" value={highRiskStudents.toString()} tone="red" />
                  <StatCard title="Reports Generated" value={reportsGenerated.toString()} tone="neutral" hint="Resolved student queries" />
                  <StatCard title="Faculty Coverage" value={`${facultyCoverage}%`} tone="green" hint="Students assigned a mentor" />
                </div>
              </>
            )}
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}