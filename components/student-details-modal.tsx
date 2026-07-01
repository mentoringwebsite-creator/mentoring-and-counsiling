'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { 
  Loader2, X, User, Mail, Phone, Calendar, BookOpen, 
  TrendingUp, BarChart3, Sparkles, Heart, Target, 
  Award, Users, ExternalLink, Image as ImageIcon, 
  GraduationCap, AlertTriangle, ShieldCheck, Zap, 
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const getStudentBTechYear = (roll: string, acYear: string) => {
  const acYearStr = String(acYear || '').toLowerCase();
  if (acYearStr.includes('i year') || acYearStr.includes('1st year') || acYearStr === '1' || acYearStr.includes('first')) return 'I Year';
  if (acYearStr.includes('ii year') || acYearStr.includes('2nd year') || acYearStr === '2' || acYearStr.includes('second')) return 'II Year';
  if (acYearStr.includes('iii year') || acYearStr.includes('3rd year') || acYearStr === '3' || acYearStr.includes('third')) return 'III Year';
  if (acYearStr.includes('iv year') || acYearStr.includes('4th year') || acYearStr === '4' || acYearStr.includes('fourth')) return 'IV Year';

  const r = String(roll || '').trim();
  if (r.length >= 2) {
    const joinYearDigits = parseInt(r.substring(0, 2));
    if (!isNaN(joinYearDigits)) {
      const currentYear = 2026;
      const currentYearDigits = currentYear % 100; // 26
      const diff = currentYearDigits - joinYearDigits;
      if (diff === 0 || diff === 1) return 'I Year';
      if (diff === 2) return 'II Year';
      if (diff === 3) return 'III Year';
      if (diff >= 4) return 'IV Year';
    }
  }
  return 'I Year';
};

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

interface StudentDetailsModalProps {
  studentUserId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailsModal({ studentUserId, isOpen, onClose }: StudentDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'academics' | 'extracurriculars'>('profile');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedCertImage, setSelectedCertImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentUserId) {
      setStudent(null);
      setError(null);
      return;
    }

    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setActiveTab('profile');
        setSelectedSemester('All');
        setSelectedCertImage(null);

        const { data, error: dbError } = await supabase
          .from('users')
          .select(`
            id, name, email,
            student_profiles!user_id (
              roll_number, branch, section, academic_year, phone, alternate_phone, dob, profile_photo,
              cgpa, backlogs, sgpa, academic_subjects, interests, dreams, career_goals, clubs, certifications
            )
          `)
          .eq('id', studentUserId)
          .single();

