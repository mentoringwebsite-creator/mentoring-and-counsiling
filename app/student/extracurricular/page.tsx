import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function ExtracurricularPage() {
  return (
    <ProtectedRoute role="student">
      <PageShell title="Extracurricular Activities" subtitle="Clubs, certifications, and interests">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar active="/student/extracurricular" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
        <div className="grid gap-6">
          <div className="portal-card">
            <h2 className="text-2xl font-semibold">Clubs & Organizations</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {['Robotics Club', 'NSS', 'Machine Learning Club'].map((club, index) => (
                <div key={club} className="rounded-3xl bg-portal-paper p-5">
                  <div className="text-xl font-semibold">{club}</div>
                  <div className="mt-1 text-sm text-slate-600">Role: {index === 0 ? 'Member' : index === 1 ? 'Volunteer' : 'Active Member'}</div>
                  <div className="mt-2 text-sm text-slate-600">Joined: {index === 0 ? '2023' : index === 1 ? '2022' : '2024'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="portal-card">
            <h2 className="text-2xl font-semibold">Certifications & Achievements</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {['Python Programming', 'Machine Learning', 'AWS Cloud Practitioner'].map((item) => (
                <div key={item} className="rounded-3xl border border-portal-line bg-white p-5">
                  <div className="font-semibold">{item}</div>
                  <div className="mt-2 text-sm text-slate-600">View certificate</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}