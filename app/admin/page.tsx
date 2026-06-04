import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';

export default function AdminPage() {
  return (
    <ProtectedRoute role="admin">
      <PageShell title="Admin Dashboard" subtitle="Manage portal data and analytics">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/admin" items={[{ href: '/admin', label: 'Overview' }, { href: '/admin/pending', label: 'Pending Approvals' }]} />
        <div className="grid gap-6">
          <div className="portal-card">
            <h1 className="text-3xl font-bold">Portal Analytics</h1>
            <p className="mt-2 text-slate-600">Administrative controls for users, departments, notifications, and content moderation.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            <StatCard title="Students" value="864" tone="neutral" />
            <StatCard title="Faculty" value="62" tone="green" />
            <StatCard title="Departments" value="8" tone="neutral" />
            <StatCard title="Pending Tasks" value="19" tone="orange" />
          </div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}