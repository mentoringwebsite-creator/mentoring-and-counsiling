'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { Loader2, User, Phone, Mail, Briefcase, Edit2, X, Upload, Sparkles, PieChart as PieIcon, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const hodSidebarItems = [
  { href: '/hod', label: 'HOD Dashboard' },
  { href: '/hod/students', label: 'Students' },
  { href: '/hod/queries', label: 'Student Queries' },
  { href: '/hod/reports', label: 'Reports' }
];

const isBranchInDepartment = (branch: string, department: string) => {
  if (!branch || !department) return false;
  const b = branch.toLowerCase().trim();
  const d = department.toLowerCase().trim();
  
  if (b === d) return true;
  
  // ECE vs Electronics & Communication Engineering
  if (b === 'ece' && (d.includes('electronics') || d.includes('ece'))) return true;
  if (d.includes('electronics') && b.includes('ece')) return true;
  
  // CSE vs Computer Science & Engineering
  if (b === 'cse' && (d.includes('computer science') || d.includes('cse'))) return true;
  if (d.includes('computer science') && b.includes('cse')) return true;

  // IT vs Information Technology
  if (b === 'it' && (d.includes('information technology') || d.includes('it'))) return true;
  if (d.includes('information technology') && b.includes('it')) return true;

  // EEE vs Electrical & Electronics Engineering
  if (b === 'eee' && (d.includes('electrical') || d.includes('eee'))) return true;
  if (d.includes('electrical') && b.includes('eee')) return true;

  // Mechanical vs Mech
  if ((b === 'me' || b === 'mech' || b.includes('mechanical')) && (d.includes('mechanical') || d.includes('mech') || d === 'me')) return true;

  // Civil vs Ce
  if ((b === 'ce' || b.includes('civil')) && (d.includes('civil') || d === 'ce')) return true;

  // Fallback to substring matching
  return d.includes(b) || b.includes(d);
};

