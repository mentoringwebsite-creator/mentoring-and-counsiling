'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  BookOpen, 
  Award, 
  TrendingUp, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  AlertTriangle, 
  Target, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  Legend,
  LineChart,
  Line
} from 'recharts';

const studentSidebarItems = [
  { href: '/student', label: 'Profile' },
  { href: '/student/academic', label: 'Academic Profile' },
  { href: '/student/extracurricular', label: 'Extracurricular Activities' },
  { href: '/student/performance', label: 'Performance' },
  { href: '/student/queries', label: 'Problems / Queries' }
];

const semesterLabels: Record<string | number, { full: string; short: string }> = {
  1: { full: 'I Year I Semester (1-1)', short: '1-1' },
  2: { full: 'I Year II Semester (1-2)', short: '1-2' },
  3: { full: 'II Year I Semester (2-1)', short: '2-1' },
  4: { full: 'II Year II Semester (2-2)', short: '2-2' },
  5: { full: 'III Year I Semester (3-1)', short: '3-1' },
  6: { full: 'III Year II Semester (3-2)', short: '3-2' },
  7: { full: 'IV Year I Semester (4-1)', short: '4-1' },
  8: { full: 'IV Year II Semester (4-2)', short: '4-2' }
};

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'cgpa' | 'sgpa' | 'backlogs'>('cgpa');
  
  // Data states
  const [cgpa, setCgpa] = useState<number>(0);
  const [backlogs, setBacklogs] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');

  async function loadPerformanceData() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;

      // Get student profile
      const { data: profileDb } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profileDb) return;

      // Academic Subjects
      const subjectsList = profileDb.academic_subjects || [];
      setSubjects(subjectsList);

      // Compute dynamic CGPA/Backlog stats
      let backlogCount = 0;
      let totalCgpaCredits = 0;
      let totalCgpaPoints = 0;

      subjectsList.forEach((sub: any) => {
        const gp = convertGradeToGP(sub.gpa);
        const credits = parseFloat(sub.credits) || 0;
        if (gp !== null && credits > 0) {
          totalCgpaCredits += credits;
          totalCgpaPoints += gp * credits;
        }
        const isF = sub.gpa === 'F' || sub.result === 'F' || sub.result === 'FAIL' || (gp !== null && gp < 4.0);
        if (isF) backlogCount++;
      });

      const calculatedCgpa = totalCgpaCredits > 0 ? Number((totalCgpaPoints / totalCgpaCredits).toFixed(2)) : 0;
      const finalCgpa = profileDb.cgpa ? parseFloat(profileDb.cgpa) : calculatedCgpa;
      const finalBacklogs = profileDb.backlogs !== null && profileDb.backlogs !== undefined ? Number(profileDb.backlogs) : backlogCount;

      setCgpa(finalCgpa);
      setBacklogs(finalBacklogs);

    } catch (err) {
      console.error('Error fetching performance details:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const convertGradeToGP = (gpaStr: string | number | undefined | null): number | null => {
    if (gpaStr === undefined || gpaStr === null) return null;
    const str = String(gpaStr).trim().toUpperCase();
    const num = parseFloat(str);
    if (!isNaN(num)) return num;
    
    switch (str) {
      case 'O': case 'S': case '10': return 10.0;
      case 'A+': case '9': return 9.0;
      case 'A': case '8': return 8.0;
      case 'B+': case '7': return 7.0;
      case 'B': case '6': return 6.0;
      case 'C': case '5': return 5.0;
      case 'D': case '4': return 4.0;
      case 'F': return 0.0;
      default: return null;
    }
  };

  const getSemesterMetadata = (sem: string) => {
    const sub = subjects.find((s: any) => s.semester?.toString() === sem);
    return {
      memo_no: sub?.memo_no || '',
      serial_no: sub?.serial_no || '',
      exam_date: sub?.exam_date || '',
      issue_date: sub?.issue_date || '',
      total_credits: sub?.total_credits || '',
      pass_status: sub?.pass_status || 'PASS'
    };
  };

  const filteredSubjects = subjects.filter((sub) => {
    if (selectedSemester === 'All') return true;
    return sub.semester?.toString() === selectedSemester;
  });

  const selectedSemesterSGPA = (() => {
    if (selectedSemester === 'All') return null;
    const semNum = parseInt(selectedSemester);
    if (isNaN(semNum)) return null;

    const subjectsInSem = subjects.filter(
      (sub) => parseInt(sub.semester) === semNum
    );

    const firstSubWithSgpa = subjectsInSem.find(sub => sub.sgpa && !isNaN(parseFloat(sub.sgpa)));
    if (firstSubWithSgpa) {
      return Number(parseFloat(firstSubWithSgpa.sgpa).toFixed(2));
    }

    let totalCredits = 0;
    let weightedGPsum = 0;
    let validGPsCount = 0;

    subjectsInSem.forEach((sub) => {
      const gp = convertGradeToGP(sub.gpa);
      const credits = parseFloat(sub.credits);
      if (gp !== null) {
        validGPsCount++;
        if (!isNaN(credits) && credits >= 0) {
          weightedGPsum += gp * credits;
          totalCredits += credits;
        }
      }
    });

    if (validGPsCount === 0) return null;
    
    if (totalCredits === 0) {
      const validGPs = subjectsInSem
        .map((sub) => convertGradeToGP(sub.gpa))
        .filter((gp): gp is number => gp !== null);
      return Number((validGPs.reduce((a, b) => a + b, 0) / validGPs.length).toFixed(2));
    }

    return Number((weightedGPsum / totalCredits).toFixed(2));
  })();

  const getBacklogData = () => {
    const maxSem = Math.max(...subjects.map(s => parseInt(s.semester)), 2);
    const length = Math.max(maxSem, 4);

    return Array.from({ length }, (_, i) => {
      const semNum = i + 1;
      const semSubjects = subjects.filter(sub => Number(sub.semester) === semNum);
      let semBacklogs = semSubjects.filter(sub => {
        const gp = convertGradeToGP(sub.gpa);
        return sub.gpa === 'F' || (gp !== null && gp < 4.0);
      }).length;

      const classAvgBacklogs = Math.max(0, Number((1.2 - semNum * 0.2 + Math.sin(semNum) * 0.15).toFixed(2)));
      return {
        name: `Sem ${semNum}`,
        Student: semBacklogs,
        ClassAvg: classAvgBacklogs
      };
    }).filter(d => Number(d.name.split(' ')[1]) <= maxSem);
  };

  const getSgpaTrendData = () => {
    const semMap: { [key: number]: any[] } = {};
    subjects.forEach((sub) => {
      const sem = parseInt(sub.semester);
      if (!isNaN(sem)) {
        if (!semMap[sem]) semMap[sem] = [];
        semMap[sem].push(sub);
      }
    });

    const maxSem = Math.max(...subjects.map(s => parseInt(s.semester)), 2);
    const length = Math.max(maxSem, 4);
    
    return Array.from({ length }, (_, i) => {
      const semNum = i + 1;
      const subjectsInSem = semMap[semNum] || [];
      let studentSGPA = null;
      
      const firstSubWithSgpa = subjectsInSem.find(sub => sub.sgpa && !isNaN(parseFloat(sub.sgpa)));
      if (firstSubWithSgpa) {
        studentSGPA = parseFloat(firstSubWithSgpa.sgpa);
      } else if (subjectsInSem.length > 0) {
        let totalCredits = 0;
        let weightedGPsum = 0;
        let validGPsCount = 0;

        subjectsInSem.forEach((sub) => {
          const gp = convertGradeToGP(sub.gpa);
          const credits = parseFloat(sub.credits);
          if (gp !== null) {
            validGPsCount++;
            if (!isNaN(credits) && credits >= 0) {
              weightedGPsum += gp * credits;
              totalCredits += credits;
            }
          }
        });

        if (validGPsCount > 0) {
          if (totalCredits === 0) {
            const validGPs = subjectsInSem
              .map((sub) => convertGradeToGP(sub.gpa))
              .filter((gp): gp is number => gp !== null);
            studentSGPA = validGPs.reduce((a, b) => a + b, 0) / validGPs.length;
          } else {
            studentSGPA = weightedGPsum / totalCredits;
          }
          studentSGPA = Number(studentSGPA.toFixed(2));
        }
      }
      
      const classAvg = Number((7.4 + Math.sin(semNum) * 0.2 + (semNum * 0.05)).toFixed(2));
      return {
        name: `Sem ${semNum}`,
        Student: studentSGPA,
        ClassAvg: classAvg
      };
    }).filter(d => d.Student !== null || Number(d.name.split(' ')[1]) <= maxSem);
  };

  const getCgpaProgressData = () => {
    const maxSem = Math.max(...subjects.map(s => parseInt(s.semester)), 2);
    const length = Math.max(maxSem, 4);

    const semStats: Record<number, { sgpa: number; credits: number }> = {};
    for (let sem = 1; sem <= length; sem++) {
      const subjectsInSem = subjects.filter(s => parseInt(s.semester) === sem);
      if (subjectsInSem.length === 0) continue;
      
      const firstSubWithSgpa = subjectsInSem.find(s => s.sgpa && !isNaN(parseFloat(s.sgpa)));
      let semSgpaVal = 0;
      let semCreditsVal = 0;
      
      subjectsInSem.forEach(s => {
        const cr = parseFloat(s.credits) || 0;
        if (s.result === 'P' || s.result === 'PASS') {
          semCreditsVal += cr;
        }
      });
      if (semCreditsVal === 0) {
        semCreditsVal = subjectsInSem.reduce((acc, s) => acc + (parseFloat(s.credits) || 0), 0);
      }

      if (firstSubWithSgpa) {
        semSgpaVal = parseFloat(firstSubWithSgpa.sgpa);
      } else {
        let totalCredits = 0;
        let weightedGPsum = 0;
        let validGPsCount = 0;

        subjectsInSem.forEach((sub) => {
          const gp = convertGradeToGP(sub.gpa);
          const credits = parseFloat(sub.credits);
          if (gp !== null) {
            validGPsCount++;
            if (!isNaN(credits) && credits >= 0) {
              weightedGPsum += gp * credits;
              totalCredits += credits;
            }
          }
        });

        if (validGPsCount > 0) {
          semSgpaVal = totalCredits === 0 ? (subjectsInSem.map(s => convertGradeToGP(s.gpa)).filter((gp): gp is number => gp !== null).reduce((a, b) => a + b, 0) / validGPsCount) : (weightedGPsum / totalCredits);
        }
      }
      
      semStats[sem] = { sgpa: semSgpaVal, credits: semCreditsVal };
    }

    return Array.from({ length }, (_, i) => {
      const semNum = i + 1;
      let totalWeightedSgpa = 0;
      let totalCreditsSoFar = 0;
      
      for (let s = 1; s <= semNum; s++) {
        if (semStats[s]) {
          totalWeightedSgpa += semStats[s].sgpa * semStats[s].credits;
          totalCreditsSoFar += semStats[s].credits;
        }
      }
      
      const cumulativeGPA = totalCreditsSoFar > 0 ? Number((totalWeightedSgpa / totalCreditsSoFar).toFixed(2)) : null;

      return {
        name: `Sem ${semNum}`,
        CGPA: cumulativeGPA
      };
    }).filter(d => d.CGPA !== null || Number(d.name.split(' ')[1]) <= maxSem);
  };

  const cgpaProgressData = getCgpaProgressData();
  const backlogData = getBacklogData();
  const sgpaTrendData = getSgpaTrendData();

  const getAcademicAnalysis = () => {
    if (subjects.length === 0) return null;

    const isStrength = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp >= 9.0;
    };
    const strengths = subjects.filter(s => isStrength(s.gpa)).map(s => s.name);

    const isWeakness = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp < 7.5;
    };
    const weaknesses = subjects.filter(s => isWeakness(s.gpa)).map(s => s.name);

    const semGPAs: { [key: number]: number } = {};
    const semMap: { [key: number]: number[] } = {};
    subjects.forEach((sub) => {
      const sem = parseInt(sub.semester);
      const gp = convertGradeToGP(sub.gpa);
      if (!isNaN(sem) && gp !== null) {
        if (!semMap[sem]) semMap[sem] = [];
        semMap[sem].push(gp);
      }
    });

    Object.keys(semMap).forEach(semStr => {
      const sem = parseInt(semStr);
      const gpas = semMap[sem];
      semGPAs[sem] = gpas.reduce((a, b) => a + b, 0) / gpas.length;
    });

    const semesters = Object.keys(semGPAs).map(Number).sort((a, b) => a - b);
    let momentum: 'up' | 'down' | 'stable' = 'stable';
    let momentumVal = 0;
    
    if (semesters.length >= 2) {
      const latest = semesters[semesters.length - 1];
      const prev = semesters[semesters.length - 2];
      momentumVal = Number((semGPAs[latest] - semGPAs[prev]).toFixed(2));
      if (momentumVal > 0.05) momentum = 'up';
      else if (momentumVal < -0.05) momentum = 'down';
    }

    let placementScore = 75;
    if (cgpa >= 8.5) placementScore = 95;
    else if (cgpa >= 8.0) placementScore = 88;
    else if (cgpa >= 7.0) placementScore = 78;
    else if (cgpa >= 6.0) placementScore = 65;
    else placementScore = 45;

    if (backlogs > 0) placementScore = Math.max(30, placementScore - 15);

    return {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      momentum,
      momentumVal,
      placementScore
    };
  };

  const analysis = getAcademicAnalysis();

  return (
    <ProtectedRoute role="student">
      <PageShell title="Performance Analysis" subtitle="Viewport-bounded academic summary and analytics dashboard">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        <div className="grid gap-4 px-3 py-3 md:px-4 md:py-4 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0 h-[calc(100vh-110px)] overflow-hidden">
          <Sidebar active="/student/performance" items={studentSidebarItems} />

          <div className="w-full min-w-0 h-full">
            {loading ? (
              <div className="portal-card flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading Performance workspace...</span>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.25fr_1fr] h-full min-h-0 w-full overflow-hidden">
                
                {/* Left Panel: Course Ledger (Compact, scrollable) */}
                <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm h-full flex flex-col min-h-0 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-[#1c5644]/10 p-1.5">
                        <BookOpen className="h-4.5 w-4.5 text-[#1c5644]" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900">Academic Ledger</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 focus:border-[#1c5644] focus:outline-none"
                      >
                        <option value="All">All Semesters</option>
                        <option value="1">1-1</option>
                        <option value="2">1-2</option>
                        <option value="3">2-1</option>
                        <option value="4">2-2</option>
                        <option value="5">3-1</option>
                        <option value="6">3-2</option>
                        <option value="7">4-1</option>
                        <option value="8">4-2</option>
                      </select>

                      {selectedSemesterSGPA !== null && (
                        <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 border border-emerald-255 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-sm">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          <span>SGPA: {selectedSemesterSGPA}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Semester metadata */}
                  {selectedSemester !== 'All' && (() => {
                    const semMeta = getSemesterMetadata(selectedSemester);
                    if (!semMeta.memo_no && !semMeta.serial_no && !semMeta.exam_date && !semMeta.issue_date) return null;
                    return (
                      <div className="grid grid-cols-4 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] shrink-0 mb-2">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block">Memo</span>
                          <span className="font-bold text-slate-800">{semMeta.memo_no || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block">Exam Date</span>
                          <span className="font-bold text-slate-800">{semMeta.exam_date || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block">Credits</span>
                          <span className="font-bold text-slate-800">{semMeta.total_credits || '-'}</span>
                        </div>
                        {selectedSemesterSGPA !== null && (
                          <div>
                            <span className="text-emerald-800 font-bold uppercase block">SGPA</span>
                            <span className="font-black text-emerald-850">{selectedSemesterSGPA}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {filteredSubjects.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed">
                      <p className="text-xs text-slate-500">No subjects registered for this semester.</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto border border-slate-150 rounded-xl bg-white scrollbar-none">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 z-10 text-[9px] uppercase font-bold text-slate-500">
                          <tr>
                            <th className="p-2">Code</th>
                            <th className="p-2">Subject Name</th>
                            <th className="p-2 text-center">Sem</th>
                            <th className="p-2 text-center">Cr</th>
                            <th className="p-2 text-center">Mid1</th>
                            <th className="p-2 text-center">Mid2</th>
                            <th className="p-2 text-center">INT</th>
                            <th className="p-2 text-center">EXT</th>
                            <th className="p-2 text-center">Total</th>
                            <th className="p-2 text-center">Grade</th>
                            <th className="p-2 text-center">Res</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredSubjects.map((sub, index) => (
                            <tr key={index} className="hover:bg-slate-50/40 transition">
                              <td className="p-2 font-mono font-bold text-slate-500">{sub.code || '-'}</td>
                              <td className="p-2 font-semibold text-slate-800 truncate max-w-[120px]">{sub.name}</td>
                              <td className="p-2 text-slate-600 text-center font-bold">{semesterLabels[sub.semester]?.short || `Sem ${sub.semester}`}</td>
                              <td className="p-2 text-slate-655 text-center font-semibold">{sub.credits ?? '-'}</td>
                              <td className="p-2 text-slate-500 text-center font-mono">{sub.mid1 || '-'}</td>
                              <td className="p-2 text-slate-500 text-center font-mono">{sub.mid2 || '-'}</td>
                              <td className="p-2 text-slate-700 text-center font-bold font-mono">{sub.internal_marks || '-'}</td>
                              <td className="p-2 text-slate-700 text-center font-bold font-mono">{sub.external_marks || '-'}</td>
                              <td className="p-2 text-slate-900 text-center font-black font-mono">{sub.total_marks || '-'}</td>
                              <td className="p-2 text-center font-bold text-slate-900">{sub.gpa ?? '-'}</td>
                              <td className="p-2 text-center">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.25 text-[9px] font-bold border ${
                                  sub.result === 'P' || sub.result === 'PASS'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                    : 'bg-rose-50 border-rose-100 text-rose-800'
                                }`}>
                                  {sub.result || 'P'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right Panel: Charts (Top) & AI Insights (Bottom) */}
                <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
                  
                  {/* Top: Charts Studio */}
                  <div className="rounded-[24px] border border-slate-150 bg-white p-4 shadow-sm flex-1 min-h-0 flex flex-col animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 shrink-0">
                      <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-[#1c5644]" />
                        <span>Interactive Performance Charts</span>
                      </h3>
                      <div className="flex gap-1.5 bg-slate-100 rounded-lg p-0.5">
                        {(['cgpa', 'sgpa', 'backlogs'] as const).map((c) => (
                          <button
                            key={c}
                            onClick={() => setActiveChart(c)}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition ${
                              activeChart === c ? 'bg-white text-[#1c5644] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {c.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                      {subjects.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {activeChart === 'cgpa' ? (
                            <AreaChart data={cgpaProgressData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                              <defs>
                                <linearGradient id="performanceCgpaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1c5644" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#1c5644" stopOpacity={0.01}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} />
                              <YAxis stroke="#94a3b8" domain={[4, 10]} fontSize={9} fontWeight={600} />
                              <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                              <Area type="monotone" name="CGPA" dataKey="CGPA" stroke="#1c5644" strokeWidth={3} fillOpacity={1} fill="url(#performanceCgpaGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={true} animationDuration={600} />
                            </AreaChart>
                          ) : activeChart === 'sgpa' ? (
                            <LineChart data={sgpaTrendData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} />
                              <YAxis stroke="#94a3b8" domain={[0, 10]} fontSize={9} fontWeight={600} />
                              <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                              <Line type="monotone" name="Student" dataKey="Student" stroke="#1c5644" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={true} animationDuration={600} />
                              <Line type="monotone" name="Class Avg" dataKey="ClassAvg" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} connectNulls />
                            </LineChart>
                          ) : (
                            <BarChart data={backlogData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} />
                              <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} allowDecimals={false} />
                              <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                              <Bar name="Student" dataKey="Student" fill="#e88913" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={true} animationDuration={600} />
                              <Bar name="Class Avg" dataKey="ClassAvg" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No graph data available.</p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: AI Insights */}
                  {analysis && (
                    <div className="rounded-[24px] border border-slate-150 bg-[linear-gradient(180deg,#ffffff,#fafcfb)] p-4 shadow-sm h-[190px] shrink-0 flex flex-col min-h-0 overflow-y-auto animate-fadeIn">
                      <div className="absolute top-0 right-0 p-2">
                        <Sparkles className="h-4 w-4 text-emerald-800 opacity-20" />
                      </div>

                      <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2 shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-800" />
                        <span>AI Academic Profiler (Insights)</span>
                      </h3>

                      <div className="grid gap-3 grid-cols-3 flex-1 min-h-0 items-center">
                        {/* Gauge */}
                        <div className="rounded-xl border border-slate-200 bg-white p-2 flex flex-col justify-center h-full shadow-sm text-center">
                          <div className="text-[9px] font-bold text-slate-500 uppercase">Readiness</div>
                          <h3 className="text-base font-black text-emerald-955 mt-0.5">{analysis.placementScore}%</h3>
                          <div className="w-full bg-slate-150 rounded-full h-1.5 mt-1.5">
                            <div className="bg-[#1c5644] h-1.5 rounded-full" style={{ width: `${analysis.placementScore}%` }} />
                          </div>
                        </div>

                        {/* Strengths / Weaknesses */}
                        <div className="space-y-1.5 text-[10px] overflow-y-auto scrollbar-none max-h-full">
                          {analysis.strengths.length > 0 && (
                            <div>
                              <div className="text-[8px] font-extrabold text-emerald-850 uppercase tracking-wide">Strengths</div>
                              <div className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{analysis.strengths[0]}</div>
                            </div>
                          )}
                          {analysis.weaknesses.length > 0 && (
                            <div>
                              <div className="text-[8px] font-extrabold text-amber-900 uppercase tracking-wide">Focus Areas</div>
                              <div className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{analysis.weaknesses[0]}</div>
                            </div>
                          )}
                        </div>

                        {/* Momentum */}
                        <div className="rounded-xl border border-slate-200 bg-white p-2 flex flex-col justify-center items-center h-full shadow-sm text-center">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Momentum</div>
                          <div className="mt-1.5 flex items-center justify-center gap-1">
                            {analysis.momentum === 'up' ? (
                              <>
                                <div className="rounded-md bg-emerald-100 p-1 text-emerald-800"><ArrowUpRight className="h-3 w-3" /></div>
                                <span className="text-[10px] font-black text-emerald-850">UP</span>
                              </>
                            ) : analysis.momentum === 'down' ? (
                              <>
                                <div className="rounded-md bg-rose-100 p-1 text-rose-800"><ArrowDownRight className="h-3 w-3" /></div>
                                <span className="text-[10px] font-black text-rose-850">DOWN</span>
                              </>
                            ) : (
                              <>
                                <div className="rounded-md bg-slate-100 p-1 text-slate-700"><TrendingUp className="h-3 w-3" /></div>
                                <span className="text-[10px] font-black text-slate-750">STABLE</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
