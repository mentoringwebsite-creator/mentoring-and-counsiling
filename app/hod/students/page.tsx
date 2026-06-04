import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';

export default function HodStudentsPage() {
  return (
    <ProtectedRoute role="hod">
      <PageShell title="Students" subtitle="Department-level roster">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/hod/students" items={[{ href: '/hod', label: 'HOD Dashboard' }, { href: '/hod/profile', label: 'Profile' }, { href: '/hod/students', label: 'Students' }, { href: '/hod/queries', label: 'Student Queries' }, { href: '/hod/reports', label: 'Reports' }]} />
        <div className="portal-card">
          Department student lists and filters go here.
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}