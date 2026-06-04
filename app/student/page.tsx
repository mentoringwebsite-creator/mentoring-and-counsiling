import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { StudentCharts } from '@/components/charts/student-charts';
import { cgpaSeries, attendanceSeries, queries, studentSummary } from '@/lib/mock-data';
import { getRiskLevel } from '@/lib/risk';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function StudentPage() {
  const risk = getRiskLevel(studentSummary.cgpa, studentSummary.backlogs);

  return (
    <ProtectedRoute role="student">
      <PageShell title="Student Dashboard" subtitle="Student Enhancement & Counselling Portal">
        <div className="grid gap-6 px-5 py-5 md:px-8 md:py-8 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar active="/student" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
        <div className="grid gap-6 xl:min-w-0">
          <div className="portal-card grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="grid gap-6 md:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
              <div className="rounded-3xl bg-[linear-gradient(180deg,#f0f6f3,#e7f0eb)] p-4">
                <div className="grid h-full min-h-[280px] place-items-center rounded-3xl bg-white/80 text-center text-portal-ink">
                  <div>
                    <div className="text-3xl font-bold">{studentSummary.name}</div>
                    <div className="mt-2 text-sm text-slate-600">{studentSummary.rollNumber}</div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <div className="mt-3 grid gap-2 text-slate-700">
                  <div><strong>Name:</strong> {studentSummary.name}</div>
                  <div><strong>Roll Number:</strong> {studentSummary.rollNumber}</div>
                  <div><strong>Branch:</strong> {studentSummary.branch}</div>
                  <div><strong>Section:</strong> {studentSummary.section}</div>
                  <div><strong>Mentor:</strong> {studentSummary.mentor}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 xl:w-full">
              <StatCard title="CGPA" value={studentSummary.cgpa.toFixed(2)} tone="green" />
              <StatCard title="Backlogs" value={String(studentSummary.backlogs)} tone={studentSummary.backlogs > 0 ? 'orange' : 'green'} />
              <StatCard title="Risk Level" value={risk} tone={risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green'} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4 xl:grid-cols-4">
            <StatCard title="Attendance" value={`${studentSummary.attendance}%`} hint="Current month" tone="green" />
            <StatCard title="SGPA" value={studentSummary.sgpa.toFixed(1)} hint="Latest semester" tone="neutral" />
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