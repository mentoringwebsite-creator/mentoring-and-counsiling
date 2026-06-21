import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';

export default function HodPage() {
  return (
    <ProtectedRoute role="hod">
      <PageShell title="HOD Dashboard" subtitle="Department analytics and reports">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
        <Sidebar active="/hod" items={[{ href: '/hod', label: 'HOD Dashboard' }, { href: '/hod/profile', label: 'Profile' }, { href: '/hod/students', label: 'Students' }, { href: '/hod/queries', label: 'Student Queries' }, { href: '/hod/reports', label: 'Reports' }]} />
        <div className="grid gap-6 w-full min-w-0">
          <div className="portal-card grid gap-4 md:grid-cols-[1fr_1fr]">
            <div>
              <h1 className="text-3xl font-bold">Welcome, Dr. D. Mohan</h1>
              <p className="mt-2 text-slate-600">Professor & HOD, ECM Department</p>
              <p className="mt-4 text-slate-700">Department-level overview with student risk detection, backlog trends, and faculty performance.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Total Students" value="120" tone="neutral" />
              <StatCard title="Average CGPA" value="7.6" tone="green" />
              <StatCard title="Active Backlogs" value="62" tone="orange" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard title="High Risk Students" value="18" tone="red" />
            <StatCard title="Reports Generated" value="14" tone="neutral" />
            <StatCard title="Faculty Coverage" value="100%" tone="green" />
          </div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}