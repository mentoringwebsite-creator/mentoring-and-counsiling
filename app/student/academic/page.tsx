'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, GraduationCap, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AcademicPage() {
  const [loading, setLoading] = useState(true);
  const [sgpa, setSgpa] = useState<number>(8.0);
  const [cgpa, setCgpa] = useState<number>(8.12);
  const [backlogs, setBacklogs] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAcademicProfile = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('student_profiles')
        .select('sgpa, cgpa, backlogs, academic_subjects')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setSgpa(data.sgpa !== undefined && data.sgpa !== null ? Number(data.sgpa) : 8.0);
      setCgpa(data.cgpa !== undefined && data.cgpa !== null ? Number(data.cgpa) : 8.12);
      setBacklogs(data.backlogs !== undefined && data.backlogs !== null ? Number(data.backlogs) : 0);
      setSubjects(data.academic_subjects || []);
    } catch (err: any) {
      console.error('Error loading academic details:', err);
      setFeedback({ type: 'error', message: 'Failed to load academic profile.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicProfile();
  }, []);

  // Filter subjects by semester
  const filteredSubjects = subjects.filter((sub) => {
    if (selectedSemester === 'All') return true;
    return sub.semester?.toString() === selectedSemester;
  });

  // Calculate SGPA chart data dynamically
  const getSemesterGPAData = () => {
    const semMap: { [key: number]: number[] } = {};
    subjects.forEach((sub) => {
      const sem = parseInt(sub.semester);
      const gpa = parseFloat(sub.gpa);
      if (!isNaN(sem) && !isNaN(gpa)) {
        if (!semMap[sem]) semMap[sem] = [];
        semMap[sem].push(gpa);
      }
    });

    return Object.keys(semMap)
      .map((semStr) => {
        const sem = parseInt(semStr);
        const gpas = semMap[sem];
        const avg = gpas.reduce((a, b) => a + b, 0) / gpas.length;
        return {
          name: `Sem ${sem}`,
          GPA: Number(avg.toFixed(2)),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const gpaChartData = getSemesterGPAData();

  // Subject GPA distribution data
  const getSubjectGPADistribution = () => {
    return filteredSubjects
      .map((sub) => {
        const gpaVal = parseFloat(sub.gpa);
        return {
          name: sub.name,
          GPA: isNaN(gpaVal) ? 0 : gpaVal,
        };
      })
      .filter((d) => d.GPA > 0);
  };

  const subjectChartData = getSubjectGPADistribution();

  return (
    <ProtectedRoute role="student">
      <PageShell title="Academic Profile" subtitle="Semester overview and performance analytics">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar active="/student/academic" items={[{ href: '/student', label: 'Profile' }, { href: '/student/academic', label: 'Academic Profile' }, { href: '/student/extracurricular', label: 'Extracurricular Activities' }, { href: '/student/queries', label: 'Problems / Queries' }]} />
          
          <div className="grid gap-6">
            {feedback && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800 shadow-sm">
                {feedback.message}
              </div>
            )}

            {/* Top Cards Section */}
            <div className="portal-card relative overflow-hidden">
              <div className="flex items-center gap-2 border-b border-portal-line pb-4 mb-4">
                <GraduationCap className="h-6 w-6 text-emerald-700" />
                <h2 className="text-xl font-bold text-slate-800">Academic Scorecard</h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c5644] mr-2" />
                  <span>Loading scores...</span>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/70 bg-[linear-gradient(180deg,#f1fbf5,#e4f4ea)] p-5 shadow-[0_14px_34px_rgba(15,44,34,0.08)]">
                    <div className="text-sm font-medium text-emerald-800 opacity-80">Latest SGPA</div>
                    <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-emerald-900">{sgpa.toFixed(2)}</div>
                  </div>
                  <div className="rounded-3xl border border-white/70 bg-[linear-gradient(180deg,#fbfcfb,#f4f7f5)] p-5 shadow-[0_14px_34px_rgba(15,44,34,0.08)]">
                    <div className="text-sm font-medium text-slate-700 opacity-80">Cumulative CGPA</div>
                    <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{cgpa.toFixed(2)}</div>
                  </div>
                  <div className={`rounded-3xl border border-white/70 p-5 shadow-[0_14px_34px_rgba(15,44,34,0.08)] ${
                    backlogs > 0 
                      ? 'bg-[linear-gradient(180deg,#fff5f6,#f9e2e6)] text-rose-900' 
                      : 'bg-[linear-gradient(180deg,#fff8f0,#f9ebdb)] text-orange-900'
                  }`}>
                    <div className="text-sm font-medium opacity-80">Active Backlogs</div>
                    <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{backlogs}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Subject Table Card */}
            <div className="portal-card">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-portal-line pb-4 mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold">Semester Overview</h2>
                  
                  {/* Semester Filter */}
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="All">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c5644] mr-2" />
                  <span>Loading course data...</span>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 bg-slate-50/50 rounded-[20px] border border-dashed border-slate-200">
                  No subjects registered yet by Admin.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-portal-line bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500 font-bold">
                        <th className="p-3.5">Subject</th>
                        <th className="p-3.5">Semester</th>
                        <th className="p-3.5">Mid-1 Marks</th>
                        <th className="p-3.5">Mid-2 Marks</th>
                        <th className="p-3.5">Semester Marks</th>
                        <th className="p-3.5">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubjects.map((sub, index) => (
                        <tr key={index} className="hover:bg-slate-50/40 transition">
                          <td className="p-3.5 font-semibold text-slate-900">{sub.name}</td>
                          <td className="p-3.5 text-slate-700">Sem {sub.semester}</td>
                          <td className="p-3.5 text-slate-600">{sub.mid1}</td>
                          <td className="p-3.5 text-slate-600">{sub.mid2}</td>
                          <td className="p-3.5 text-slate-600">{sub.semester_marks}</td>
                          <td className="p-3.5 font-bold text-slate-900">{sub.gpa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Dynamic Charts Section */}
            {!loading && subjects.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* GPA Progression Line Chart */}
                {gpaChartData.length > 0 && (
                  <div className="rounded-3xl border border-portal-line bg-white p-5 shadow-[0_12px_32px_rgba(15,44,34,0.06)]">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-emerald-700" />
                      <h3 className="text-base font-bold text-slate-800">Semester GPA Trend</h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={gpaChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 101, 93, 0.15)" />
                          <XAxis dataKey="name" stroke="#60756d" fontSize={11} fontWeight={600} />
                          <YAxis stroke="#60756d" domain={[0, 10]} fontSize={11} fontWeight={600} />
                          <Tooltip />
                          <Line type="monotone" dataKey="GPA" stroke="#1c5644" strokeWidth={3.5} dot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Subject GPA Bar Chart */}
                {subjectChartData.length > 0 && (
                  <div className="rounded-3xl border border-portal-line bg-white p-5 shadow-[0_12px_32px_rgba(15,44,34,0.06)]">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      <h3 className="text-base font-bold text-slate-800">
                        {selectedSemester === 'All' ? 'Overall Subject GPA' : `Sem ${selectedSemester} GPAs`}
                      </h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 101, 93, 0.15)" />
                          <XAxis dataKey="name" stroke="#60756d" fontSize={10} tickFormatter={(v) => v.length > 10 ? `${v.substring(0, 10)}...` : v} />
                          <YAxis stroke="#60756d" domain={[0, 10]} fontSize={11} fontWeight={600} />
                          <Tooltip />
                          <Bar dataKey="GPA" fill="#d47b10" radius={[6, 6, 0, 0]} barSize={25} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}