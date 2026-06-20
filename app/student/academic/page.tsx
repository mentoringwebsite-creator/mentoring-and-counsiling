'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { Loader2, Edit2, Trash2, Plus, X, GraduationCap, Award, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AcademicPage() {
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // Academic stats
  const [sgpa, setSgpa] = useState<number>(8.0);
  const [cgpa, setCgpa] = useState<number>(8.12);
  const [backlogs, setBacklogs] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Stats Modal State
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [formSgpa, setFormSgpa] = useState<string>('8.0');
  const [formCgpa, setFormCgpa] = useState<string>('8.12');
  const [formBacklogs, setFormBacklogs] = useState<string>('0');

  // Subject Modal State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [subName, setSubName] = useState('');
  const [subSemester, setSubSemester] = useState('1');
  const [subMid1, setSubMid1] = useState('');
  const [subMid2, setSubMid2] = useState('');
  const [subSemesterMarks, setSubSemesterMarks] = useState('');
  const [subGpa, setSubGpa] = useState('');

  const loadAcademicProfile = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, sgpa, cgpa, backlogs, academic_subjects')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setProfileId(data.id);
      setSgpa(data.sgpa !== undefined && data.sgpa !== null ? Number(data.sgpa) : 8.0);
      setCgpa(data.cgpa !== undefined && data.cgpa !== null ? Number(data.cgpa) : 8.12);
      setBacklogs(data.backlogs !== undefined && data.backlogs !== null ? Number(data.backlogs) : 0);
      setSubjects(data.academic_subjects || []);
    } catch (err: any) {
      console.error('Error loading academic details:', err);
      setFeedback({ type: 'error', message: 'Failed to load academic profile. Make sure SQL migration is run.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicProfile();
  }, []);

  const saveToDatabase = async (updatedSgpa: number, updatedCgpa: number, updatedBacklogs: number, updatedSubjects: any[]) => {
    if (!profileId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('student_profiles')
        .update({
          sgpa: updatedSgpa,
          cgpa: updatedCgpa,
          backlogs: updatedBacklogs,
          academic_subjects: updatedSubjects,
        })
        .eq('id', profileId);

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Academic profile updated successfully!' });
    } catch (err: any) {
      console.error('Error saving academic details:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Open Stats Edit Modal
  const openEditStatsModal = () => {
    setFormSgpa(sgpa.toString());
    setFormCgpa(cgpa.toString());
    setFormBacklogs(backlogs.toString());
    setStatsModalOpen(true);
  };

  const handleStatsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSgpa = Number(formSgpa) || 0;
    const newCgpa = Number(formCgpa) || 0;
    const newBacklogs = parseInt(formBacklogs) || 0;

    setSgpa(newSgpa);
    setCgpa(newCgpa);
    setBacklogs(newBacklogs);
    setStatsModalOpen(false);

    await saveToDatabase(newSgpa, newCgpa, newBacklogs, subjects);
  };

  // Subject Operations
  const openAddSubModal = () => {
    setEditingSubIndex(null);
    setSubName('');
    setSubSemester(selectedSemester === 'All' ? '1' : selectedSemester);
    setSubMid1('');
    setSubMid2('');
    setSubSemesterMarks('');
    setSubGpa('');
    setSubModalOpen(true);
  };

  const openEditSubModal = (index: number) => {
    const sub = subjects[index];
    setEditingSubIndex(index);
    setSubName(sub.name || '');
    setSubSemester(sub.semester?.toString() || '1');
    setSubMid1(sub.mid1?.toString() || '');
    setSubMid2(sub.mid2?.toString() || '');
    setSubSemesterMarks(sub.semester_marks?.toString() || '');
    setSubGpa(sub.gpa?.toString() || '');
    setSubModalOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    const newSub = {
      name: subName.trim(),
      semester: parseInt(subSemester) || 1,
      mid1: subMid1.trim() || '-',
      mid2: subMid2.trim() || '-',
      semester_marks: subSemesterMarks.trim() || '-',
      gpa: subGpa.trim() || '-',
    };

    let updatedSubjects = [...subjects];
    if (editingSubIndex !== null) {
      updatedSubjects[editingSubIndex] = newSub;
    } else {
      updatedSubjects.push(newSub);
    }

    setSubjects(updatedSubjects);
    setSubModalOpen(false);
    await saveToDatabase(sgpa, cgpa, backlogs, updatedSubjects);
  };

  const handleSubDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this subject?')) return;

    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
    await saveToDatabase(sgpa, cgpa, backlogs, updatedSubjects);
  };

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
              <div className={`rounded-2xl border p-3 text-sm font-semibold shadow-sm animate-fade-in ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Top Cards Section */}
            <div className="portal-card relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-portal-line pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-emerald-700" />
                  <h2 className="text-xl font-bold text-slate-800">Academic Scorecard</h2>
                </div>
                <button
                  onClick={openEditStatsModal}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Stats</span>
                </button>
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
                
                <button 
                  onClick={openAddSubModal}
                  disabled={loading}
                  className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-4 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Subject</span>
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c5644] mr-2" />
                  <span>Loading course data...</span>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 bg-slate-50/50 rounded-[20px] border border-dashed border-slate-200">
                  No subjects registered. Add your courses and results.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-portal-line bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500 font-bold">
                        <th className="p-3.5">Subject</th>
                        <th className="p-3.5">Sem</th>
                        <th className="p-3.5">Mid-1</th>
                        <th className="p-3.5">Mid-2</th>
                        <th className="p-3.5">Semester Marks</th>
                        <th className="p-3.5">GPA</th>
                        <th className="p-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubjects.map((sub, index) => {
                        // Find original index in full subjects array
                        const originalIndex = subjects.findIndex(s => s === sub);
                        return (
                          <tr key={index} className="hover:bg-slate-50/40 transition">
                            <td className="p-3.5 font-semibold text-slate-900">{sub.name}</td>
                            <td className="p-3.5 text-slate-700">Sem {sub.semester}</td>
                            <td className="p-3.5 text-slate-600">{sub.mid1}</td>
                            <td className="p-3.5 text-slate-600">{sub.mid2}</td>
                            <td className="p-3.5 text-slate-600">{sub.semester_marks}</td>
                            <td className="p-3.5 font-bold text-slate-900">{sub.gpa}</td>
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => openEditSubModal(originalIndex)}
                                  className="rounded-xl bg-white hover:bg-slate-50 p-2 text-slate-600 shadow-sm border border-slate-100 transition"
                                  title="Edit Subject"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleSubDelete(originalIndex)}
                                  className="rounded-xl bg-white hover:bg-rose-50 p-2 text-rose-600 shadow-sm border border-slate-100 transition"
                                  title="Delete Subject"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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

        {/* Edit Academic Stats Modal */}
        {statsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100">
              <button 
                onClick={() => setStatsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-700" />
                <span>Edit Academic Scores</span>
              </h3>
              
              <form onSubmit={handleStatsSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Latest SGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formSgpa}
                    onChange={(e) => setFormSgpa(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cumulative CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formCgpa}
                    onChange={(e) => setFormCgpa(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    value={formBacklogs}
                    onChange={(e) => setFormBacklogs(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStatsModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                    <span>Save Stats</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Subject Modal */}
        {subModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100">
              <button 
                onClick={() => setSubModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900">
                {editingSubIndex !== null ? 'Edit Subject Details' : 'Add Academic Subject'}
              </h3>
              
              <form onSubmit={handleSubSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject Name</label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g. Mathematics-II / Computer Networks"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Semester</label>
                    <select
                      value={subSemester}
                      onChange={(e) => setSubSemester(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    >
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject GPA (out of 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={subGpa}
                      onChange={(e) => setSubGpa(e.target.value)}
                      placeholder="e.g. 9.0"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mid-1 Marks</label>
                    <input
                      type="text"
                      value={subMid1}
                      onChange={(e) => setSubMid1(e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mid-2 Marks</label>
                    <input
                      type="text"
                      value={subMid2}
                      onChange={(e) => setSubMid2(e.target.value)}
                      placeholder="e.g. 19"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Semester Marks</label>
                    <input
                      type="text"
                      value={subSemesterMarks}
                      onChange={(e) => setSubSemesterMarks(e.target.value)}
                      placeholder="e.g. 84"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                    <span>Save Subject</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}