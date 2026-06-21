'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { Loader2 } from 'lucide-react';

const facultySidebarItems = [
  { href: '/faculty', label: 'Faculty Dashboard' },
  { href: '/faculty/profile', label: 'Profile' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/notes', label: 'Mentor Notes' }
];

export default function FacultyPage() {
  const [facultyName, setFacultyName] = useState<string>('Loading...');
  const [facultyMeta, setFacultyMeta] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [avgCgpa, setAvgCgpa] = useState<string>('0.00');
  const [highRiskCount, setHighRiskCount] = useState<number>(0);
  const [openQueriesCount, setOpenQueriesCount] = useState<number>(0);
  const [notesCount, setNotesCount] = useState<number>(0);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const facultyId = session.user.id;

        // 1. Fetch user display name
        const { data: userDb } = await supabase
          .from('users')
          .select('name')
          .eq('id', facultyId)
          .single();

        // 2. Fetch faculty details (designation, department)
        const { data: facultyDb } = await supabase
          .from('faculty_profiles')
          .select('designation, department')
          .eq('user_id', facultyId)
          .single();

        const name = userDb?.name || session.user.user_metadata?.name || 'Faculty Member';
        const designation = facultyDb?.designation || 'Faculty Mentor';
        const department = facultyDb?.department || '';
        
        setFacultyName(name);
        setFacultyMeta(department ? `${designation}, ${department}` : designation);

        // 3. Fetch students assigned to this faculty
        const { data: studentsDb, error: studentsError } = await supabase
          .from('users')
          .select(`
            id, name,
            student_profiles!user_id (
              mentor_id, cgpa, backlogs
            )
          `)
          .eq('role', 'student')
          .eq('status', 'Approved');

        if (studentsError) throw studentsError;

        const myStudents = studentsDb?.filter(
          (s: any) => s.student_profiles?.[0]?.mentor_id === facultyId
        ) || [];

        const assigned = myStudents.length;
        setAssignedCount(assigned);

        // Compute average CGPA and high risk count
        if (assigned > 0) {
          let totalCgpa = 0;
          let highRisk = 0;
          
          myStudents.forEach((s: any) => {
            const profile = s.student_profiles?.[0] || {};
            const cgpa = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
            const backlogs = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
            totalCgpa += cgpa;

            const risk = getRiskLevel(cgpa, backlogs);
            if (risk === 'High') {
              highRisk++;
            }
          });

          setAvgCgpa((totalCgpa / assigned).toFixed(2));
          setHighRiskCount(highRisk);
        } else {
          setAvgCgpa('0.00');
          setHighRiskCount(0);
        }

        // 4. Fetch open queries count for assigned students
        if (assigned > 0) {
          const studentIds = myStudents.map((s: any) => s.id);
          const { data: queriesDb, error: queriesError } = await supabase
            .from('queries')
            .select('id, status, student_id');

          if (!queriesError && queriesDb) {
            const pendingQueries = queriesDb.filter((q: any) => 
              (q.status === 'Pending' || q.status === 'In Review') &&
              studentIds.includes(q.student_id)
            );
            setOpenQueriesCount(pendingQueries.length);
          } else {
            setOpenQueriesCount(0);
          }
        } else {
          setOpenQueriesCount(0);
        }

        // 5. Notes count - defaulted to 0 since there is no DB table for notes
        setNotesCount(0);

      } catch (err) {
        console.error('Error loading faculty dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <ProtectedRoute role="faculty">
      <PageShell title="Faculty Dashboard" subtitle="Mentoring, monitoring, and query handling">
        <div className="grid gap-6 px-5 py-5 md:px-8 md:py-8 xl:grid-cols-[300px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty" items={facultySidebarItems} />
          
          <div className="grid gap-6 w-full min-w-0">
            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading dashboard data…</span>
                </div>
              </div>
            ) : (
              <>
                <div className="portal-card grid gap-4 xl:grid-cols-2">
                  <div>
                    <h1 className="text-3xl font-bold">{facultyName}</h1>
                    <p className="mt-2 text-slate-600">{facultyMeta}</p>
                    <p className="mt-4 text-slate-700">
                      Faculty dashboard for student risk monitoring, query management, and academic insights.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                    <StatCard title="Assigned Students" value={assignedCount.toString()} tone="neutral" />
                    <StatCard title="Open Queries" value={openQueriesCount.toString()} tone="orange" />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-3">
                  <StatCard title="Average CGPA" value={avgCgpa} tone="green" />
                  <StatCard title="High Risk Students" value={highRiskCount.toString()} tone="red" />
                  <StatCard title="Mentor Notes" value={notesCount.toString()} tone="neutral" />
                </div>
              </>
            )}
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}