'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { getPendingApprovals, updateApprovalStatus } from '@/lib/auth';

function getProfileValue(user: any) {
  if (user.role === 'student') return user.student_profiles?.[0]?.branch || '-';
  if (user.role === 'faculty') return user.faculty_profiles?.[0]?.department || '-';
  if (user.role === 'hod') return user.hod_profiles?.[0]?.department || '-';
  return '-';
}

function getProfileDetails(user: any) {
  const student = user.student_profiles?.[0];
  const faculty = user.faculty_profiles?.[0];
  const hod = user.hod_profiles?.[0];

  if (user.role === 'student' && student) {
    return (
      <div className="space-y-2 text-sm text-slate-700">
        <div><strong>Roll Number:</strong> {student.roll_number}</div>
        <div><strong>Branch:</strong> {student.branch}</div>
        <div><strong>Section:</strong> {student.section}</div>
        <div><strong>Academic Year:</strong> {student.academic_year}</div>
        <div><strong>Phone:</strong> {student.phone}</div>
        <div><strong>Date of Birth:</strong> {student.dob}</div>
      </div>
    );
  }

  if (user.role === 'faculty' && faculty) {
    return (
      <div className="space-y-2 text-sm text-slate-700">
        <div><strong>Faculty ID:</strong> {faculty.faculty_id}</div>
        <div><strong>Designation:</strong> {faculty.designation}</div>
        <div><strong>Qualification:</strong> {faculty.qualification}</div>
        <div><strong>Department:</strong> {faculty.department}</div>
        <div><strong>Subjects:</strong> {faculty.subjects}</div>
        <div><strong>Contact:</strong> {faculty.contact_number}</div>
      </div>
    );
  }

  if (user.role === 'hod' && hod) {
    return (
      <div className="space-y-2 text-sm text-slate-700">
        <div><strong>Faculty ID:</strong> {hod.faculty_id}</div>
        <div><strong>Designation:</strong> {hod.designation}</div>
        <div><strong>Department:</strong> {hod.department}</div>
        <div><strong>Contact:</strong> {hod.contact_number}</div>
      </div>
    );
  }

  return <div className="text-sm text-slate-700">Profile structured data not available.</div>;
}

export default function AdminPendingApprovalsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    const { data, error } = await getPendingApprovals();
    setLoading(false);

    if (error) {
      setFeedback(error.message);
      return;
    }

    setUsers(data ?? []);
  };

  const handleApprovalUpdate = async (userId: string, status: 'Approved' | 'Rejected') => {
    setFeedback(null);
    const { error } = await updateApprovalStatus(userId, status);

    if (error) {
      setFeedback(error.message);
      return;
    }

    setFeedback(`User ${status.toLowerCase()} successfully.`);
    await fetchApprovals();
  };

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Pending Approvals" subtitle="Review and approve new user registrations">
      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar
          active="/admin/pending"
          items={[
            { href: '/admin', label: 'Overview' },
            { href: '/admin/pending', label: 'Pending Approvals' },
            { href: '/admin/students', label: 'Manage Students' },
            { href: '/admin/faculty', label: 'Manage Faculty' },
            { href: '/admin/hod', label: 'Manage HOD' },
            { href: '/admin/settings', label: 'Settings' }
          ]}
        />
        <div className="space-y-6">
          <div className="portal-card">
            <h2 className="text-2xl font-semibold">Pending Approvals</h2>
            <p className="mt-2 text-slate-600">Approve or reject new student, faculty, and HOD accounts before they can sign in.</p>
          </div>

          {feedback ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div>
          ) : null}

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Department / Branch</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td className="px-5 py-8 text-slate-500" colSpan={5}>Loading pending approvals…</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-slate-500" colSpan={5}>No pending registrations found.</td>
                  </tr>
                ) : null}
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4 align-top">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{user.email}</div>
                      <details className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <summary className="cursor-pointer font-medium">View profile details</summary>
                        <div className="mt-3">{getProfileDetails(user)}</div>
                      </details>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-700">{user.role.toUpperCase()}</td>
                    <td className="px-5 py-4 align-top text-slate-700">{getProfileValue(user)}</td>
                    <td className="px-5 py-4 align-top">
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">{user.status}</span>
                    </td>
                    <td className="px-5 py-4 align-top space-y-2">
                      <button
                        onClick={() => handleApprovalUpdate(user.id, 'Approved')}
                        className="inline-flex w-full items-center justify-center rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalUpdate(user.id, 'Rejected')}
                        className="inline-flex w-full items-center justify-center rounded-3xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}
