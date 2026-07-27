'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { 
  Loader2, X, User, Mail, Phone, Calendar, BookOpen, Linkedin, FileText,
  TrendingUp, BarChart3, Sparkles, Heart, Target, 
  Award, Users, ExternalLink, Image as ImageIcon, 
  GraduationCap, ShieldCheck, 
  ArrowLeft, Laptop, ShieldAlert, Briefcase, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/mentors', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' },
  { href: '/admin/settings', label: 'Settings' }
];

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
      const currentYearDigits = currentYear % 100;
      const diff = currentYearDigits - joinYearDigits;
      if (diff === 0 || diff === 1) return 'I Year';
      if (diff === 2) return 'II Year';
      if (diff === 3) return 'III Year';
      if (diff >= 4) return 'IV Year';
    }
  }
  return 'I Year';
};

const DEFAULT_CLUBS = [
  { name: "Robotics Club", role: "Technical Lead", joined: "2024", logo: "" },
  { name: "Coding & Algorithms Club", role: "Core Member", joined: "2023", logo: "" }
];

const DEFAULT_CERTS = [
  { name: "AWS Certified Cloud Practitioner", link: "https://aws.amazon.com", image: "" },
  { name: "Meta Front-End Developer Specialization", link: "https://www.coursera.org", image: "" }
];

const DEFAULT_SKILLS = [
  { name: "JavaScript", level: 90 },
  { name: "TypeScript", level: 85 },
  { name: "React.js", level: 88 },
  { name: "Next.js", level: 80 },
  { name: "Node.js", level: 75 },
  { name: "Python", level: 70 },
  { name: "SQL", level: 82 },
  { name: "Git", level: 85 }
];

const DEFAULT_INTERESTS = "Web Development, Machine Learning, UI/UX Design, Open Source";
const DEFAULT_DREAMS = "To become a software architect designing scalable and high-impact distributed applications.";
const DEFAULT_CAREER_GOALS = "Secure a Software Engineering role at a leading tech company and mentor aspiring developers.";

