import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';

export default function FacultyNotesPage() {
  return (
    <ProtectedRoute role="faculty">
      <PageShell title="Mentor Notes" subtitle="Internal observations and follow-ups">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
        <Sidebar active="/faculty/notes" items={[{ href: '/faculty', label: 'My Dashboard' }, { href: '/faculty/students', label: 'My Students' }, { href: '/faculty/queries', label: 'Student Queries' }]} />
        <div className="portal-card grid gap-4 w-full min-w-0">
          <div className="rounded-3xl bg-portal-paper p-5">Student needs extra support in DBMS and attendance monitoring.</div>
          <div className="rounded-3xl bg-portal-paper p-5">Placed follow-up for scholarship verification and fee clarification.</div>
          <div className="rounded-3xl bg-portal-paper p-5">Discussed internship options and resume review in last meeting.</div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}