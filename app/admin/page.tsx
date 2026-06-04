'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    departments: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Fetch student count
        const { count: studentCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // Fetch faculty count
        const { count: facultyCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'faculty');

        // Fetch pending count
        const { count: pendingCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');

        // Fetch unique departments/branches from profiles
        const { data: facultyData } = await supabase
          .from('faculty_profiles')
          .select('department');
        const { data: studentData } = await supabase
          .from('student_profiles')
          .select('branch');

        const uniqueDepts = new Set<string>();
        facultyData?.forEach((f) => {
          if (f.department) uniqueDepts.add(f.department.trim().toUpperCase());
        });
        studentData?.forEach((s) => {
          if (s.branch) uniqueDepts.add(s.branch.trim().toUpperCase());
        });

        // Use 8 as a default fallback if no departments are registered yet
        const departmentsCount = uniqueDepts.size > 0 ? uniqueDepts.size : 8;

        setStats({
          students: studentCount ?? 0,
          faculty: facultyCount ?? 0,
          departments: departmentsCount,
          pending: pendingCount ?? 0,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Admin Dashboard" subtitle="Manage portal data and analytics">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar
            active="/admin"
            items={[
              { href: '/admin', label: 'Overview' },
              { href: '/admin/pending', label: 'Pending Approvals' },
              { href: '/admin/students', label: 'Manage Students' },
              { href: '/admin/faculty', label: 'Manage Faculty' },
              { href: '/admin/settings', label: 'Settings' }
            ]}
          />
          <div className="grid gap-6">
            <div className="portal-card">
              <h1 className="text-3xl font-bold">Portal Analytics</h1>
              <p className="mt-2 text-slate-600">
                Administrative controls for users, departments, notifications, and content moderation.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              <StatCard title="Students" value={loading ? '...' : stats.students.toString()} tone="neutral" />
              <StatCard title="Faculty" value={loading ? '...' : stats.faculty.toString()} tone="green" />
              <StatCard title="Departments" value={loading ? '...' : stats.departments.toString()} tone="neutral" />
              <StatCard title="Pending Tasks" value={loading ? '...' : stats.pending.toString()} tone="orange" />
            </div>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}