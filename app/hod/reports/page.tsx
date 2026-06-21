import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';

export default function HodReportsPage() {
  return (
    <ProtectedRoute role="hod">
      <PageShell title="Reports" subtitle="Department exports and analytics">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
        <Sidebar active="/hod/reports" items={[{ href: '/hod', label: 'HOD Dashboard' }, { href: '/hod/profile', label: 'Profile' }, { href: '/hod/students', label: 'Students' }, { href: '/hod/queries', label: 'Student Queries' }, { href: '/hod/reports', label: 'Reports' }]} />
        <div className="portal-card w-full min-w-0">PDF exports, department reports, and backlog summaries will live here.</div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}