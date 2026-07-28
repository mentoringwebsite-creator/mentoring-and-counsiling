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
  GraduationCap, AlertTriangle, ShieldCheck, Zap, 
  ArrowUpRight, ArrowDownRight, Trophy, Activity, MessageSquare,
  ArrowLeft, Laptop, ShieldAlert, Briefcase, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, CartesianGrid, XAxis, YAxis, LabelList, Legend
} from 'recharts';

import { getStudentAcademicData } from '@/lib/studentAcademicService';
import { PlacementEligibilityCard } from '@/components/placement-eligibility-card';

const hodSidebarItems = [
  { href: '/hod', label: 'HOD Dashboard' },
  { href: '/hod/faculty', label: 'Faculty & Mentors' },
  { href: '/hod/students', label: 'Students' },
  { href: '/hod/queries', label: 'Student Queries' }
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

export default function HodStudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentUserId = params.studentId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'academics' | 'extracurriculars'>('academics');
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSkillsPie, setShowSkillsPie] = useState(true);
  const [mentorName, setMentorName] = useState<string>('Loading...');
  const [hodName, setHodName] = useState<string>('Loading...');

  const profileRaw = student?.student_profiles?.[0] || {};
  let alternatePhoneVal = profileRaw.alternate_phone || '';
  let linkedinUrlVal = '';
  let resumeUrlVal = '';

  if (alternatePhoneVal?.startsWith('{')) {
    try {
      const parsedJson = JSON.parse(alternatePhoneVal);
      alternatePhoneVal = parsedJson.phone || '';
      linkedinUrlVal = parsedJson.linkedin || '';
      resumeUrlVal = parsedJson.resume || '';
    } catch (e) {
      console.error('Failed to parse serialized alternate_phone:', e);
    }
  }

  const profile = {
    ...profileRaw,
    alternate_phone: alternatePhoneVal,
    linkedin_url: profileRaw.linkedin_url || linkedinUrlVal || '',
    resume_url: profileRaw.resume_url || resumeUrlVal || ''
  };

  const subjects = profile.academic_subjects || [];

  const rawInterests = profile.interests || '';
  let parsedInterests = rawInterests;
  let parsedSkills: any[] = [];
  if (rawInterests.includes('||skills:')) {
    const parts = rawInterests.split('||skills:');
    parsedInterests = parts[0] || '';
    try {
      parsedSkills = JSON.parse(parts[1]);
    } catch {
      parsedSkills = DEFAULT_SKILLS;
    }
  } else {
    parsedSkills = DEFAULT_SKILLS;
  }

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

        setStudent({
          ...userDb,
          student_profiles: [profileData]
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

  const academicSummary = getStudentAcademicData(profile);
  const {
    cgpaVal,
    backlogsVal,
    attendanceVal,
    sgpaTrendData,
    backlogChartData,
    placementEligibility,
    skillsList,
    clubs,
    certifications,
    hasAcademicData
  } = academicSummary;

  const risk = getRiskLevel(cgpaVal ?? 8.0, backlogsVal ?? 0);
  const placementEligible = placementEligibility.status === 'Eligible';

  if (!mounted) return null;

  return (
    <ProtectedRoute role="hod">
      <PageShell title="Student Details" subtitle="Student profile and academic insights">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/hod/students" items={hodSidebarItems} />

          <div className="space-y-5 w-full min-w-0">
            {/* Back Button */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => router.push('/hod/students')} 
                className="group inline-flex items-center gap-2 text-xs font-bold text-emerald-805 hover:text-emerald-955 transition-all duration-250 bg-emerald-50/50 hover:bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-150 shadow-sm select-none cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Students</span>
              </button>
            </div>

            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading student profile...</span>
                </div>
              </div>
            ) : error ? (
              <div className="portal-card flex flex-col items-center justify-center text-rose-800 p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-rose-500 mb-3" />
                <p className="font-bold text-lg">Error Loading Profile</p>
                <p className="text-sm mt-1 text-rose-600 max-w-md">{error}</p>
              </div>
            ) : !student ? (
              <div className="portal-card flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <User className="h-12 w-12 text-slate-350 mb-3" />
                <p className="font-bold text-lg">Student Not Found</p>
                <p className="text-sm mt-1 text-slate-500">The requested student could not be located.</p>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                
                {/* Profile Header Banner */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  <div className="h-24 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-855" />
                  
                  <div className="px-6 pb-6 pt-0">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-center -mt-12 md:-mt-16 relative z-10">
                      <div className="h-[140px] w-[140px] sm:h-[160px] sm:w-[160px] md:h-[185px] md:w-[185px] lg:h-[210px] lg:w-[210px] xl:h-[230px] xl:w-[230px] rounded-[32px] overflow-hidden border-[5px] border-white shadow-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {profile.profile_photo ? (
                          <img
                            src={profile.profile_photo}
                            alt={student?.name || 'Student'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(student?.name || 'Student')}`;
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-150 to-slate-200 text-slate-400">
                            <User className="h-20 w-20 md:h-24 md:w-24 text-slate-355" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full text-center md:text-left pb-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-100/90">
                          <div className="flex flex-col items-start justify-center">
                            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight leading-none mb-0">{student?.name}</h2>
                            <p className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-2">{profile.roll_number || 'N/A'} • B.Tech Student</p>
                          </div>
                          
                          <div className="flex justify-center sm:justify-start">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-widest border shadow-sm ${
                              risk === 'High' ? 'bg-rose-50 text-rose-700 border-rose-205' :
                              risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                              'bg-emerald-50 text-emerald-700 border-emerald-205'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                risk === 'High' ? 'bg-rose-500 animate-pulse' :
                                risk === 'Medium' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`} />
                              {risk} Risk Status
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-1 text-left">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs border-b border-slate-50/60 pb-1.5">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Department</span>
                              <span className="font-bold text-slate-750 uppercase">{profile.branch || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-b border-slate-50/60 pb-1.5">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Section</span>
                              <span className="font-bold text-slate-755">Section {profile.section || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Year of Study</span>
                              <span className="font-bold text-emerald-805">{getStudentBTechYear(profile.roll_number, profile.academic_year)}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs border-b border-slate-50/60 pb-1.5">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Assigned Mentor</span>
                              <span className="font-bold text-slate-700 truncate max-w-[160px] inline-block" title={mentorName}>{mentorName}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-b border-slate-50/60 pb-1.5">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Assigned HOD</span>
                              <span className="font-bold text-slate-700 truncate max-w-[160px] inline-block" title={hodName}>{hodName}</span>
                            </div>
                            {profile.phone && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Mobile Phone</span>
                                <span className="font-mono font-bold text-slate-800">{profile.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Tab Navigation Bar with Mentor Portal Styling */}
                <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 py-2.5 transition-all">
                  <div className="flex bg-white rounded-xl p-1 border border-slate-200 max-w-lg shadow-sm">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                        activeTab === 'profile'
                          ? 'bg-emerald-800 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      General Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('academics')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                        activeTab === 'academics'
                          ? 'bg-emerald-800 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Academics & Analytics
                    </button>
                    <button
                      onClick={() => setActiveTab('extracurriculars')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                        activeTab === 'extracurriculars'
                          ? 'bg-emerald-800 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Extracurriculars & Goals
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT VIEWS */}
                <div className="space-y-5">
                  
                  {/* GENERAL PROFILE TAB (Matches Mentor Portal layout) */}
                  {activeTab === 'profile' && (
                    <div className="grid gap-5 md:grid-cols-3">
                      {/* Demographics Card */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <User className="h-4.5 w-4.5 text-emerald-805" />
                          <span>Student Demographics & Bio</span>
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</div>
                            <div className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-slate-450" />
                              <span>{profile.dob ? new Date(profile.dob).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not Specified'}</span>
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch / Course</div>
                            <div className="mt-1 text-sm font-semibold text-slate-800">{profile.branch || 'Not Specified'}</div>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</div>
                            <div className="mt-1 text-sm font-semibold text-slate-800">Section {profile.section || 'N/A'}</div>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Academic Year</div>
                            <div className="mt-1 text-sm font-semibold text-slate-800">{profile.academic_year || 'Not Specified'}</div>
                          </div>
                          <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-100">
                            <div className="text-[10px] font-bold text-emerald-805 uppercase tracking-wider">B.Tech Year</div>
                            <div className="mt-1 text-sm font-bold text-emerald-955">{getStudentBTechYear(profile.roll_number, profile.academic_year)}</div>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role & Status</div>
                            <div className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              <span>Approved Student</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Directory */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Phone className="h-4.5 w-4.5 text-emerald-805" />
                          <span>Contact Directory</span>
                        </h3>
                        <div className="space-y-3">
                          <div className="rounded-xl border border-slate-150 p-3.5 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-805 shrink-0">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Official Email</div>
                              <a href={student?.email ? `mailto:${student.email}` : '#'} className="text-xs font-semibold text-slate-800 hover:text-emerald-700 break-all block">{student?.email || 'N/A'}</a>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-150 p-3.5 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-850 shrink-0">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</div>
                              <span className="text-xs font-mono font-bold text-slate-800">{profile.phone || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-150 p-3.5 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-655 shrink-0">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alternate Contact</div>
                              <span className="text-xs font-mono font-bold text-slate-800">{profile.alternate_phone || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="rounded-xl border border-slate-150 p-3.5 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                              <Linkedin className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn Profile</div>
                              {profile.linkedin_url ? (
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 hover:underline truncate block">View LinkedIn Profile ↗</a>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">Not provided</span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-150 p-3.5 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Resume Document</div>
                              {profile.resume_url ? (
                                <a href={profile.resume_url} download="resume.pdf" className="text-xs font-bold text-[#1c5644] hover:underline flex items-center gap-1 mt-0.5">
                                  <span>Download Resume PDF</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">No file uploaded</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACADEMICS & ANALYTICS TAB */}
                  {activeTab === 'academics' && (
                    <div className="space-y-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        {/* SGPA Semester Trend */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[290px] flex flex-col hover:shadow-md transition duration-200">
                          <div 
                            onClick={() => router.push(`/hod/students/${studentUserId}/academics` as any)}
                            className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 shrink-0 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition"
                          >
                            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                              <TrendingUp className="h-4 w-4 text-emerald-805" />
                              <span>SGPA Semester Trend</span>
                            </h4>
                            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                              CGPA: {cgpaVal !== null ? cgpaVal.toFixed(2) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex-1 min-h-0 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={sgpaTrendData} margin={{ top: 10, right: 5, left: -28, bottom: 2 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} fontWeight={600} />
                                <YAxis stroke="#94a3b8" domain={[0, 10]} fontSize={8} fontWeight={600} />
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '9px' }} />
                                <Bar 
                                  onClick={(data: any) => { 
                                    if (data && data.name) { 
                                      const semNum = data.name.replace('Sem ', '').trim(); 
                                      router.push(`/hod/students/${studentUserId}/academics?semester=${semNum}` as any);
                                    } else {
                                      router.push(`/hod/students/${studentUserId}/academics` as any);
                                    }
                                  }} 
                                  style={{ cursor: 'pointer' }}
                                  name="Student" 
                                  dataKey="Student" 
                                  fill="#1c5644" 
                                  radius={[3, 3, 0, 0]} 
                                  barSize={14}
                                >
                                  <LabelList dataKey="Student" position="top" style={{ fontSize: '8px', fill: '#1c5644', fontWeight: 'bold' }} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Skills Breakdown */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[290px] flex flex-col hover:shadow-md transition duration-200">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 shrink-0">
                            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                              <Trophy className="h-4 w-4 text-emerald-850" />
                              <span>Skills Breakdown</span>
                            </h4>
                            <button 
                              onClick={() => setActiveTab('extracurriculars')}
                              className="text-[9px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition select-none shadow-sm cursor-pointer"
                            >
                              Show Certs & Clubs
                            </button>
                          </div>
                          <div className="flex-1 min-h-0 w-full cursor-pointer" onClick={() => setActiveTab('extracurriculars')}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={skillsList.slice(0, 6)}
                                  cx="50%"
                                  cy="42%"
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={3}
                                  dataKey="level"
                                  nameKey="name"
                                  onClick={() => setActiveTab('extracurriculars')}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {skillsList.slice(0, 6).map((entry: any, index: number) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={SKILLS_COLORS[index % SKILLS_COLORS.length]}
                                      style={{ cursor: 'pointer' }}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '9px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Backlog Overview & Placement Eligibility Side by Side */}
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[290px] flex flex-col hover:shadow-md transition duration-200">
                          <div 
                            onClick={() => router.push(`/hod/students/${studentUserId}/academics` as any)}
                            className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 shrink-0 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition"
                          >
                            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                              <ShieldAlert className="h-4 w-4 text-rose-605" />
                              <span>Backlog Overview</span>
                            </h4>
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold border ${
                              backlogsVal === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                            }`}>
                              <AlertTriangle className="h-3 w-3" />
                              <span>{backlogsVal === 0 ? 'Clear (0)' : `${backlogsVal} Active`}</span>
                            </span>
                          </div>
                          <div className="flex-1 min-h-0 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={backlogChartData} margin={{ top: 15, right: 10, left: -25, bottom: 2 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} fontWeight={600} />
                                <YAxis stroke="#94a3b8" fontSize={8} fontWeight={600} allowDecimals={false} domain={[0, 'dataMax + 1']} />
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '9px' }} />
                                <Bar 
                                  onClick={(data: any) => { 
                                    if (data && data.name) { 
                                      const semNum = data.name.replace('Sem ', '').trim(); 
                                      router.push(`/hod/students/${studentUserId}/academics?semester=${semNum}` as any);
                                    } else {
                                      router.push(`/hod/students/${studentUserId}/academics` as any);
                                    }
                                  }} 
                                  style={{ cursor: 'pointer' }}
                                  name="Backlogs" 
                                  dataKey="Backlogs" 
                                  fill="#f59e0b" 
                                  radius={[3, 3, 0, 0]} 
                                  barSize={12}
                                >
                                  <LabelList dataKey="Backlogs" position="top" style={{ fontSize: '8px', fill: '#f59e0b', fontWeight: 'bold' }} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Placement Eligibility */}
                        <PlacementEligibilityCard 
                          cgpa={cgpaVal} 
                          backlogs={backlogsVal} 
                          attendance={attendanceVal}
                          className="h-[290px]"
                        />
                      </div>

                    </div>
                  )}

                  {/* EXTRACURRICULARS & GOALS TAB */}
                  {activeTab === 'extracurriculars' && (
                    <div className="space-y-5">
                      <div className="grid gap-5 md:grid-cols-2">
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
                            <p className="text-xs text-slate-455 italic">Student has not joined any clubs.</p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Award className="h-4.5 w-4.5 text-emerald-805" />
                            <span>Certifications & Achievements</span>
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
                            <p className="text-xs text-slate-455 italic">No certifications recorded.</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Sparkles className="h-4.5 w-4.5 text-emerald-705" />
                          <span>Personal Goals & Core Interests</span>
                        </h3>
                        <div className="grid gap-5 md:grid-cols-3">
                          <div className="rounded-xl bg-[#f0f6f3]/80 border border-slate-100 p-4">
                            <h4 className="font-bold text-emerald-800 text-xs mb-2 flex items-center gap-1.5">
                              <Heart className="h-3.5 w-3.5 fill-emerald-800/10" />
                              <span>Core Interests</span>
                            </h4>
                            <p className="text-xs text-slate-650 font-medium whitespace-pre-wrap leading-relaxed">
                              {parsedInterests.trim() || DEFAULT_INTERESTS}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#f0faf7]/80 border border-slate-100 p-4">
                            <h4 className="font-bold text-emerald-905 text-xs mb-2 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Biggest Dream</span>
                            </h4>
                            <p className="text-xs text-slate-650 font-medium whitespace-pre-wrap leading-relaxed">
                              {profile.dreams?.trim() || DEFAULT_DREAMS}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#fffaf2]/80 border border-slate-100 p-4">
                            <h4 className="font-bold text-amber-800 text-xs mb-2 flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5" />
                              <span>Who I Want to Become</span>
                            </h4>
                            <p className="text-xs text-slate-650 font-medium whitespace-pre-wrap leading-relaxed">
                              {profile.career_goals?.trim() || DEFAULT_CAREER_GOALS}
                            </p>
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
