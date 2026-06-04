import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { queries } from '@/lib/mock-data';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function QueriesPage() {
  return (
    <ProtectedRoute role="student">
      <PageShell title="Problems & Queries" subtitle="Raise and track support requests">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/student/queries" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
        <div className="grid gap-6">
          <div className="portal-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Recent Queries</h2>
              <button className="rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white">+ Raise New Query</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-portal-line bg-slate-50 text-sm uppercase tracking-[0.08em] text-slate-500">
                    <th className="p-3">Query ID</th><th className="p-3">Type</th><th className="p-3">Subject</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((query) => (
                    <tr key={query.id} className="border-b border-portal-line/70">
                      <td className="p-3">{query.id}</td>
                      <td className="p-3">{query.type}</td>
                      <td className="p-3">{query.subject}</td>
                      <td className="p-3">{query.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}