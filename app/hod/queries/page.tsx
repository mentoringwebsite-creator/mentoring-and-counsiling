import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';

export default function HodQueriesPage() {
  return (
    <ProtectedRoute role="hod">
      <PageShell title="Student Queries" subtitle="Department query watchlist">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/hod" items={[{ href: '/hod', label: 'Profile' }, { href: '/hod/students', label: 'Students' }, { href: '/hod/queries', label: 'Student Queries' }, { href: '/hod/reports', label: 'Reports' }]} />
        <div className="portal-card">Query escalation and response workflow will live here.</div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}