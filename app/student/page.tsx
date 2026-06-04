'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { StudentCharts } from '@/components/charts/student-charts';
import { cgpaSeries, attendanceSeries, queries, studentSummary } from '@/lib/mock-data';
import { getRiskLevel } from '@/lib/risk';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';

const studentSidebarItems = [
  { href: '/student', label: 'Student Dashboard' },
  { href: '/student/profile', label: 'Profile' },
  { href: '/student/academic', label: 'Academic Profile' },
  { href: '/student/extracurricular', label: 'Extracurricular Activities' },
  { href: '/student/queries', label: 'Problems / Queries' }
];

export default function StudentPage() {
  const [profile, setProfile] = useState({
    name: studentSummary.name,
    rollNumber: studentSummary.rollNumber,
    branch: studentSummary.branch,
    section: studentSummary.section,
    mentor: studentSummary.mentor,
    cgpa: studentSummary.cgpa,
    backlogs: studentSummary.backlogs,
    attendance: studentSummary.attendance,
    sgpa: studentSummary.sgpa,
    photo: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const userId = session.user.id;

        // Fetch name from users table
        const { data: userDb } = await supabase
          .from('users')
          .select('name')
          .eq('id', userId)
          .single();

        // Fetch student profile details
        const { data: profileDb } = await supabase
          .from('student_profiles')
          .select('roll_number, branch, section, phone, profile_photo')
          .eq('user_id', userId)
          .single();

        if (profileDb) {
          setProfile((prev) => ({
            ...prev,
            name: userDb?.name || prev.name,
            rollNumber: profileDb.roll_number || prev.rollNumber,
            branch: profileDb.branch || prev.branch,
            section: profileDb.section || prev.section,
            photo: profileDb.profile_photo || ''
          }));
        }
      } catch (err) {
        console.error('Error loading student dashboard details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentProfile();
  }, []);

  const risk = getRiskLevel(profile.cgpa, profile.backlogs);

  return (
    <ProtectedRoute role="student">
      <PageShell title="Student Dashboard" subtitle="Student Enhancement & Counselling Portal">
        <div className="grid gap-6 px-5 py-5 md:px-8 md:py-8 xl:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar active="/student" items={studentSidebarItems} />
          
          <div className="grid gap-6 xl:min-w-0">
            <div className="portal-card grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="grid gap-6 md:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
                <div className="rounded-3xl bg-[linear-gradient(180deg,#f0f6f3,#e7f0eb)] p-4">
                  <div className="grid h-full min-h-[280px] place-items-center rounded-3xl bg-white/80 text-center text-portal-ink overflow-hidden p-6">
                    {profile.photo ? (
                      <img 
                        src={profile.photo} 
                        alt={profile.name} 
                        className="h-48 w-48 rounded-full object-cover border-4 border-emerald-500/20 shadow-md"
                      />
                    ) : (
                      <div>
                        <div className="text-3xl font-bold">{profile.name}</div>
                        <div className="mt-2 text-sm text-slate-600">{profile.rollNumber}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Profile Summary</h1>
                  <div className="mt-3 grid gap-2 text-slate-700">
                    <div><strong>Name:</strong> {profile.name}</div>
                    <div><strong>Roll Number:</strong> {profile.rollNumber}</div>
                    <div><strong>Branch:</strong> {profile.branch}</div>
                    <div><strong>Section:</strong> {profile.section}</div>
                    <div><strong>Mentor:</strong> {profile.mentor}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 xl:w-full">
                <StatCard title="CGPA" value={profile.cgpa.toFixed(2)} tone="green" />
                <StatCard title="Backlogs" value={String(profile.backlogs)} tone={profile.backlogs > 0 ? 'orange' : 'green'} />
                <StatCard title="Risk Level" value={risk} tone={risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green'} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4 xl:grid-cols-4">
              <StatCard title="Attendance" value={`${profile.attendance}%`} hint="Current month" tone="green" />
              <StatCard title="SGPA" value={profile.sgpa.toFixed(1)} hint="Latest semester" tone="neutral" />
              <StatCard title="Mentor Messages" value="12" hint="Unread and recent" tone="orange" />
              <StatCard title="Certificates" value="8" hint="Uploaded assets" tone="neutral" />
            </div>

            <StudentCharts cgpaData={cgpaSeries} attendanceData={attendanceSeries} />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="portal-card">
                <h2 className="text-xl font-semibold">Recent Queries</h2>
                <div className="mt-4 grid gap-3">
                  {queries.map((query) => (
                    <div key={query.id} className="flex items-center justify-between rounded-2xl bg-portal-paper p-4">
                      <div>
                        <div className="font-semibold">{query.subject}</div>
                        <div className="text-sm text-slate-600">{query.id}, {query.type}</div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold">{query.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="portal-card">
                <h2 className="text-xl font-semibold">Placement & Internship Tracking</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <StatCard title="Applications" value="14" tone="neutral" />
                  <StatCard title="Interviews" value="3" tone="orange" />
                  <StatCard title="Resume Status" value="Uploaded" tone="green" />
                  <StatCard title="Internships" value="2" tone="green" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}