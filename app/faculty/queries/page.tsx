import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { queries } from '@/lib/mock-data';

export default function FacultyQueriesPage() {
  return (
    <PageShell title="Student Queries" subtitle="Mentor response queue">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/faculty" items={[{ href: '/faculty', label: 'Profile' }, { href: '/faculty/students', label: 'My Students' }, { href: '/faculty/queries', label: 'Student Queries' }, { href: '/faculty/notes', label: 'Mentor Notes' }]} />
        <div className="portal-card overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-portal-line bg-slate-50 text-sm uppercase tracking-[0.08em] text-slate-500">
                <th className="p-3">Query ID</th><th className="p-3">Student</th><th className="p-3">Type</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((query, index) => (
                <tr key={query.id} className="border-b border-portal-line/70">
                  <td className="p-3">{query.id}</td>
                  <td className="p-3">{['Rahul Sharma', 'Sneha Patel', 'Arjun Reddy'][index]}</td>
                  <td className="p-3">{query.type}</td>
                  <td className="p-3">{query.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}