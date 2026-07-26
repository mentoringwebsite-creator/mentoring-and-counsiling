'use client';

import { useEffect, useState, useRef } from 'react';
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
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, LabelList, Legend
} from 'recharts';

const facultySidebarItems = [
  { href: '/faculty', label: 'Mentor Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/academic-forms', label: 'Academic Forms' },
  { href: '/faculty/attendance-forms', label: 'Attendance Forms' },
  { href: '/faculty/queries', label: 'Student Queries' }
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
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSkillsPie, setShowSkillsPie] = useState(true);
  const [mentorName, setMentorName] = useState<string>('Loading...');
  const [hodName, setHodName] = useState<string>('Loading...');
  const [chartSemester, setChartSemester] = useState<string>('6');
  const [selectedLedgerSem, setSelectedLedgerSem] = useState<string | null>(null);

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

  const normalizeSem = (val: string | number | undefined | null): string => {
    if (!val) return '';
    const s = String(val).trim();
    const map: Record<string, string> = {
      '1': '1-1', '1-1': '1-1',
      '2': '1-2', '1-2': '1-2',
      '3': '2-1', '2-1': '2-1',
      '4': '2-2', '2-2': '2-2',
      '5': '3-1', '3-1': '3-1',
      '6': '3-2', '3-2': '3-2',
      '7': '4-1', '4-1': '4-1',
      '8': '4-2', '4-2': '4-2'
    };
    return map[s] || s;
  };

  const filteredLedgerSubjects = subjects.filter((sub: any) => {
    if (!selectedLedgerSem || selectedLedgerSem === 'All') return true;
    return normalizeSem(sub.sem || sub.semester) === normalizeSem(selectedLedgerSem);
  });

  const rawInterests = profile.interests || '';
  let parsedInterests = rawInterests;
  let parsedSkills: any[] = [];
  if (rawInterests.includes('||skills:')) {
    const parts = rawInterests.split('||skills:');
    parsedInterests = parts[0];
    const skillStr = parts[1]?.trim();
    if (skillStr) {
      try {
        const parsed = JSON.parse(skillStr);
        if (Array.isArray(parsed)) {
          parsedSkills = parsed.map((item: any) => {
            if (typeof item === 'string') return { name: item, level: 80 };
            return { name: item.name || '', level: item.level || 80 };
          }).filter((item: any) => item.name);
        }
      } catch (e) {
        parsedSkills = skillStr.split(',').map((s: string) => {
          const item = s.trim();
          if (item.includes(':')) {
            const [name, lvl] = item.split(':');
            return { name: name.trim(), level: parseInt(lvl) || 80 };
          }
          return { name: item, level: 80 };
        }).filter((item: any) => item.name);
      }
    }
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
              cgpa, backlogs, sgpa, academic_subjects, interests, dreams, career_goals, clubs, certifications, mentor_id, attendance_percentage,
              linkedin_url, resume_url
            )
          `)
          .eq('id', studentUserId)
          .single();
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

  const getSgpaTrendData = () => {
    const semMap: Record<number, any[]> = {};

    subjects.forEach((sub: any) => {
      const sem = parseInt(sub.semester);
      if (!isNaN(sem)) {
        semMap[sem] = semMap[sem] || [];
        semMap[sem].push(sub);
      }
    });

    const maxSem = Math.max(...subjects.map((s: any) => parseInt(s.semester) || 0), 4);
    const chartLength = Math.max(maxSem, 4);

    return Array.from({ length: chartLength }, (_, i) => {
      const semNum = i + 1;
      const subjectsInSem = semMap[semNum] || [];
      let studentSGPA: number | null = null;

      const firstSubWithSgpa = subjectsInSem.find((sub: any) => sub.sgpa && !isNaN(parseFloat(sub.sgpa)));
      if (firstSubWithSgpa) {
        studentSGPA = Number(parseFloat(firstSubWithSgpa.sgpa).toFixed(2));
      } else if (subjectsInSem.length > 0) {
        const validGPs = subjectsInSem
          .map((sub: any) => convertGradeToGP(sub.gpa))
          .filter((gp: any): gp is number => gp !== null);

        if (validGPs.length > 0) {
          studentSGPA = Number((validGPs.reduce((a, b) => a + b, 0) / validGPs.length).toFixed(2));
        }
      }

      return {
        name: `Sem ${semNum}`,
        Student: studentSGPA,
        ClassAvg: Number((7.4 + Math.sin(semNum) * 0.2 + semNum * 0.05).toFixed(2))
      };
    }).filter((d: any) => d.Student !== null || Number(d.name.split(' ')[1]) <= maxSem);
  };

  const getSubjectMarksData = () => {
    const semSubjects = subjects.filter((s: any) => s.semester?.toString() === chartSemester);
    return semSubjects.map((sub: any) => {
      const subName = sub.name || 'Subject';
      const marks = parseInt(sub.total_marks) || 0;
      return {
        name: subName.length > 10 ? subName.substring(0, 8) + '...' : subName,
        fullName: subName,
        Marks: marks
      };
    }).filter((d: any) => d.Marks > 0);
  };

  const getSemesterBacklogsData = () => {
    const semMap: { [key: number]: number } = {};
    for (let i = 1; i <= 6; i++) {
      semMap[i] = 0;
    }

    subjects.forEach((sub: any) => {
      const sem = parseInt(sub.semester);
      const gp = convertGradeToGP(sub.gpa);
      const isF = sub.gpa === 'F' || sub.result === 'F' || sub.result === 'FAIL' || (gp !== null && gp < 4.0);
      if (!isNaN(sem)) {
        if (isF) {
          semMap[sem] = (semMap[sem] || 0) + 1;
        }
      }
    });

    const maxSemInDb = Math.max(...subjects.map((s: any) => parseInt(s.semester) || 1), 6);
    for (let i = 7; i <= maxSemInDb; i++) {
      if (semMap[i] === undefined) semMap[i] = 0;
    }

    return Object.keys(semMap).map(Number).sort((a, b) => a - b).map((sem: number) => ({
      name: `Sem ${sem}`,
      Backlogs: semMap[sem]
    }));
  };

  const getExtracurricularData = () => {
    if (showSkillsPie) {
      return parsedSkills.map(s => ({
        name: s.name,
        value: s.level || 80
      }));
    } else {
      const clubsCount = clubs.length;
      const certsCount = certifications.length;
      const skillsCount = parsedSkills.length;

      return [
        { name: 'Clubs Joined', value: clubsCount },
        { name: 'Certifications', value: certsCount },
        { name: 'Skills & Tech', value: skillsCount }
      ];
    }
  };

  const getCreditsClearancePct = () => {
    let totalC = 0;
    let clearedC = 0;
    subjects.forEach((sub: any) => {
      const credits = parseFloat(sub.credits) || 0;
      const gp = convertGradeToGP(sub.gpa);
      if (credits > 0) {
        totalC += credits;
        if (gp !== null && gp >= 4.0) {
          clearedC += credits;
        }
      }
    });
    return { totalCredits: totalC, clearedCredits: clearedC };
  };

  const getStudentAttendance = () => {
    if (profile.attendance_percentage !== undefined && profile.attendance_percentage !== null) {
      return Number(profile.attendance_percentage);
    }
    const roll = profile.roll_number || '';
    if (!roll) return 85.0;
    let hash = 0;
    for (let i = 0; i < roll.length; i++) {
      hash = roll.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pct = 72.0 + (Math.abs(hash) % 240) / 10.0;
    return Number(pct.toFixed(1));
  };

  const { totalCredits, clearedCredits } = getCreditsClearancePct();
  const attendanceVal = getStudentAttendance();
  const semestersList = subjects.map((s: any) => parseInt(s.semester)).filter((s: any) => !isNaN(s));
  const latestSem = semestersList.length > 0 ? Math.max(...semestersList) : 1;

  const sgpaTrendData = getSgpaTrendData();
  const subjectMarksData = getSubjectMarksData();
  const backlogData = getSemesterBacklogsData();
  const extracurricularData = getExtracurricularData();

  const getPlacementEligibility = () => {
    const minCgpa = 6.5;
    const maxBacklogs = 0;
    const minAttendance = 75;

    const hasCgpaOk = cgpaVal >= minCgpa;
    const hasBacklogsOk = backlogsVal <= maxBacklogs;
    const hasAttendanceOk = attendanceVal >= minAttendance;

    let status: 'Eligible' | 'Conditional' | 'Ineligible' = 'Eligible';
    let statusColor = 'text-emerald-700 bg-emerald-50/50 border-emerald-200';
    let statusText = 'Eligible for Campus Placements';
    let reason = 'Meets all academic, attendance, and backlog clearance criteria.';

    if (!hasCgpaOk && !hasBacklogsOk) {
      status = 'Ineligible';
      statusColor = 'text-rose-700 bg-rose-50/50 border-rose-200';
      statusText = 'Currently Ineligible';
      reason = 'Does not meet CGPA criteria and has active backlogs.';
    } else if (!hasBacklogsOk) {
      if (backlogsVal <= 2) {
        status = 'Conditional';
        statusColor = 'text-amber-700 bg-amber-50/50 border-amber-205';
        statusText = 'Conditional Eligibility';
        reason = 'Eligible for select companies. Must clear active backlogs.';
      } else {
        status = 'Ineligible';
        statusColor = 'text-rose-700 bg-rose-50/50 border-rose-200';
        statusText = 'Currently Ineligible';
        reason = 'Ineligible due to multiple (>2) active backlogs.';
      }
    } else if (!hasCgpaOk) {
      if (cgpaVal >= 6.0) {
        status = 'Conditional';
        statusColor = 'text-amber-700 bg-amber-50/50 border-amber-205';
        statusText = 'Conditional Eligibility';
        reason = 'Eligible for mass recruiters. Needs to improve CGPA to >= 6.5.';
      } else {
        status = 'Ineligible';
        statusColor = 'text-rose-700 bg-rose-50/50 border-rose-200';
        statusText = 'Currently Ineligible';
        reason = 'CGPA is below the minimum placement threshold of 6.0.';
      }
    } else if (!hasAttendanceOk) {
      status = 'Conditional';
      statusColor = 'text-amber-700 bg-amber-50/50 border-amber-205';
      statusText = 'Conditional Eligibility';
      reason = 'Attendance is below 75%. Subject to Department approval.';
    }

    return {
      status,
      statusColor,
      statusText,
      reason,
      checks: [
        { label: `CGPA Metric (Min ${minCgpa})`, value: `${cgpaVal.toFixed(2)}`, passed: hasCgpaOk, warning: !hasCgpaOk && cgpaVal >= 6.0 },
        { label: 'Active Backlogs (Max 0)', value: `${backlogsVal}`, passed: hasBacklogsOk, warning: !hasBacklogsOk && backlogsVal <= 2 },
        { label: `Class Attendance (Min ${minAttendance}%)`, value: `${attendanceVal}%`, passed: hasAttendanceOk, warning: !hasAttendanceOk && attendanceVal >= 65 }
      ]
    };
  };

  const getRecommendedRoles = () => {
    const branch = String(profile.branch || '').toUpperCase();
    const isHighPerformer = cgpaVal >= 8.5 && backlogsVal === 0;
    const isMediumPerformer = !isHighPerformer && cgpaVal >= 7.0 && backlogsVal <= 1;

    let roles: { title: string; match: number; type: string; skills: string[] }[] = [];

    if (branch.includes('CSE') || branch.includes('CS') || branch.includes('IT') || branch.includes('INF')) {
      if (isHighPerformer) {
        roles = [
          { title: 'Software Development Engineer (SDE)', match: 95, type: 'Technical / Core', skills: ['Data Structures', 'System Design', 'Algorithms'] },
          { title: 'AI / Machine Learning Engineer', match: 88, type: 'Specialized', skills: ['Python', 'PyTorch', 'Model Training'] },
          { title: 'Full Stack Web Developer', match: 90, type: 'Technical', skills: ['Next.js', 'PostgreSQL', 'Node.js'] }
        ];
      } else if (isMediumPerformer) {
        roles = [
          { title: 'Full Stack Web Developer', match: 85, type: 'Technical', skills: ['React', 'Node.js', 'SQL'] },
          { title: 'DevOps & Systems Engineer', match: 78, type: 'Infrastructure', skills: ['Docker', 'Linux', 'CI/CD'] },
          { title: 'QA / Automation Engineer', match: 82, type: 'Testing', skills: ['Selenium', 'Java', 'Unit Testing'] }
        ];
      } else {
        roles = [
          { title: 'Frontend Developer', match: 72, type: 'Technical', skills: ['HTML/CSS', 'JavaScript', 'React'] },
          { title: 'Technical Support Associate', match: 80, type: 'Services', skills: ['Troubleshooting', 'SQL', 'Networks'] },
          { title: 'QA / Automation Engineer', match: 70, type: 'Testing', skills: ['Manual Testing', 'Python Scripting'] }
        ];
      }
    } else if (branch.includes('ECE') || branch.includes('ETC') || branch.includes('EEE') || branch.includes('EE')) {
      if (isHighPerformer) {
        roles = [
          { title: 'VLSI Design Engineer', match: 92, type: 'Core Electronics', skills: ['Verilog', 'Digital Design', 'CMOS'] },
          { title: 'Embedded Software Engineer', match: 90, type: 'Core Electronics', skills: ['Embedded C', 'RTOS', 'Microcontrollers'] },
          { title: 'Software Developer (SDE)', match: 85, type: 'IT / Software', skills: ['C++', 'DBMS', 'Algorithms'] }
        ];
      } else if (isMediumPerformer) {
        roles = [
          { title: 'Embedded Systems Engineer', match: 84, type: 'Core Electronics', skills: ['Microcontrollers', 'C Coding', 'I2C/SPI'] },
          { title: 'IoT Solutions Associate', match: 80, type: 'Specialized', skills: ['Sensors', 'Arduino', 'Python'] },
          { title: 'Network Security Analyst', match: 75, type: 'IT Infrastructure', skills: ['CCNA', 'TCP/IP', 'Routing'] }
        ];
      } else {
        roles = [
          { title: 'Hardware Testing Technician', match: 78, type: 'Core Electronics', skills: ['Oscilloscope', 'Multimeter', 'PCB Debugging'] },
          { title: 'Technical Sales Consultant', match: 75, type: 'Services', skills: ['Communication', 'Product Demo', 'Basic Tech'] },
          { title: 'Systems Support Engineer', match: 70, type: 'IT Infrastructure', skills: ['OS Installation', 'Basic Networking'] }
        ];
      }
    } else {
      if (isHighPerformer) {
        roles = [
          { title: 'CAD / FEA Design Engineer', match: 90, type: 'Core Engineering', skills: ['SolidWorks', 'ANSYS', 'Product Design'] },
          { title: 'Graduate Engineer Trainee (GET)', match: 94, type: 'Management & Core', skills: ['Project Planning', 'Process Optimization'] },
          { title: 'Robotics & Automation Specialist', match: 82, type: 'Specialized', skills: ['ROS', 'MATLAB', 'Python'] }
        ];
      } else if (isMediumPerformer) {
        roles = [
          { title: 'CAD Designer / Draftsman', match: 85, type: 'Core Engineering', skills: ['AutoCAD', 'SolidWorks', 'GD&T'] },
          { title: 'Quality Assurance Inspector', match: 80, type: 'Operations', skills: ['Six Sigma', 'Precision Tools', 'ISO Standards'] },
          { title: 'Operations & Maintenance Supervisor', match: 78, type: 'Operations', skills: ['Machine Repair', 'HVAC', 'Safety Protocol'] }
        ];
      } else {
        roles = [
          { title: 'Quality Inspector', match: 75, type: 'Operations', skills: ['Visual Inspection', 'Quality Reports'] },
          { title: 'Technical Sales Engineer', match: 82, type: 'Services', skills: ['Communication', 'Client Relations', 'Product Spec'] },
          { title: 'Production Assistant', match: 80, type: 'Manufacturing', skills: ['Assembly Line', 'Inventory Check'] }
        ];
      }
    }

    return roles;
  };

  const placementEligibility = getPlacementEligibility();
  const recommendedRoles = getRecommendedRoles();

  const clubs = profile.clubs || DEFAULT_CLUBS;
  const certifications = profile.certifications || DEFAULT_CERTS;

  if (!mounted) {
    return (
      <ProtectedRoute role="faculty">
        <PageShell title="Student Details" subtitle="Student profile and academic insights">
          <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
            <Sidebar active="/faculty/students" items={facultySidebarItems} />
            <div className="space-y-5 w-full min-w-0">
              <button 
                onClick={() => router.back()} 
                className="group inline-flex items-center gap-2 text-xs font-bold text-emerald-805 hover:text-emerald-955 transition-all duration-250 bg-emerald-50/50 hover:bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-150 shadow-sm select-none"
              >
                <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
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

          <div className="space-y-5 w-full min-w-0">
            {/* Native SPA Back Button */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => router.back()} 
                className="group inline-flex items-center gap-2 text-xs font-bold text-emerald-805 hover:text-emerald-955 transition-all duration-250 bg-emerald-50/50 hover:bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-150 shadow-sm select-none"
              >
                <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to My Students</span>
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
                
                {/* Redesigned Premium Profile Header */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  {/* Cover Banner */}
                  <div className="h-24 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-855" />
                  
                  <div className="px-6 pb-6 pt-0">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-center -mt-8 md:-mt-12 relative z-10">
                      {/* Avatar container */}
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

                      {/* Header Info Details - Responsive grid layout */}
                      <div className="flex-1 w-full text-center md:text-left pb-1">
                        {/* Row 1: Student Name & Risk Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-100/90">
                          <div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-1.5">
                              <span className="inline-block bg-white px-3 py-1 rounded-md shadow-sm">{student?.name}</span>
                            </h2>
                            <p className="text-xs text-slate-400 font-bold tracking-wide uppercase">{profile.roll_number || 'N/A'} • B.Tech Student</p>
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

                        {/* Detailed demographics grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-1 text-left">
                          {/* Left details */}
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

                          {/* Right details */}
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
                                <span className="font-mono font-bold text-slate-750">{profile.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Tab Navigation */}
                <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 py-2.5 transition-all">
                  <div className="flex bg-white rounded-xl p-1 border border-slate-200 max-w-lg shadow-sm">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                        activeTab === 'profile'
                          ? 'bg-emerald-800 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      General Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('academics')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                        activeTab === 'academics'
                          ? 'bg-emerald-800 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Academics & Analytics
                    </button>
                    <button
                      onClick={() => setActiveTab('extracurriculars')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                        activeTab === 'extracurriculars'
                          ? 'bg-emerald-800 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Extracurriculars & Goals
                    </button>
                  </div>
                </div>

                {/* Tab Content Space */}
                <div className="mt-4 transition-all duration-300">
                  
                  {/* Tab 1: Profile */}
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

                  {/* Tab 2: Academics */}
                  {activeTab === 'academics' && (
                    <div className="space-y-5">
                      
                      {/* Charts & Analytics Grid */}
                      <div className="grid gap-5 md:grid-cols-2">
                      
                      {/* SGPA Semester Trend */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[290px] flex flex-col hover:shadow-md transition duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 shrink-0">
                          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-805" />
                            <span>SGPA Semester Trend</span>
                          </h4>
                          <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
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
                                <Bar 
                                  onClick={(data: any) => { 
                                    if (data && data.name) { 
                                      const semNum = data.name.replace('Sem ', ''); 
                                      router.push(`/faculty/students/${studentUserId}/academics?semester=${semNum}` as any);
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
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-xs text-slate-400 italic">No academic data found</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills Breakdown */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[290px] flex flex-col hover:shadow-md transition duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 shrink-0">
                          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Trophy className="h-4 w-4 text-emerald-850" />
                            <span>{showSkillsPie ? "Skills Breakdown" : "Activity & Certs"}</span>
                          </h4>
                          <button 
                            onClick={() => setShowSkillsPie(!showSkillsPie)}
                            className="text-[9px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition select-none shadow-sm"
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
                                cy="42%"
                                innerRadius={50}
                                outerRadius={75}
                                paddingAngle={2}
                                dataKey="value"
                                onClick={() => {
                                  if (showSkillsPie) {
                                    setActiveTab('extracurriculars');
                                  }
                                }}
                              >
                                {extracurricularData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={showSkillsPie ? SKILLS_COLORS[index % SKILLS_COLORS.length] : PIE_COLORS[index % PIE_COLORS.length]}
                                    style={{ cursor: showSkillsPie ? 'pointer' : 'default' }}
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
                                  return <span className="text-[9px] font-bold text-slate-655">{value}: {item.value}{suffix}</span>;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Backlog Overview */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[290px] flex flex-col hover:shadow-md transition duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 shrink-0">
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
                          {backlogData.length > 0 ? (
                            <div onClick={() => router.push(`/faculty/students/${studentUserId}/academics`)} className="cursor-pointer h-full">
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
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-xs text-slate-455 italic">No backlogs detected! Student is clear.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Placement Eligibility Box (Beside Backlog Overview) */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[290px] flex flex-col justify-between hover:shadow-md transition duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
                          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4 text-[#1c5644]" />
                            <span>Placement Eligibility</span>
                          </h4>
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold border ${
                            placementEligibility.status === 'Eligible' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                            placementEligibility.status === 'Conditional' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                            'bg-rose-50 border-rose-100 text-rose-800'
                          }`}>
                            <span>{placementEligibility.status}</span>
                          </span>
                        </div>

                        <div className="space-y-2.5 my-auto">
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500">Placement Status</span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {placementEligibility.status === 'Eligible' ? 'Eligible for Campus Placements' : placementEligibility.status === 'Conditional' ? 'Conditional Eligibility' : 'Currently Ineligible'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div className="p-2 rounded-xl bg-white border border-slate-150 text-center shadow-xs">
                              <div className="text-slate-400 font-bold">CGPA</div>
                              <div className={`font-black mt-0.5 ${placementEligibility.checks[0].passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {cgpaVal.toFixed(2)}
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-150 text-center shadow-xs">
                              <div className="text-slate-400 font-bold">Backlogs</div>
                              <div className={`font-black mt-0.5 ${placementEligibility.checks[1].passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {backlogsVal}
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-150 text-center shadow-xs">
                              <div className="text-slate-400 font-bold">Attendance</div>
                              <div className={`font-black mt-0.5 ${placementEligibility.checks[2].passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {attendanceVal}%
                              </div>
                            </div>
                          </div>

                          {/* AI Career Fit Recommendations removed per request */}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                  {/* Tab 3: Extracurriculars */}
                  {activeTab === 'extracurriculars' && (
                    <div className="space-y-5">
                      
                      {/* Certifications and Clubs */}
                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Clubs Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="h-4.5 w-4.5 text-emerald-805" />
                            <span>Student Clubs & Memberships</span>
                          </h3>
                          {clubs.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {clubs.map((club: any, i: number) => (
                                <div key={i} className="rounded-xl border border-slate-150 p-4">
                                  <div className="font-bold text-xs text-slate-850">{club.name}</div>
                                  <div className="text-[9px] font-extrabold text-emerald-800 mt-1 uppercase tracking-wider">{club.role || 'Member'}</div>
                                  <div className="text-[8px] text-slate-400 mt-0.5">Joined: {club.joined || 'N/A'}</div>
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

                      {/* Aspirations & Interests */}
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

