import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { ProtectedRoute } from '@/components/auth/protected-route';

const rows = [
  ['C Programming', '18', '19', '84', '9'],
  ['C Lab', '20', '20', '95', '10'],
  ['Physics', '17', '18', '76', '8'],
  ['English', '16', '18', '74', '8'],
  ['Math-1', '19', '20', '88', '9'],
  ['DBMS', '18', '17', '80', '8']
];

export default function AcademicPage() {
  return (
    <ProtectedRoute role="student">
      <PageShell title="Academic Profile" subtitle="Semester overview and performance analytics">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/student/academic" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div className="portal-card overflow-x-auto">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">Semester 1</h2>
                <div className="flex gap-3 text-sm">
                  <span className="rounded-2xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">SGPA 8</span>
                  <span className="rounded-2xl bg-sky-50 px-3 py-2 font-semibold text-sky-700">CGPA 8.12</span>
                  <span className="rounded-2xl bg-rose-50 px-3 py-2 font-semibold text-rose-700">Backlogs 1</span>
                </div>
              </div>
              <table className="mt-4 w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-portal-line bg-slate-50 text-sm uppercase tracking-[0.08em] text-slate-500">
                    <th className="p-3">Subject</th><th className="p-3">Mid-1</th><th className="p-3">Mid-2</th><th className="p-3">Semester</th><th className="p-3">Subject GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row[0]} className="border-b border-portal-line/70">
                      {row.map((cell, index) => <td key={cell + index} className="p-3">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4">
              <StatCard title="SGPA" value="8.0" tone="green" />
              <StatCard title="CGPA" value="8.12" tone="neutral" />
              <StatCard title="Risk" value="Low" tone="green" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="portal-card"><h3 className="font-semibold">SGPA Trend</h3><p className="mt-2 text-slate-600">Placeholder chart area for Recharts line chart.</p></div>
            <div className="portal-card"><h3 className="font-semibold">CGPA Progress</h3><p className="mt-2 text-slate-600">Placeholder chart area for semester growth.</p></div>
            <div className="portal-card"><h3 className="font-semibold">Backlog Statistics</h3><p className="mt-2 text-slate-600">Placeholder chart area for backlog tracking.</p></div>
          </div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}