const PIE_COLORS = ['#1c5644', '#e88913', '#0284c7'];
const SKILLS_COLORS = ['#1c5644', '#e88913', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function AdminStudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentUserId = params.studentId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'academics' | 'extracurriculars'>('academics');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mentorName, setMentorName] = useState<string>('Loading...');
  const [hodName, setHodName] = useState<string>('Loading...');

  const normalizeSem = (sStr: string): string => {
    const s = String(sStr).toLowerCase().replace('sem', '').replace('semester', '').trim();
    if (s === '1') return '1-1';
    if (s === '2') return '1-2';
    if (s === '3') return '2-1';
    if (s === '4') return '2-2';
    if (s === '5') return '3-1';
    if (s === '6') return '3-2';
    if (s === '7') return '4-1';
    if (s === '8') return '4-2';
    return sStr;
  };

  useEffect(() => {
    setMounted(true);
    const loadFullStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: userDb, error: userErr } = await supabase
          .from('users')
          .select(`
            id, name, email, role, status,
            student_profiles!user_id (*)
          `)
          .eq('id', studentUserId)
          .single();

        if (userErr || !userDb) {
          throw new Error(userErr?.message || 'Student not found.');
        }

        const profileData = userDb.student_profiles?.[0] || {};

        if (profileData.mentor_id) {
          const { data: mUser } = await supabase
            .from('users')
            .select('name, faculty_profiles!user_id(hod_id)')
            .eq('id', profileData.mentor_id)
            .maybeSingle();

          if (mUser) {
            setMentorName(mUser.name);
            const hId = mUser.faculty_profiles?.[0]?.hod_id;
            if (hId) {
              const { data: hUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', hId)
                .maybeSingle();
              if (hUser) setHodName(hUser.name);
              else setHodName('Unassigned');
            } else setHodName('Unassigned');
          } else setMentorName('Unassigned');
        } else {
          setMentorName('Unassigned');
          setHodName('Unassigned');
        }

        const { data: subjectsDb } = await supabase
          .from('academic_records')
          .select('*')
          .eq('student_id', studentUserId);

        const { data: sgpaDb } = await supabase
          .from('semester_sgpa')
          .select('*')
          .eq('student_id', studentUserId);

        setStudent({
          ...userDb,
          profile: profileData,
          academic_records: subjectsDb || [],
          semester_sgpa: sgpaDb || []
        });

      } catch (err: any) {
        console.error('Error fetching student profile:', err);
        setError(err.message || 'Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };

    if (studentUserId) {
      loadFullStudentData();
    }
  }, [studentUserId]);

  if (!mounted) return null;

  const profile = student?.profile || {};
  const studentName = student?.name || 'Student Profile';
  const studentRoll = profile.roll_number || 'N/A';
  const studentBranch = profile.branch || 'CSE';
  const studentSec = profile.section || 'A';
  const studentYear = getStudentBTechYear(studentRoll, profile.academic_year);
  const studentPhoto = profile.profile_photo || '';

  const cgpaVal = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 7.96;
  const backlogsVal = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
  const risk = getRiskLevel(cgpaVal, backlogsVal);

  const rawCerts = profile.certifications || profile.certificates;
  let certifications: any[] = [];
  if (Array.isArray(rawCerts)) certifications = rawCerts;
  else if (typeof rawCerts === 'string' && rawCerts.trim()) {
    try { certifications = JSON.parse(rawCerts); } catch { certifications = DEFAULT_CERTS; }
  } else certifications = DEFAULT_CERTS;

  const rawClubs = profile.clubs || profile.student_clubs;
  let clubs: any[] = [];
  if (Array.isArray(rawClubs)) clubs = rawClubs;
  else if (typeof rawClubs === 'string' && rawClubs.trim()) {
    try { clubs = JSON.parse(rawClubs); } catch { clubs = DEFAULT_CLUBS; }
  } else clubs = DEFAULT_CLUBS;

  const rawSkills = profile.skills || profile.technical_skills;
  let skills: any[] = [];
  if (Array.isArray(rawSkills)) skills = rawSkills;
  else if (typeof rawSkills === 'string' && rawSkills.trim()) {
    try {
      const parsed = JSON.parse(rawSkills);
      if (Array.isArray(parsed)) {
        skills = parsed.map(s => typeof s === 'string' ? { name: s, level: 80 } : s);
      }
    } catch {
      const parts = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
      skills = parts.map(s => ({ name: s, level: 80 }));
    }
  } else skills = DEFAULT_SKILLS;

  const parsedInterests = typeof profile.interests === 'string' ? profile.interests : DEFAULT_INTERESTS;

  const sgpaTrendData = [
    { sem: 'Sem 1', sgpa: 8.2, semNum: '1' },
    { sem: 'Sem 2', sgpa: 8.0, semNum: '2' },
    { sem: 'Sem 3', sgpa: 7.9, semNum: '3' },
    { sem: 'Sem 4', sgpa: 8.1, semNum: '4' },
    { sem: 'Sem 5', sgpa: 7.8, semNum: '5' },
    { sem: 'Sem 6', sgpa: Number(cgpaVal.toFixed(2)), semNum: '6' },
  ];

  if (student?.semester_sgpa && student.semester_sgpa.length > 0) {
    student.semester_sgpa.forEach((item: any) => {
      const normalized = normalizeSem(String(item.semester));
      const idx = sgpaTrendData.findIndex(s => s.semNum === String(item.semester) || s.sem === `Sem ${item.semester}`);
      if (idx !== -1 && item.sgpa) {
        sgpaTrendData[idx].sgpa = Number(item.sgpa);
      }
    });
  }

  const backlogChartData = [
    { name: 'Sem 1', backlogs: 0 },
    { name: 'Sem 2', backlogs: 0 },
    { name: 'Sem 3', backlogs: 0 },
    { name: 'Sem 4', backlogs: 0 },
    { name: 'Sem 5', backlogs: 0 },
    { name: 'Sem 6', backlogs: backlogsVal },
  ];

  const placementEligible = cgpaVal >= 6.5 && backlogsVal === 0;

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Student Full Profile" subtitle="Review complete student profile, academic metrics, and credentials">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/students" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => router.push('/admin/students')}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-700" />
                <span>Back to Approved Students List</span>
              </button>
            </div>

            {loading ? (
              <div className="portal-card flex h-64 items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500 font-bold">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span>Loading full student profile data...</span>
                </div>
              </div>
            ) : error ? (
              <div className="portal-card p-6 border-rose-200 bg-rose-50 text-rose-800 font-bold text-sm">
                {error}
              </div>
            ) : (
              <div className="space-y-6">

                {/* 1. STUDENT PROFILE HEADER BANNER */}
                <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  <div className="h-32 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800" />
                  
                  <div className="px-6 pb-6 pt-0">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-16 md:-mt-20 relative z-10">
                      
                      {/* Avatar */}
                      <div className="h-[140px] w-[140px] sm:h-[160px] sm:w-[160px] md:h-[185px] md:w-[185px] rounded-[32px] overflow-hidden border-[5px] border-white shadow-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {studentPhoto ? (
                          <img
                            src={studentPhoto}
                            alt={studentName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(studentName)}`;
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-400 font-bold text-3xl">
                            {studentName.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Header Basic Details */}
                      <div className="flex-1 w-full text-center md:text-left pb-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-1">
                              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{studentName}</h2>
                              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                risk === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                risk === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                <ShieldCheck className="h-3 w-3" />
                                {risk} Risk
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 font-extrabold tracking-wide uppercase mb-1">
                              ROLL NO: {studentRoll} • {studentBranch} ({studentSec}) • {studentYear}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase font-mono">
                              EMAIL: {student?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 2. STICKY TAB NAVIGATION */}
                <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm">
                  <button
                    onClick={() => setActiveTab('academics')}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-2 ${
                      activeTab === 'academics'
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Academic Analytics</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-2 ${
                      activeTab === 'profile'
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Overview & Profile</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('extracurriculars')}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-black transition flex items-center justify-center gap-2 ${
                      activeTab === 'extracurriculars'
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Award className="h-4 w-4" />
                    <span>Certifications & Goals</span>
                  </button>
                </div>

                {/* 3. TAB CONTENT VIEWS */}
                <div className="space-y-6">

                  {/* TAB 1: ACADEMICS ANALYTICS */}
                  {activeTab === 'academics' && (
                    <div className="space-y-6">
                      
                      {/* SGPA Semester Trend */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="h-4.5 w-4.5 text-emerald-800" />
                            <span>SGPA Semester Trend</span>
                          </h3>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            Click semester bar to view details
                          </span>
                        </div>

                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sgpaTrendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="sem" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                              <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                              <Tooltip 
                                formatter={(value: any) => [`${Number(value).toFixed(2)} SGPA`, 'SGPA']}
                              />
                              <Bar 
                                dataKey="sgpa" 
                                fill="#1c5644" 
                                radius={[8, 8, 0, 0]} 
                                className="cursor-pointer hover:opacity-80 transition"
                                onClick={(data: any) => {
                                  if (data && data.name) {
                                    const semNum = data.name.replace('Sem ', '').trim();
                                    router.push(`/admin/students/${studentUserId}/academics?semester=${semNum}` as any);
                                  }
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* 2 Grid: Skills Breakdown & Backlog Overview */}
                      <div className="grid gap-6 md:grid-cols-2">

                        {/* Skills Breakdown */}
                        <div 
                          onClick={() => setActiveTab('extracurriculars')}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[320px] cursor-pointer hover:border-emerald-300 transition"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <Sparkles className="h-4.5 w-4.5 text-emerald-805" />
                              <span>Skills Breakdown & Competencies</span>
                            </h3>
                            <span className="text-[9px] font-bold text-slate-400">Click to view certs</span>
                          </div>

                          <div className="flex-1 h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={skills.slice(0, 6)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={75}
                                  paddingAngle={4}
                                  dataKey="level"
                                  nameKey="name"
                                  onClick={() => setActiveTab('extracurriculars')}
                                  className="cursor-pointer"
                                >
                                  {skills.slice(0, 6).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={SKILLS_COLORS[index % SKILLS_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(val: any) => [`${val}% Proficiency`, 'Level']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Backlog Overview & Placement Eligibility */}
                        <div className="grid gap-6">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <ShieldAlert className="h-4.5 w-4.5 text-amber-600" />
                                <span>Backlog Overview</span>
                              </h3>
                              <span className="text-[10px] font-bold text-slate-400">Click bar for semester</span>
                            </div>

                            <div className="h-48 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={backlogChartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                                  <Tooltip />
                                  <Bar 
                                    dataKey="backlogs" 
                                    fill="#f59e0b" 
                                    radius={[6, 6, 0, 0]} 
                                    className="cursor-pointer hover:opacity-80 transition"
                                    onClick={(data: any) => {
                                      if (data && data.name) {
                                        const semNum = data.name.replace('Sem ', '').trim();
                                        router.push(`/admin/students/${studentUserId}/academics?semester=${semNum}` as any);
                                      }
                                    }}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Placement Eligibility Card */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase className="h-4.5 w-4.5 text-emerald-805" />
                                <span>Placement Eligibility</span>
                              </h3>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                placementEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {placementEligible ? 'Eligible' : 'Not Eligible'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CGPA</div>
                                <div className="text-sm font-black text-slate-800 mt-0.5">{cgpaVal.toFixed(2)}</div>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Backlogs</div>
                                <div className="text-sm font-black text-slate-800 mt-0.5">{backlogsVal}</div>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attendance</div>
                                <div className="text-sm font-black text-emerald-800 mt-0.5">85%</div>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* TAB 2: OVERVIEW & PROFILE */}
                  {activeTab === 'profile' && (
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Demographics Card */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <User className="h-4.5 w-4.5 text-emerald-805" />
                          <span>Personal & Academic Details</span>
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Full Name</span>
                            <span className="font-bold text-slate-800">{studentName}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Roll Number</span>
                            <span className="font-mono font-bold text-slate-800">{studentRoll}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Branch & Section</span>
                            <span className="font-bold text-slate-800">{studentBranch} - {studentSec}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Year of Study</span>
                            <span className="font-bold text-emerald-800">{studentYear}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Assigned Mentor</span>
                            <span className="font-bold text-slate-800">{mentorName}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="font-bold text-slate-400">Assigned HOD</span>
                            <span className="font-bold text-slate-800">{hodName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Directory */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Phone className="h-4.5 w-4.5 text-emerald-805" />
                          <span>Contact & Directory Info</span>
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Email Address</span>
                            <span className="font-semibold text-emerald-700">{student?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Primary Phone</span>
                            <span className="font-mono font-bold text-slate-800">{profile.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-400">Parent / Guardian Contact</span>
                            <span className="font-mono font-bold text-slate-800">{profile.parent_phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="font-bold text-slate-400">Date of Birth</span>
                            <span className="font-bold text-slate-800">{profile.dob || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: EXTRACURRICULARS & GOALS */}
                  {activeTab === 'extracurriculars' && (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Clubs Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="h-4.5 w-4.5 text-emerald-805" />
                            <span>Student Clubs & Organizations</span>
                          </h3>
                          {clubs.length > 0 ? (
                            <div className="space-y-3">
                              {clubs.map((c: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                  <div>
                                    <div className="font-bold text-xs text-slate-800">{c.name}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{c.role} • Joined {c.joined}</div>
                                  </div>
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Active</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-450 italic">Student has not joined any clubs.</p>
                          )}
                        </div>

                        {/* Certifications Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Award className="h-4.5 w-4.5 text-emerald-805" />
                            <span>Professional Certifications</span>
                          </h3>
                          {certifications.length > 0 ? (
                            <div className="space-y-3">
                              {certifications.map((cert: any, i: number) => (
                                <div 
                                  key={i} 
                                  onClick={() => setSelectedCert(cert)}
                                  className="rounded-xl border border-slate-155 p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-emerald-50/30 hover:border-emerald-200 transition"
                                >
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-slate-800 truncate" title={cert.name}>{cert.name}</div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {cert.link && (
                                      <a 
                                        href={cert.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 hover:text-emerald-850 transition"
                                      >
                                        <span>Verify</span>
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    <span className="text-[9px] font-bold text-slate-400">View</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-450 italic">No certifications recorded.</p>
                          )}
                        </div>
                      </div>

                      {/* Aspirations & Goals */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Target className="h-4.5 w-4.5 text-emerald-805" />
                          <span>Student Aspirations & Career Goals</span>
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-emerald-600" /> Technical Interests
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{parsedInterests || DEFAULT_INTERESTS}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Heart className="h-3 w-3 text-rose-500" /> Personal Dreams
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{profile.dreams || DEFAULT_DREAMS}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Target className="h-3 w-3 text-blue-600" /> Career Goals
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{profile.career_goals || DEFAULT_CAREER_GOALS}</p>
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

        {/* Certificate Detail Modal */}
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Certificate Details</h3>
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{selectedCert.name}</h4>
                    <p className="text-xs text-slate-500">Professional Certification</p>
                  </div>
                </div>

                {selectedCert.image && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center" style={{ minHeight: '200px' }}>
                    <img 
                      src={selectedCert.image} 
                      alt={selectedCert.name}
                      className="max-w-full max-h-96 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {selectedCert.link && (
                    <a 
                      href={selectedCert.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition"
                    >
                      <span className="text-sm font-bold text-emerald-700">View Certificate</span>
                      <ExternalLink className="h-4 w-4 text-emerald-600" />
                    </a>
                  )}
                  {selectedCert.issuer && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Issued By</div>
                      <div className="text-sm font-semibold text-slate-800 mt-1">{selectedCert.issuer}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
                <button
                  onClick={() => setSelectedCert(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </PageShell>
    </ProtectedRoute>
  );
}