        if (dbError) throw dbError;
        setStudent(data);
      } catch (err: any) {
        console.error('Error fetching student details:', err);
        setError(err.message || 'Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentUserId, isOpen]);

  // Prevent closing when clicking modal content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const profile = student?.student_profiles?.[0] || {};
  const subjects = profile.academic_subjects || [];

  // Helper to convert letter grades to GPA numbers
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
      default: return null; // Ignore non-grade strings like '-'
    }
  };

  // Compute dynamic stats if subjects exist
  const dynamicStats = (() => {
    if (subjects.length === 0) {
      return { sgpa: 0, cgpa: 0, backlogs: 0 };
    }

    let totalCgpaCredits = 0;
    let totalCgpaPoints = 0;
    let backlogCount = 0;

    subjects.forEach((sub: any) => {
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

    const semesters = subjects.map((s: any) => parseInt(s.semester)).filter((s: any) => !isNaN(s));
    const latestSem = semesters.length > 0 ? Math.max(...semesters) : 1;

    let totalSgpaCredits = 0;
    let totalSgpaPoints = 0;

    subjects.forEach((sub: any) => {
      if (parseInt(sub.semester) === latestSem) {
        const gp = convertGradeToGP(sub.gpa);
        const credits = parseFloat(sub.credits) || 0;
        if (gp !== null && credits > 0) {
          totalSgpaCredits += credits;
          totalSgpaPoints += gp * credits;
        }
      }
    });

    const calculatedSgpa = totalSgpaCredits > 0 ? Number((totalSgpaPoints / totalSgpaCredits).toFixed(2)) : 0;

    return {
      sgpa: calculatedSgpa,
      cgpa: calculatedCgpa,
      backlogs: backlogCount
    };
  })();

  const cgpaVal = dynamicStats.cgpa;
  const sgpaVal = dynamicStats.sgpa;
  const backlogsVal = dynamicStats.backlogs;
  const risk = getRiskLevel(cgpaVal, backlogsVal);

  const getSemesterMetadata = (sem: string) => {
    const sub = subjects.find((s: any) => s.semester?.toString() === sem);
    return {
      memo_no: sub?.memo_no || '',
      serial_no: sub?.serial_no || '',
      exam_date: sub?.exam_date || '',
      issue_date: sub?.issue_date || '',
      total_credits: sub?.total_credits || '',
      pass_status: sub?.pass_status || 'PASS',
      father_name: sub?.father_name || '',
      hall_ticket_no: sub?.hall_ticket_no || '',
      branch: sub?.branch || ''
    };
  };

  const filteredSubjects = subjects.filter((sub: any) => {
    if (selectedSemester === 'All') return true;
    return sub.semester?.toString() === selectedSemester;
  });

  const selectedSemesterSGPA = (() => {
    if (selectedSemester === 'All') return null;
    const semNum = parseInt(selectedSemester);
    if (isNaN(semNum)) return null;

    const subjectsInSem = subjects.filter(
      (sub: any) => parseInt(sub.semester) === semNum
    );
    const validGPs = subjectsInSem
      .map((sub: any): number | null => convertGradeToGP(sub.gpa))
      .filter((gp: number | null): gp is number => gp !== null);

    if (validGPs.length === 0) return null;
    const avg = validGPs.reduce((a: number, b: number) => a + b, 0) / validGPs.length;
    return Number(avg.toFixed(2));
  })();

  // Calculate SGPA chart data dynamically
  const getSemesterGPAData = () => {
    const semMap: { [key: number]: number[] } = {};
    subjects.forEach((sub: any) => {
      const sem = parseInt(sub.semester);
      const gp = convertGradeToGP(sub.gpa);
      if (!isNaN(sem) && gp !== null) {
        if (!semMap[sem]) semMap[sem] = [];
        semMap[sem].push(gp);
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
      .map((sub: any) => {
        const gp = convertGradeToGP(sub.gpa);
        return {
          name: sub.name,
          GPA: gp === null ? 0 : gp,
        };
      })
      .filter((d: any) => d.GPA > 0);
  };

  const subjectChartData = getSubjectGPADistribution();

  // Automated Strengths, Weaknesses, and Progress Momentum Analysis
  const getAcademicAnalysis = () => {
    if (subjects.length === 0) return null;

    // 1. Core strengths (GPAs >= 9.0 or grades O/S/A+)
    const isStrength = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp >= 9.0;
    };
    const strengths = subjects.filter((s: any) => isStrength(s.gpa)).map((s: any) => s.name);

    // 2. Focus areas (GPAs < 7.5 or grades B/C/F)
    const isWeakness = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp < 7.5;
    };
    const weaknesses = subjects.filter((s: any) => isWeakness(s.gpa)).map((s: any) => s.name);

    // 3. GPA Momentum (Latest vs Previous Semester)
    const semGPAs: { [key: number]: number } = {};
    const semMap: { [key: number]: number[] } = {};
    subjects.forEach((sub: any) => {
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

    // 4. Career placement readiness score
    let placementScore = 75;
    if (cgpaVal >= 8.5) placementScore = 95;
    else if (cgpaVal >= 8.0) placementScore = 88;
    else if (cgpaVal >= 7.0) placementScore = 78;
    else if (cgpaVal >= 6.0) placementScore = 65;
    else placementScore = 45;

    if (backlogsVal > 0) placementScore = Math.max(30, placementScore - 15);

    return {
      strengths: strengths.slice(0, 3), // Top 3
      weaknesses: weaknesses.slice(0, 3), // Top 3
      momentum,
      momentumVal,
      placementScore
    };
  };

  const analysis = getAcademicAnalysis();

  const clubsList = profile.clubs || [];
  const certificationsList = profile.certifications || [];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={handleContentClick}
        className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl transition duration-300 animate-scale-in"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-20 rounded-full p-2 text-slate-400 bg-white/80 border border-slate-100 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-500 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#1c5644] mb-3" />
            <p className="font-semibold text-sm">Loading student profile details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center text-rose-800 p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-rose-500 mb-3" />
            <p className="font-bold text-lg">Error Loading Profile</p>
            <p className="text-sm mt-1 text-rose-600 max-w-md">{error}</p>
            <button 
              onClick={onClose}
              className="mt-6 rounded-2xl bg-slate-800 text-white px-5 py-2 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        ) : !student ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-500 py-20">
            <User className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-sm">No student selected</p>
          </div>
        ) : (
          <>
            {/* Header / Demographics Banner */}
            <div className="border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/50 via-white/50 to-orange-50/20 px-6 py-6 md:px-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                {/* Photo */}
                <div className="h-20 w-20 rounded-[24px] border-2 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                  {profile.profile_photo ? (
                    <img src={profile.profile_photo} alt={student.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-emerald-800/60" />
                  )}
                </div>

                {/* Text Info */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{student.name}</h2>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      risk === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      risk === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {risk} Risk Status
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">{profile.roll_number || 'No Roll No'}</span>
                    <span>&bull;</span>
                    <span>{profile.branch} Department</span>
                    <span>&bull;</span>
                    <span>Section {profile.section || '-'}</span>
                    <span>&bull;</span>
                    <span>B.Tech Year: {getStudentBTechYear(profile.roll_number, profile.academic_year)} (Batch: {profile.academic_year || 'N/A'})</span>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="mt-6 flex border-b border-slate-200/50">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'border-[#1c5644] text-[#1c5644]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  General Profile
                </button>
                <button
                  onClick={() => setActiveTab('academics')}
                  className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                    activeTab === 'academics'
                      ? 'border-[#1c5644] text-[#1c5644]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Academics & Analytics
                </button>
                <button
                  onClick={() => setActiveTab('extracurriculars')}
                  className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                    activeTab === 'extracurriculars'
                      ? 'border-[#1c5644] text-[#1c5644]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Extracurriculars & Goals
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/20">
              
              {/* Tab 1: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Bio details card */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <User className="h-4.5 w-4.5 text-emerald-800" />
                      <span>Student Demographics & Bio</span>
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{profile.dob ? new Date(profile.dob).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not Specified'}</span>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch / Course</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{profile.branch || 'Not Specified'}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">Section {profile.section || 'N/A'}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Academic Year</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{profile.academic_year || 'Not Specified'}</div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/55 p-4 border border-emerald-100">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">B.Tech Year</div>
                        <div className="mt-1 text-sm font-bold text-emerald-950">{getStudentBTechYear(profile.roll_number, profile.academic_year)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role & Status</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span>Approved Student</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information card */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Phone className="h-4.5 w-4.5 text-[#1c5644]" />
                      <span>Contact Directory</span>
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-150 p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Official Email</div>
                          <a href={`mailto:${student.email}`} className="text-xs font-semibold text-slate-800 hover:text-emerald-700 break-all">{student.email}</a>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-150 p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-850">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</div>
                          <span className="text-xs font-mono font-bold text-slate-800">{profile.phone || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-150 p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alternate Contact</div>
                          <span className="text-xs font-mono font-bold text-slate-800">{profile.alternate_phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Academics */}
              {activeTab === 'academics' && (
                <div className="space-y-6">
                  {/* Scorecard grid */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
                      <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider opacity-85">Latest SGPA</div>
                      <div className="mt-2 text-3xl font-black text-emerald-950">{sgpaVal > 0 ? sgpaVal.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider opacity-85">Cumulative CGPA</div>
                      <div className="mt-2 text-3xl font-black text-slate-900">{cgpaVal > 0 ? cgpaVal.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div className={`rounded-2xl border p-5 shadow-sm ${
                      backlogsVal > 0 
                        ? 'border-rose-100 bg-rose-50/40 text-rose-955' 
                        : 'border-emerald-100 bg-emerald-50/40 text-emerald-955'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wider opacity-85">Active Backlogs</div>
                      <div className="mt-2 text-3xl font-black">{backlogsVal}</div>
                    </div>
                  </div>

                  {/* Registered Courses table */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-emerald-800" />
                        <span>Semester Performance Ledger</span>
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={selectedSemester}
                          onChange={(e) => setSelectedSemester(e.target.value)}
                          className="rounded-2xl border border-slate-350 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 focus:border-emerald-600 focus:outline-none"
                        >
                          <option value="All">All Semesters</option>
                          <option value="1">I Year I Semester (1-1)</option>
                          <option value="2">I Year II Semester (1-2)</option>
                          <option value="3">II Year I Semester (2-1)</option>
                          <option value="4">II Year II Semester (2-2)</option>
                          <option value="5">III Year I Semester (3-1)</option>
                          <option value="6">III Year II Semester (3-2)</option>
                          <option value="7">IV Year I Semester (4-1)</option>
                          <option value="8">IV Year II Semester (4-2)</option>
                        </select>

                        {selectedSemesterSGPA !== null && (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-250 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                            <span>Semester SGPA: {selectedSemesterSGPA}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedSemester !== 'All' && (() => {
                      const semMeta = getSemesterMetadata(selectedSemester);
                      if (!semMeta.memo_no && !semMeta.serial_no && !semMeta.exam_date && !semMeta.issue_date) return null;
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 mb-4 rounded-2xl bg-slate-50 border border-slate-205">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memo Number</div>
                            <div className="text-xs font-bold text-slate-800 mt-0.5">{semMeta.memo_no || '-'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serial Number</div>
                            <div className="text-xs font-bold text-slate-800 mt-0.5">{semMeta.serial_no || '-'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Month/Year</div>
                            <div className="text-xs font-bold text-slate-800 mt-0.5">{semMeta.exam_date || '-'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Issue</div>
                            <div className="text-xs font-bold text-slate-800 mt-0.5">{semMeta.issue_date || '-'}</div>
                          </div>
                          {semMeta.total_credits && (
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Credits</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">{semMeta.total_credits}</div>
                            </div>
                          )}
                          {semMeta.pass_status && (
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Result Status</div>
                              <div className="text-xs font-black text-emerald-800 mt-0.5">{semMeta.pass_status}</div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {filteredSubjects.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-8">
                        No subject marks entered for this filter.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Subject Code</th>
                              <th className="px-4 py-3">Subject Name</th>
                              <th className="px-4 py-3 text-center">Semester</th>
                              <th className="px-4 py-3 text-center">Credits</th>
                              <th className="px-4 py-3 text-center">Grade Secured</th>
                              <th className="px-4 py-3 text-center">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSubjects.map((sub: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-55/30 transition">
                                <td className="px-4 py-3 font-mono font-bold text-slate-600">{sub.code || '-'}</td>
                                <td className="px-4 py-3 font-semibold text-slate-900">{sub.name}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{semesterLabels[sub.semester]?.short || `Sem ${sub.semester}`}</td>
                                <td className="px-4 py-3 text-center font-semibold text-slate-650">{sub.credits ?? '-'}</td>
                                <td className="px-4 py-3 text-center font-bold text-slate-900">{sub.gpa ?? '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
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

                  {/* Recharts Analytics Charts */}
                  {subjects.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Trend line */}
                      {gpaChartData.length > 0 && (
                        <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-5 w-5 text-emerald-800" />
                            <h4 className="text-sm font-bold text-slate-800">Semester-wise GPA Track</h4>
                          </div>
                          <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={gpaChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 101, 93, 0.15)" />
                                <XAxis dataKey="name" stroke="#60756d" fontSize={10} fontWeight={600} />
                                <YAxis stroke="#60756d" domain={[0, 10]} fontSize={10} fontWeight={600} />
                                <Tooltip />
                                <Line type="monotone" dataKey="GPA" stroke="#1c5644" strokeWidth={3} dot={{ r: 4 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Subject bar chart */}
                      {subjectChartData.length > 0 && (
                        <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-5 w-5 text-orange-600" />
                            <h4 className="text-sm font-bold text-slate-800">
                              {selectedSemester === 'All' ? 'Overall Subject Grade Points' : `Sem ${selectedSemester} Subject Grade Points`}
                            </h4>
                          </div>
                          <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={subjectChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 101, 93, 0.15)" />
                                <XAxis dataKey="name" stroke="#60756d" fontSize={9} tickFormatter={(v) => v.length > 12 ? `${v.substring(0, 12)}...` : v} />
                                <YAxis stroke="#60756d" domain={[0, 10]} fontSize={10} fontWeight={600} />
                                <Tooltip />
                                <Bar dataKey="GPA" fill="#d47b10" radius={[5, 5, 0, 0]} barSize={20} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Professional Analysis Card */}
                  {subjects.length > 0 && analysis && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <div className="rounded-[28px] border border-slate-150 bg-[linear-gradient(180deg,#ffffff,#fafcfb)] p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3">
                          <Sparkles className="h-5 w-5 text-emerald-800 opacity-20" />
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                          <Sparkles className="h-4.5 w-4.5 text-emerald-800" />
                          <span>AI Academic Profiler (Academic Insights)</span>
                        </h3>

                        <div className="grid gap-6 md:grid-cols-3">
                          {/* Left: Placement Readiness Gauge */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-center">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                              <span className="flex items-center gap-1.5">
                                <Target className="h-4 w-4 text-emerald-700" />
                                Placement Readiness
                              </span>
                              <span className="font-extrabold text-slate-900">{analysis.placementScore}%</span>
                            </div>
                            <div className="w-full bg-slate-150 rounded-full h-2 mb-3">
                              <div 
                                className="bg-[linear-gradient(90deg,#1c5644,#34d399)] h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${analysis.placementScore}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-450 leading-relaxed">
                              Estimated placement readiness based on CGPA of {cgpaVal > 0 ? cgpaVal.toFixed(2) : 'N/A'} and {backlogsVal} active backlogs.
                            </p>
                          </div>

                          {/* Middle: Key Strengths & Weaknesses */}
                          <div className="space-y-4">
                            {analysis.strengths.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1 mb-2">
                                  <Zap className="h-3.5 w-3.5 text-emerald-700 fill-emerald-100" />
                                  Key Strengths
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {analysis.strengths.map((str: string, idx: number) => (
                                    <span key={idx} className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                                      {str}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {analysis.weaknesses.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-amber-905 uppercase tracking-wide flex items-center gap-1 mb-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-605" />
                                  Focus Subject Areas
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {analysis.weaknesses.map((weak: string, idx: number) => (
                                    <span key={idx} className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
                                      {weak}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: Performance Momentum */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-center">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                              Performance Momentum
                            </h4>
                            <div className="flex items-start gap-3">
                              {analysis.momentum === 'up' ? (
                                <>
                                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-850 shrink-0">
                                    <ArrowUpRight className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">Upward Trajectory</p>
                                    <p className="text-[10px] text-slate-505 mt-1 font-semibold">+{analysis.momentumVal} GPA increase compared to the previous semester.</p>
                                  </div>
                                </>
                              ) : analysis.momentum === 'down' ? (
                                <>
                                  <div className="rounded-xl bg-rose-100 p-2 text-rose-850 shrink-0">
                                    <ArrowDownRight className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-805">Downward Trajectory</p>
                                    <p className="text-[10px] text-slate-505 mt-1 font-semibold">{analysis.momentumVal} GPA drop. Action required.</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="rounded-xl bg-slate-100 p-2 text-slate-700 shrink-0">
                                    <TrendingUp className="h-5 w-5 opacity-40" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">Consistent Performance</p>
                                    <p className="text-[10px] text-slate-505 mt-1 font-semibold">Grades remain stable and aligned with academic history.</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Extracurriculars */}
              {activeTab === 'extracurriculars' && (
                <div className="space-y-6">
                  {/* Personal aspirations */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      <span>Career Goals & Personal Aspirations</span>
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Interests Column */}
                      <div className="rounded-2xl border border-emerald-50 bg-[#f0f6f3]/50 p-4">
                        <div className="flex items-center gap-1.5 text-emerald-850 mb-2">
                          <Heart className="h-4.5 w-4.5 fill-emerald-800/10 text-emerald-800" />
                          <h4 className="font-bold text-xs">Core Interests</h4>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {profile.interests?.trim() || 'No interests documented yet.'}
                        </p>
                      </div>

                      {/* Dreams Column */}
                      <div className="rounded-2xl border border-blue-50 bg-[#f1f9ff]/50 p-4">
                        <div className="flex items-center gap-1.5 text-blue-900 mb-2">
                          <Sparkles className="h-4.5 w-4.5 text-blue-800" />
                          <h4 className="font-bold text-xs">Ultimate Dream</h4>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {profile.dreams?.trim() || 'No ultimate dreams documented yet.'}
                        </p>
                      </div>

                      {/* Career Goals Column */}
                      <div className="rounded-2xl border border-orange-50 bg-[#fffaf2]/50 p-4">
                        <div className="flex items-center gap-1.5 text-orange-900 mb-2">
                          <Target className="h-4.5 w-4.5 text-orange-850" />
                          <h4 className="font-bold text-xs">Who they want to become</h4>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {profile.career_goals?.trim() || 'No career goals specified.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Clubs & Orgs */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-800" />
                      <span>Clubs & Student Organizations</span>
                    </h3>

                    {clubsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        Not active in any student clubs.
                      </p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {clubsList.map((club: any, index: number) => (
                          <div key={index} className="rounded-2xl bg-slate-50 p-4 border border-slate-150 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                              {club.logo ? (
                                <img src={club.logo} alt={club.name} className="h-full w-full object-cover" />
                              ) : (
                                <Users className="h-4 w-4 text-emerald-850" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-805 leading-tight">{club.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{club.role}</div>
                              <div className="text-[9px] font-semibold text-slate-500 mt-0.5">Joined: {club.joined}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certifications */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-emerald-800" />
                      <span>Certifications & Achievements</span>
                    </h3>

                    {certificationsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        No certifications registered.
                      </p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {certificationsList.map((item: any, index: number) => (
                          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between min-h-[120px] shadow-sm">
                            <div>
                              <div className="font-bold text-slate-800 text-xs leading-snug">{item.name}</div>
                              
                              {item.image && (
                                <div 
                                  onClick={() => setSelectedCertImage(item.image)}
                                  className="mt-2.5 relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 cursor-pointer group hover:brightness-95 transition"
                                  title="Click to view full certificate"
                                >
                                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[9px] font-bold gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    <span>Expand</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              {item.link ? (
                                <a 
                                  href={item.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
                                >
                                  <span>Verify credential</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No link provided</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* Full Screen Lightbox Preview for Certificates inside Modal */}
      {selectedCertImage && (
        <div 
          onClick={() => setSelectedCertImage(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2 border border-white/10 shadow-2xl flex flex-col items-center animate-scale-in"
          >
            <button 
              onClick={() => setSelectedCertImage(null)}
              className="absolute right-4 top-4 rounded-full p-2 bg-slate-900/80 text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={selectedCertImage} alt="Certificate Document" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
