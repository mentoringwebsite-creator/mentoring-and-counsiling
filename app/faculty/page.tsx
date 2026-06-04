import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';

export default function FacultyPage() {
  return (
    <ProtectedRoute role="faculty">
      <PageShell title="Faculty Dashboard" subtitle="Mentoring, monitoring, and query handling">
      <div className="grid gap-6 px-5 py-5 md:px-8 md:py-8 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar active="/faculty" items={[{ href: '/faculty', label: 'Faculty Dashboard' }, { href: '/faculty/profile', label: 'Profile' }, { href: '/faculty/students', label: 'My Students' }, { href: '/faculty/queries', label: 'Student Queries' }, { href: '/faculty/notes', label: 'Mentor Notes' }]} />
        <div className="grid gap-6 xl:min-w-0">
          <div className="portal-card grid gap-4 xl:grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold">Dr. Suresh Kumar</h1>
              <p className="mt-2 text-slate-600">Associate Professor, ECM Department</p>
              <p className="mt-4 text-slate-700">Faculty dashboard for student risk monitoring, query management, and academic insights.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <StatCard title="Assigned Students" value="42" tone="neutral" />
              <StatCard title="Open Queries" value="5" tone="orange" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-3">
            <StatCard title="Average CGPA" value="7.6" tone="green" />
            <StatCard title="High Risk Students" value="18" tone="red" />
            <StatCard title="Mentor Notes" value="24" tone="neutral" />
          </div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}