export default function HodPage() {
  const [loading, setLoading] = useState(true);
  
  // HOD Profile State
  const [hodProfile, setHodProfile] = useState<any>({
    name: 'HOD User',
    faculty_id: 'HOD10234',
    designation: 'Professor & HOD',
    department: 'CSE',
    qualification: 'Ph.D. in Computer Science',
    responsibilities: 'Department Administration & Research Oversight',
    yearJoined: '2018',
    officeRoom: 'Block III - Room 402',
    email: '',
    contact: '+91 9876543210',
    photo: ''
  });

  // Edit Profile Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Department Students Data for Charts
  const [students, setStudents] = useState<any[]>([]);

  // Dashboard stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [avgCgpa, setAvgCgpa] = useState(0);
  const [totalBacklogs, setTotalBacklogs] = useState(0);
  const [highRiskStudents, setHighRiskStudents] = useState(0);
  const [reportsGenerated, setReportsGenerated] = useState(0);
  const [facultyCoverage, setFacultyCoverage] = useState(100);

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      const email = sessionData?.session?.user?.email || '';
      if (!userId) return;

      // 1. Fetch HOD name from users table
      const { data: userDb } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      // 2. Get HOD profile
      const { data: profileDb } = await supabase
        .from('hod_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const updatedProfile = {
        name: userDb?.name || sessionData?.session?.user?.user_metadata?.name || 'HOD User',
        faculty_id: profileDb?.faculty_id || 'HOD10234',
        designation: profileDb?.designation || 'Professor & HOD',
        department: profileDb?.department || 'CSE',
        qualification: profileDb?.qualification || 'Ph.D. in Computer Science',
        responsibilities: profileDb?.responsibilities || 'Department Administration & Research Oversight',
        yearJoined: profileDb?.joining_year || '2018',
        officeRoom: profileDb?.office_room || 'Block III - Room 402',
        email: email,
        contact: profileDb?.contact_number || '+91 9876543210',
        photo: profileDb?.profile_photo || ''
      };

      setHodProfile(updatedProfile);
      setFormData(updatedProfile);

      const dept = updatedProfile.department;

      // 3. Fetch approved faculty in HOD's department
      const { data: facultyDb, error: fError } = await supabase
        .from('users')
        .select(`
          id,
          faculty_profiles!user_id (department)
        `)
        .eq('role', 'faculty')
        .eq('status', 'Approved');

      if (fError) throw fError;

      const deptFaculty = (facultyDb || []).filter((f) => {
        const fDept = f.faculty_profiles?.[0]?.department;
        if (!dept || !fDept) return false;
        return isBranchInDepartment(fDept, dept);
      });

      const deptFacultyIds = deptFaculty.map((f) => f.id);

      // 4. Fetch approved students
      const { data: studentsDb, error: sError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          student_profiles!user_id (
            branch, cgpa, backlogs, mentor_id, attendance_percentage
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (sError) throw sError;

      // Filter students by HOD's department
      const deptStudents = (studentsDb || []).filter((s) => {
        const profile = s.student_profiles?.[0] || {};
        const sBranch = profile.branch;
        const mentorId = profile.mentor_id;

        const branchMatches = sBranch && dept && isBranchInDepartment(sBranch, dept);
        const mentorInDept = mentorId && deptFacultyIds.includes(mentorId);

        if (!dept) return true;
        return branchMatches || mentorInDept;
      });

      setStudents(deptStudents);

      // Calculate stats
      const totalCount = deptStudents.length;
      setTotalStudents(totalCount);

      if (totalCount > 0) {
        // Average CGPA
        const totalCgpa = deptStudents.reduce((sum, s) => {
          const profile = s.student_profiles?.[0] || {};
          const cgpa = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
          return sum + cgpa;
        }, 0);
        setAvgCgpa(totalCgpa / totalCount);

        // Total Backlogs
        const totalB = deptStudents.reduce((sum, s) => {
          const profile = s.student_profiles?.[0] || {};
          const backlogs = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
          return sum + backlogs;
        }, 0);
        setTotalBacklogs(totalB);

        // High Risk Students
        const highRisk = deptStudents.filter((s) => {
          const profile = s.student_profiles?.[0] || {};
          const cgpa = profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0;
          const backlogs = profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0;
          return getRiskLevel(cgpa, backlogs) === 'High';
        }).length;
        setHighRiskStudents(highRisk);

        // Faculty coverage
        const assignedCount = deptStudents.filter((s) => s.student_profiles?.[0]?.mentor_id).length;
        setFacultyCoverage(Math.round((assignedCount / totalCount) * 100));
      } else {
        setAvgCgpa(0);
        setTotalBacklogs(0);
        setHighRiskStudents(0);
        setFacultyCoverage(100);
      }

      // 5. Fetch student queries to determine reports generated
      const studentUserIds = deptStudents.map((s) => s.id);
      if (studentUserIds.length > 0) {
        const { data: queriesDb } = await supabase
          .from('queries')
          .select('status')
          .in('student_id', studentUserIds);

        const resolvedQueries = queriesDb?.filter((q) => q.status === 'Resolved').length || 0;
        setReportsGenerated(resolvedQueries);
      } else {
        setReportsGenerated(0);
      }

    } catch (err: any) {
      console.error('Error loading HOD dashboard stats:', err);
      setFeedback(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData((prev: any) => ({ ...prev, photo: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Must be logged in');

      // Update name in users table
      await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', userId);

      // Update hod_profiles
      await supabase
        .from('hod_profiles')
        .upsert({
          user_id: userId,
          faculty_id: formData.faculty_id,
          designation: formData.designation,
          department: formData.department,
          qualification: formData.qualification,
          responsibilities: formData.responsibilities,
          joining_year: formData.yearJoined,
          office_room: formData.officeRoom,
          contact_number: formData.contact,
          profile_photo: formData.photo
        }, { onConflict: 'user_id' });

      setProfileMsg('HOD information updated successfully!');
      await loadDashboardData();
      setTimeout(() => {
        setIsEditing(false);
        setProfileMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error('Error saving HOD profile:', err);
      alert(err.message || 'Failed to update HOD profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Analytics Chart Data
  const highRiskCount = students.filter((s) => {
    const p = s.student_profiles?.[0] || {};
    return getRiskLevel(p.cgpa ?? 8.0, p.backlogs ?? 0) === 'High';
  }).length;

  const medRiskCount = students.filter((s) => {
    const p = s.student_profiles?.[0] || {};
    return getRiskLevel(p.cgpa ?? 8.0, p.backlogs ?? 0) === 'Medium';
  }).length;

  const lowRiskCount = students.filter((s) => {
    const p = s.student_profiles?.[0] || {};
    return getRiskLevel(p.cgpa ?? 8.0, p.backlogs ?? 0) === 'Low';
  }).length;

  const riskData = [
    { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
    { name: 'Medium Risk', value: medRiskCount, color: '#f59e0b' },
    { name: 'Low Risk', value: lowRiskCount, color: '#10b981' }
  ];

  const cgpaDistribution = [
    { range: '< 6.0', count: students.filter(s => (s.student_profiles?.[0]?.cgpa || 8.0) < 6.0).length },
    { range: '6.0 - 7.0', count: students.filter(s => { const c = s.student_profiles?.[0]?.cgpa || 8.0; return c >= 6.0 && c < 7.0; }).length },
    { range: '7.0 - 8.0', count: students.filter(s => { const c = s.student_profiles?.[0]?.cgpa || 8.0; return c >= 7.0 && c < 8.0; }).length },
    { range: '8.0 - 9.0', count: students.filter(s => { const c = s.student_profiles?.[0]?.cgpa || 8.0; return c >= 8.0 && c < 9.0; }).length },
    { range: '9.0 - 10.0', count: students.filter(s => (s.student_profiles?.[0]?.cgpa || 8.0) >= 9.0).length }
  ];

  const attendanceDistribution = [
    { range: '< 75%', count: students.filter(s => (s.student_profiles?.[0]?.attendance_percentage ?? 85) < 75).length },
    { range: '75% - 85%', count: students.filter(s => { const a = s.student_profiles?.[0]?.attendance_percentage ?? 85; return a >= 75 && a <= 85; }).length },
    { range: '> 85%', count: students.filter(s => (s.student_profiles?.[0]?.attendance_percentage ?? 85) > 85).length }
  ];

  const calculatedExperience = new Date().getFullYear() - parseInt(hodProfile.yearJoined || '2018');

  return (
    <ProtectedRoute role="hod">
      <PageShell title="HOD Dashboard" subtitle="Unified department monitoring, profile, and insights">
        <div className="grid gap-6 px-4 py-4 md:px-6 md:py-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/hod" items={hodSidebarItems} />
          
          <div className="space-y-6 w-full min-w-0">
            {feedback && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800 shadow-sm">
                {feedback}
              </div>
            )}

            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading department dashboard…</span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. HEADER BANNER SECTION */}
                <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  <div className="h-32 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800" />
                  
                  <div className="px-6 pb-6 pt-0">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-16 md:-mt-20 relative z-10">
                      {/* Large Profile Picture */}
                      <div className="h-[140px] w-[140px] sm:h-[160px] sm:w-[160px] md:h-[185px] md:w-[185px] rounded-[32px] overflow-hidden border-[5px] border-white shadow-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {hodProfile.photo ? (
                          <img
                            src={hodProfile.photo}
                            alt={hodProfile.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(hodProfile.name)}`;
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-400">
                            <User className="h-16 w-16 md:h-20 md:w-20 text-slate-350" />
                          </div>
                        )}
                      </div>

                      {/* Header Basic Details */}
                      <div className="flex-1 w-full text-center md:text-left pb-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-1.5">{hodProfile.name}</h2>
                            <p className="text-xs text-emerald-800 font-extrabold tracking-wide uppercase mb-1.5">{hodProfile.designation} — DEPT. OF {hodProfile.department}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase font-mono">EMPLOYEE ID: {hodProfile.faculty_id}</p>
                          </div>
                          
                          <div className="flex justify-center sm:justify-start">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-widest shadow-sm">
                              <Sparkles className="h-3 w-3" />
                              Head of Department
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. HOD INFORMATION CARD (MATCHING MENTOR DASHBOARD) */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-4 w-4 text-emerald-705" />
                      <span>HOD Information</span>
                    </h3>
                    <button 
                      onClick={() => {
                        setFormData(hodProfile);
                        setIsEditing(true);
                      }} 
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 hover:text-emerald-800 transition"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit Info</span>
                    </button>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2 text-sm">
                    {/* Left Column: Academic & Professional Details */}
                    <div>
                      <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-3 pb-1 border-b border-emerald-100/50">Academic & Professional</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Full Name</span>
                          <span className="font-semibold text-slate-800">{hodProfile.name}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Employee ID</span>
                          <span className="font-mono font-bold text-slate-800">{hodProfile.faculty_id}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Designation</span>
                          <span className="font-semibold text-slate-800 uppercase">{hodProfile.designation}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Department</span>
                          <span className="font-semibold text-slate-800 uppercase">{hodProfile.department}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Highest Qualification</span>
                          <span className="font-semibold text-slate-800 uppercase">{hodProfile.qualification}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Responsibilities</span>
                          <span className="font-semibold text-slate-800">{hodProfile.responsibilities}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Tenure & Contact Details */}
                    <div>
                      <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-3 pb-1 border-b border-emerald-100/50">Tenure & Communication</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Joining Year</span>
                          <span className="font-semibold text-slate-800">{hodProfile.yearJoined}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Total Experience</span>
                          <span className="font-semibold text-slate-800">{calculatedExperience > 0 ? calculatedExperience : 0} Years</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Office Room / Location</span>
                          <span className="font-semibold text-slate-800">{hodProfile.officeRoom}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Official Email</span>
                          <span className="font-semibold text-emerald-700 underline break-all">{hodProfile.email}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Contact Number</span>
                          <span className="font-mono font-semibold text-slate-800">{hodProfile.contact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. DEPARTMENT PERFORMANCE STAT CARDS */}
                <div className="portal-card grid gap-4">
                  <h2 className="text-base font-extrabold text-slate-900">Department Overview Analytics</h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard title="Total Students" value={totalStudents.toString()} tone="neutral" />
                    <StatCard title="Average CGPA" value={avgCgpa > 0 ? avgCgpa.toFixed(2) : '0.00'} tone="green" />
                    <StatCard title="Active Backlogs" value={totalBacklogs.toString()} tone="orange" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard title="High Risk Students" value={highRiskStudents.toString()} tone="red" />
                  <StatCard title="Reports Generated" value={reportsGenerated.toString()} tone="neutral" hint="Resolved student queries" />
                  <StatCard title="Faculty Coverage" value={`${facultyCoverage}%`} tone="green" hint="Students assigned a mentor" />
                </div>

                {/* 4. ANALYTICS CHARTS (RISK & CGPA & ATTENDANCE DISTRIBUTION) */}
                <div className="grid gap-6 md:grid-cols-2">
                  
                  {/* Risk Distribution Pie Chart */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                      <PieIcon className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Student Risk Distribution</h4>
                    </div>
                    {students.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-400">No student records available</div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={riskData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {riskData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} Students`, 'Count']} />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* CGPA Distribution Bar Chart */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                      <TrendingUp className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Average CGPA Distribution</h4>
                    </div>
                    {students.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-400">No student records available</div>
                    ) : (
                      <div className="flex-1 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cgpaDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" name="Students count" fill="#10b981" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Attendance Distribution */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[300px] md:col-span-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                      <Activity className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Attendance Overview Distribution</h4>
                    </div>
                    {students.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-400">No student records available</div>
                    ) : (
                      <div className="flex-1 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={attendanceDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" name="Students count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal: Edit HOD Info */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-700" />
                  <span>Edit HOD Profile Information</span>
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-4 overflow-y-auto flex-1">
                {profileMsg && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800">
                    {profileMsg}
                  </div>
                )}

                {/* Photo Upload */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-2 text-xs font-bold transition border border-emerald-200">
                      <Upload className="h-4 w-4" />
                      <span>Upload Profile Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">Recommended: Square JPG/PNG image</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={formData.faculty_id || ''}
                      onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={formData.designation || ''}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Highest Qualification</label>
                    <input
                      type="text"
                      value={formData.qualification || ''}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Joining Year</label>
                    <input
                      type="text"
                      value={formData.yearJoined || ''}
                      onChange={(e) => setFormData({ ...formData, yearJoined: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Office Room / Location</label>
                    <input
                      type="text"
                      value={formData.officeRoom || ''}
                      onChange={(e) => setFormData({ ...formData, officeRoom: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Number</label>
                    <input
                      type="text"
                      required
                      value={formData.contact || ''}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Responsibilities / Notes</label>
                  <input
                    type="text"
                    value={formData.responsibilities || ''}
                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] text-white px-6 py-2 text-xs font-extrabold transition flex items-center gap-2 shadow-sm"
                  >
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>Save Changes</span>
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