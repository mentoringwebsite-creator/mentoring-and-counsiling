'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { 
  Loader2, X, User, Mail, Phone, Calendar, BookOpen, 
  TrendingUp, BarChart3, Sparkles, Heart, Target, 
  Award, Users, ExternalLink, Image as ImageIcon, 
  GraduationCap, AlertTriangle, ShieldCheck, Zap, 
  ArrowUpRight, ArrowDownRight, Trophy, Activity, MessageSquare,
  ArrowLeft, Laptop, ShieldAlert
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, LabelList, Legend
} from 'recharts';

const facultySidebarItems = [
  { href: '/faculty', label: 'Faculty Dashboard' },
  { href: '/faculty/profile', label: 'Profile' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/notes', label: 'Mentor Notes' }
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

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentUserId = params.studentId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'academics' | 'extracurriculars'>('academics');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedCertImage, setSelectedCertImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSkillsPie, setShowSkillsPie] = useState(true);
  const [mentorName, setMentorName] = useState<string>('Loading...');
  const [hodName, setHodName] = useState<string>('Loading...');
  const [chartSemester, setChartSemester] = useState<string>('6');

  const profile = student?.student_profiles?.[0] || {};
  const subjects = profile.academic_subjects || [];

  const rawInterests = profile.interests || '';
  let parsedInterests = rawInterests;
  let parsedSkills = DEFAULT_SKILLS;
  if (rawInterests.includes('||skills:')) {
    const parts = rawInterests.split('||skills:');
    parsedInterests = parts[0];
    const skillStr = parts[1];
    parsedSkills = skillStr.trim() ? skillStr.split(',').map((s: string) => {
      const item = s.trim();
      if (item.includes(':')) {
        const [name, lvl] = item.split(':');
        return { name: name.trim(), level: parseInt(lvl) || 80 };
      }
      return { name: item, level: 80 };
    }).filter((item: any) => item.name) : [];
  } else if (rawInterests.trim() !== '') {
    parsedSkills = [];
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trigger default selection to highest sem
  useEffect(() => {
    if (subjects.length > 0) {
      const sems = subjects.map((s: any) => parseInt(s.semester)).filter((s: number) => !isNaN(s));
      if (sems.length > 0) {
        setChartSemester(Math.max(...sems).toString());
      }
    }
  }, [subjects]);

  useEffect(() => {
    if (!studentUserId) return;

    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('users')
          .select(`
            id, name, email,
            student_profiles!user_id (
              roll_number, branch, section, academic_year, phone, alternate_phone, dob, profile_photo,
              cgpa, backlogs, sgpa, academic_subjects, interests, dreams, career_goals, clubs, certifications, mentor_id
            )
          `)
          .eq('id', studentUserId)
          .single();

        if (dbError) throw dbError;
        setStudent(data);

        // Fetch Mentor and HOD Info
        const studentProfile = data?.student_profiles?.[0];
        try {
          const response = await fetch('/api/student/mentor-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              mentorId: studentProfile?.mentor_id || null, 
              branch: studentProfile?.branch || '' 
            })
          });
          
          if (response.ok) {
            const resData = await response.json();
            if (resData.success) {
              setMentorName(resData.mName || 'Not Assigned');
              setHodName(resData.hName || 'Not Assigned');
            } else {
              setMentorName('Not Assigned');
              setHodName('Not Assigned');
            }
          }
        } catch (err) {
          console.error('Failed to fetch mentor/HOD info:', err);
          setMentorName('Not Assigned');
          setHodName('Not Assigned');
        }

      } catch (err: any) {
        console.error('Error fetching student details:', err);
        setError(err.message || 'Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentUserId]);

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

  const cgpaVal = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : dynamicStats.cgpa;
  const backlogsVal = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : dynamicStats.backlogs;
  const risk = getRiskLevel(cgpaVal, backlogsVal);

  // SGPA trend data
  const sgpaTrendData = (() => {
    const semData: Record<number, { totalPoints: number; totalCredits: number }> = {};
    subjects.forEach((sub: any) => {
      const sem = parseInt(sub.semester);
      if (isNaN(sem)) return;
      const gp = convertGradeToGP(sub.gpa);
      const credits = parseFloat(sub.credits) || 0;
      if (gp !== null && credits > 0) {
        if (!semData[sem]) {
          semData[sem] = { totalPoints: 0, totalCredits: 0 };
        }
        semData[sem].totalPoints += gp * credits;
        semData[sem].totalCredits += credits;
      }
    });

    const sortedSems = Object.keys(semData).map(Number).sort((a, b) => a - b);
    return sortedSems.map((sem) => {
      const gpa = Number((semData[sem].totalPoints / semData[sem].totalCredits).toFixed(2));
      return { name: `Sem ${sem}`, Student: gpa };
    });
  })();

  // Filtered Subject Marks for Bar Chart
  const subjectMarksData = (() => {
    const semNum = parseInt(chartSemester);
    if (isNaN(semNum)) return [];

    return subjects
      .filter((s: any) => parseInt(s.semester) === semNum)
      .map((s: any) => {
        const marksVal = parseInt(s.marks);
        const subjectName = String(s.subject_name || s.subject_code || 'Unknown Subject');
        const nameClean = subjectName.length > 10 ? s.subject_code || subjectName.substring(0, 10) : subjectName;
        return {
          name: nameClean,
          Marks: isNaN(marksVal) ? 0 : marksVal
        };
      });
  })();

  // Backlogs Bar Chart Data
  const backlogData = (() => {
    const semBacklogs: Record<number, number> = {};
    subjects.forEach((sub: any) => {
      const sem = parseInt(sub.semester);
      if (isNaN(sem)) return;
      const gp = convertGradeToGP(sub.gpa);
      const isF = sub.gpa === 'F' || sub.result === 'F' || sub.result === 'FAIL' || (gp !== null && gp < 4.0);
      if (isF) {
        semBacklogs[sem] = (semBacklogs[sem] || 0) + 1;
      }
    });

    const sortedSems = Object.keys(semBacklogs).map(Number).sort((a, b) => a - b);
    return sortedSems.map((sem) => ({
      name: `Sem ${sem}`,
      Backlogs: semBacklogs[sem]
    }));
  })();

  // Extracurricular Data for Pie Chart
  const extracurricularData = (() => {
    if (showSkillsPie) {
      const currentSkills = parsedSkills.length > 0 ? parsedSkills : DEFAULT_SKILLS;
      return currentSkills.slice(0, 6).map((skill: any) => ({
        name: skill.name,
        value: skill.level
      }));
    } else {
      const clubsCount = (profile.clubs || DEFAULT_CLUBS).length;
      const certsCount = (profile.certifications || DEFAULT_CERTS).length;
      return [
        { name: 'Clubs Joined', value: clubsCount },
        { name: 'Certifications', value: certsCount }
      ];
    }
  })();

  const clubs = profile.clubs || DEFAULT_CLUBS;
  const certifications = profile.certifications || DEFAULT_CERTS;

  if (!mounted) {
    return (
      <ProtectedRoute role="faculty">
        <PageShell title="Student Details" subtitle="Student profile and academic insights">
          <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
            <Sidebar active="/faculty/students" items={facultySidebarItems} />
            <div className="space-y-6 w-full min-w-0">
              <button 
                onClick={() => router.back()} 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 transition select-none"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to My Students</span>
              </button>
              <div className="portal-card flex h-[350px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              </div>
            </div>
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="faculty">
      <PageShell title="Student Details" subtitle="Student profile and academic insights">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty/students" items={facultySidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Native SPA Back Button */}
            <button 
              onClick={() => router.back()} 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 transition select-none"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to My Students</span>
            </button>

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
              <div className="space-y-6">
                
                {/* Redesigned Premium Profile Header */}
                <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  {/* Cover Banner */}
                  <div className="h-28 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800" />
                  
                  <div className="px-6 pb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-16 sm:-mt-20 lg:-mt-24 relative z-10">
                      {/* Enlarged circular image with boundary rules */}
                      <div className="h-[115px] w-[115px] sm:h-[125px] sm:w-[125px] md:h-[145px] md:w-[145px] lg:h-[175px] lg:w-[175px] rounded-full overflow-hidden border-4 md:border-[6px] border-white shadow-2xl bg-slate-100 flex items-center justify-center shrink-0">
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
                          <User className="h-16 w-16 text-emerald-200" />
                        )}
                      </div>

                      {/* Header Info Details - Grid structure to reduce height */}
                      <div className="flex-1 w-full text-center md:text-left pb-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                          <h2 className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">{student?.name}</h2>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            risk === 'High' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            risk === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {risk} Risk Status
                          </span>
                        </div>

                        {/* Demographics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 mt-3 text-left">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Roll Number</span>
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 inline-block mt-0.5">{profile.roll_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
                            <span className="text-xs font-bold text-slate-800 uppercase mt-0.5 block">{profile.branch || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Section & Year</span>
                            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                              Sec: {profile.section || '-'} | <span className="text-emerald-800">{getStudentBTechYear(profile.roll_number, profile.academic_year)}</span>
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cumulative GPA</span>
                            <span className="text-xs font-bold text-emerald-805 mt-0.5 block">{cgpaVal.toFixed(2)} / 10.00</span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Mentor</span>
                            <span className="text-xs font-bold text-slate-850 mt-0.5 truncate block" title={mentorName}>{mentorName}</span>
                          </div>
                          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned HOD</span>
                            <span className="text-xs font-bold text-slate-850 mt-0.5 truncate block" title={hodName}>{hodName}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-t border-slate-100 bg-slate-50/50 px-6">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`border-b-2 px-4 py-3 text-xs font-bold transition-all duration-200 ${
                        activeTab === 'profile'
                          ? 'border-emerald-700 text-emerald-800'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      General Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('academics')}
                      className={`border-b-2 px-4 py-3 text-xs font-bold transition-all duration-200 ${
                        activeTab === 'academics'
                          ? 'border-emerald-700 text-emerald-800'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Academics & Analytics
                    </button>
                    <button
                      onClick={() => setActiveTab('extracurriculars')}
                      className={`border-b-2 px-4 py-3 text-xs font-bold transition-all duration-200 ${
                        activeTab === 'extracurriculars'
                          ? 'border-emerald-700 text-emerald-800'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Extracurriculars & Goals
                    </button>
                  </div>
                </div>

                {/* Tab content space */}
                <div className="space-y-6">
                  
                  {/* Tab 1: Profile */}
                  {activeTab === 'profile' && (
                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Demographics Card */}
                      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <User className="h-4.5 w-4.5 text-emerald-700" />
                          <span>Student Demographics & Bio</span>
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</div>
                            <div className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-slate-450" />
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

                      {/* Contact Directory */}
                      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Phone className="h-4.5 w-4.5 text-emerald-700" />
                          <span>Contact Directory</span>
                        </h3>
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-150 p-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                              <Mail className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Official Email</div>
                              <a href={student?.email ? `mailto:${student.email}` : '#'} className="text-xs font-semibold text-slate-800 hover:text-emerald-700 break-all block">{student?.email || 'N/A'}</a>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-150 p-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-850 shrink-0">
                              <Phone className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</div>
                              <span className="text-xs font-mono font-bold text-slate-800">{profile.phone || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-150 p-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-650 shrink-0">
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      
                      {/* SGPA Semester Trend */}
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm h-[320px] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4 shrink-0">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-800" />
                            <span>SGPA Semester Trend</span>
                          </h4>
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                            CGPA: {cgpaVal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex-1 min-h-0 w-full">
                          {subjects.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={sgpaTrendData} margin={{ top: 10, right: 5, left: -28, bottom: 2 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} fontWeight={600} />
                                <YAxis stroke="#94a3b8" domain={[0, 10]} fontSize={8} fontWeight={600} />
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '9px' }} />
                                <Bar name="Student" dataKey="Student" fill="#1c5644" radius={[3, 3, 0, 0]} barSize={14}>
                                  <LabelList dataKey="Student" position="top" style={{ fontSize: '8px', fill: '#1c5644', fontWeight: 'bold' }} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-xs text-slate-400 italic">No academic data found</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subject Marks Breakdown */}
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm h-[320px] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4 shrink-0">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-emerald-800" />
                            <span>Subject Marks Breakdown</span>
                          </h4>
                          <select
                            value={chartSemester}
                            onChange={(e) => setChartSemester(e.target.value)}
                            className="rounded bg-slate-50 border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="1">1-1</option>
                            <option value="2">1-2</option>
                            <option value="3">2-1</option>
                            <option value="4">2-2</option>
                            <option value="5">3-1</option>
                            <option value="6">3-2</option>
                            <option value="7">4-1</option>
                            <option value="8">4-2</option>
                          </select>
                        </div>
                        <div className="flex-1 min-h-0 w-full">
                          {subjectMarksData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={subjectMarksData} margin={{ top: 10, right: 5, left: -28, bottom: 2 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={7} fontWeight={600} />
                                <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={8} fontWeight={600} />
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '9px' }} />
                                <Bar name="Marks" dataKey="Marks" fill="#1c5644" radius={[3, 3, 0, 0]} barSize={10}>
                                  <LabelList dataKey="Marks" position="top" style={{ fontSize: '8px', fill: '#1c5644', fontWeight: 'bold' }} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-xs text-slate-400 italic">No marks found for this semester</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills Breakdown */}
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm h-[320px] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4 shrink-0">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Trophy className="h-4 w-4 text-emerald-800" />
                            <span>{showSkillsPie ? "Skills Breakdown" : "Activity & Certs"}</span>
                          </h4>
                          <button 
                            onClick={() => setShowSkillsPie(!showSkillsPie)}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition select-none shadow-sm"
                          >
                            {showSkillsPie ? "Show Certs & Clubs" : "Show Skills"}
                          </button>
                        </div>
                        <div className="flex-1 min-h-0 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={extracurricularData}
                                cx="50%"
                                cy="45%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {extracurricularData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={showSkillsPie ? SKILLS_COLORS[index % SKILLS_COLORS.length] : PIE_COLORS[index % PIE_COLORS.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '9px' }} />
                              <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                iconType="circle"
                                iconSize={6}
                                formatter={(value, entry: any) => {
                                  const item = entry.payload;
                                  const suffix = showSkillsPie ? '%' : '';
                                  return <span className="text-[9px] font-bold text-slate-650">{value}: {item.value}{suffix}</span>;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Backlog Analysis & Review */}
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm h-[320px] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4 shrink-0">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4 text-rose-600" />
                            <span>Backlog Analysis & Review</span>
                          </h4>
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold border ${
                            backlogsVal === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                          }`}>
                            <AlertTriangle className="h-3 w-3" />
                            <span>{backlogsVal === 0 ? 'Clear (0 Backlogs)' : `${backlogsVal} Backlog(s)`}</span>
                          </span>
                        </div>
                        <div className="flex-1 min-h-0 w-full">
                          {backlogData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={backlogData} margin={{ top: 15, right: 10, left: -25, bottom: 2 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} fontWeight={600} />
                                <YAxis stroke="#94a3b8" fontSize={8} fontWeight={600} allowDecimals={false} domain={[0, 'dataMax + 1']} />
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '9px' }} />
                                <Bar name="Backlogs" dataKey="Backlogs" fill="#dc2626" radius={[3, 3, 0, 0]} barSize={12}>
                                  <LabelList dataKey="Backlogs" position="top" style={{ fontSize: '8px', fill: '#dc2626', fontWeight: 'bold' }} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-xs text-slate-450 italic">No backlogs detected! Student is clear.</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Tab 3: Extracurriculars */}
                  {activeTab === 'extracurriculars' && (
                    <div className="space-y-6">
                      
                      {/* Certifications and Clubs */}
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Clubs Card */}
                        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="h-4.5 w-4.5 text-emerald-700" />
                            <span>Student Clubs & Memberships</span>
                          </h3>
                          {clubs.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {clubs.map((club: any, i: number) => (
                                <div key={i} className="rounded-2xl border border-slate-150 p-4">
                                  <div className="font-bold text-sm text-slate-800">{club.name}</div>
                                  <div className="text-[10px] font-bold text-emerald-800 mt-1 uppercase tracking-wider">{club.role || 'Member'}</div>
                                  <div className="text-[9px] text-slate-400 mt-0.5">Joined: {club.joined || 'N/A'}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-450 italic">Student has not joined any clubs.</p>
                          )}
                        </div>

                        {/* Certifications Card */}
                        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Award className="h-4.5 w-4.5 text-emerald-700" />
                            <span>Professional Certifications</span>
                          </h3>
                          {certifications.length > 0 ? (
                            <div className="space-y-3">
                              {certifications.map((cert: any, i: number) => (
                                <div key={i} className="rounded-2xl border border-slate-150 p-4 flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-slate-800 truncate" title={cert.name}>{cert.name}</div>
                                  </div>
                                  {cert.link && (
                                    <a 
                                      href={cert.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 shrink-0"
                                    >
                                      <span>Verify</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-450 italic">No certifications recorded.</p>
                          )}
                        </div>
                      </div>

                      {/* Aspirations & Interests */}
                      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Sparkles className="h-4.5 w-4.5 text-emerald-705" />
                          <span>Personal Goals & Core Interests</span>
                        </h3>
                        <div className="grid gap-6 md:grid-cols-3">
                          <div className="rounded-2xl bg-[#f0f6f3] border border-white/60 p-4 shadow-sm">
                            <h4 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-1.5">
                              <Heart className="h-4 w-4 fill-emerald-800/10" />
                              <span>Core Interests</span>
                            </h4>
                            <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                              {parsedInterests.trim() || DEFAULT_INTERESTS}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#f0faf7] border border-white/60 p-4 shadow-sm">
                            <h4 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4" />
                              <span>Biggest Dream</span>
                            </h4>
                            <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                              {profile.dreams?.trim() || DEFAULT_DREAMS}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#fffaf2] border border-white/60 p-4 shadow-sm">
                            <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-1.5">
                              <Target className="h-4 w-4" />
                              <span>Who I Want to Become</span>
                            </h4>
                            <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
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
      </PageShell>
    </ProtectedRoute>
  );
}
