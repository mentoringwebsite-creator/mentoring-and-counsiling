import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';

const students = [
  ['21311A1910', 'Rahul Sharma', 'ECM', '8.4', 'Low'],
  ['21311A1911', 'Arjun Reddy', 'ECM', '7.1', 'Medium'],
  ['21311A1912', 'Sneha Patel', 'ECM', '6.0', 'High']
];

export default function FacultyStudentsPage() {
  return (
    <PageShell title="My Students" subtitle="Assigned students and risk levels">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/faculty" items={[{ href: '/faculty', label: 'Profile' }, { href: '/faculty/students', label: 'My Students' }, { href: '/faculty/queries', label: 'Student Queries' }, { href: '/faculty/notes', label: 'Mentor Notes' }]} />
        <div className="portal-card overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-portal-line bg-slate-50 text-sm uppercase tracking-[0.08em] text-slate-500">
                <th className="p-3">Roll No</th><th className="p-3">Name</th><th className="p-3">Branch</th><th className="p-3">CGPA</th><th className="p-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {students.map((row) => (
                <tr key={row[0]} className="border-b border-portal-line/70">
                  {row.map((cell) => <td key={cell} className="p-3">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}