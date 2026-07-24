'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { 
  Loader2, User, Phone, Mail, Award, BookOpen, Layers, 
  Briefcase, Calendar, Edit2, X, Users, MessageSquare, 
  FileText, AlertTriangle, TrendingUp, CheckCircle2, 
  Clock, ChevronRight, Download, Plus, Sparkles, Activity, PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

const facultySidebarItems = [
  { href: '/faculty', label: 'My Dashboard' },
  { href: '/faculty/students', label: 'My Students' },
  { href: '/faculty/queries', label: 'Student Queries' },
  { href: '/faculty/notes', label: 'Mentor Notes' }
];

export default function FacultyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile States
  const [profile, setProfile] = useState<any>({
    name: 'Loading...',
    designation: 'Faculty Mentor',
    qualification: 'PhD, M.Tech',
    department: 'Computer Science & Engineering',
    subjects: 'Data Structures, DBMS',
    yearJoined: '2018',
    email: '',
    contact: '+91 9876543210',
    photo: '',
    faculty_id: 'N/A'
  });

  const [formData, setFormData] = useState<any>({
    name: '',
    designation: '',
    qualification: '',
    department: '',
    subjects: '',
    contact: '',
    photo: ''
  });

  // Dashboard Stats States
  const [students, setStudents] = useState<any[]>([]);
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [avgCgpa, setAvgCgpa] = useState<string>('0.00');
  const [highRiskCount, setHighRiskCount] = useState<number>(0);
  const [openQueriesCount, setOpenQueriesCount] = useState<number>(0);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  
  // Static/Mock Stats
  const pendingSessionsCount = 2;
  const completedSessionsCount = 14;
  const notesCount = 3;
  const notificationsCount = 3;

  const getStudentAttendance = (roll: string) => {
    if (!roll) return 85.0;
    let hash = 0;
    for (let i = 0; i < roll.length; i++) {
      hash = roll.charCodeAt(i) + ((hash << 5) - hash);
    }
    const pct = 72.0 + (Math.abs(hash) % 240) / 10.0;
    return Number(pct.toFixed(1));
  };

  async function loadAllDashboardData() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const email = session.user.email || '';

      // 1. Fetch Faculty Profile
      const { data: userDb } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      const { data: facultyDb } = await supabase
        .from('faculty_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      let joinYear = '2018';
      if (facultyDb?.created_at) {
        joinYear = new Date(facultyDb.created_at).getFullYear().toString();
      }

      const facultyDetails = {
        name: userDb?.name || session.user.user_metadata?.name || 'Dr. Suresh Kumar',
        designation: facultyDb?.designation || 'Associate Professor',
        qualification: facultyDb?.qualification || 'PhD (Computer Science), M.Tech',
        department: facultyDb?.department || 'ECM – Electronics & Computer Engineering',
        subjects: facultyDb?.subjects || 'Data Structures, DBMS, Operating Systems',
        yearJoined: joinYear,
        email: email,
        contact: facultyDb?.contact_number || '+91 9876543210',
        photo: facultyDb?.profile_photo || '',
        faculty_id: facultyDb?.faculty_id || 'EMP-ECE-4021'
      };

      setProfile(facultyDetails);
      setFormData(facultyDetails);

      // 2. Fetch Assigned Students
      const { data: studentsDb, error: studentsError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id (
            mentor_id, cgpa, backlogs, roll_number, branch, academic_year
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (studentsError) throw studentsError;

      const myStudents = studentsDb?.filter(
        (s: any) => s.student_profiles?.[0]?.mentor_id === userId
      ) || [];

      setAssignedCount(myStudents.length);

      const processedStudents = myStudents.map((s: any) => {
        const sp = s.student_profiles?.[0] || {};
        const cgpa = sp.cgpa !== undefined && sp.cgpa !== null ? Number(sp.cgpa) : 8.0;
        const backlogs = sp.backlogs !== undefined && sp.backlogs !== null ? Number(sp.backlogs) : 0;
        const attendance = getStudentAttendance(sp.roll_number || '');
        const risk = getRiskLevel(cgpa, backlogs);
        
        return {
          id: s.id,
          name: s.name,
          roll_number: sp.roll_number || 'N/A',
          cgpa,
          backlogs,
          attendance,
          risk
        };
      });

      setStudents(processedStudents);

      // Compute stats
      if (processedStudents.length > 0) {
        let totalCgpa = 0;
        let highRisk = 0;
        processedStudents.forEach((s) => {
          totalCgpa += s.cgpa;
          if (s.risk === 'High') highRisk++;
        });
        setAvgCgpa((totalCgpa / processedStudents.length).toFixed(2));
        setHighRiskCount(highRisk);
      } else {
        setAvgCgpa('0.00');
        setHighRiskCount(0);
      }

      // 3. Fetch Queries
      if (myStudents.length > 0) {
        const studentIds = myStudents.map((s: any) => s.id);
        const { data: queriesDb, error: queriesError } = await supabase
          .from('queries')
          .select(`
            id, type, subject, description, status, created_at, student_id,
            student:student_id ( name )
          `)
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });

        if (!queriesError && queriesDb) {
          const pendingQueries = queriesDb.filter((q: any) => 
            q.status === 'Pending' || q.status === 'In Review'
          );
          setOpenQueriesCount(pendingQueries.length);
          setRecentQueries(queriesDb.slice(0, 4));
        }
      }

    } catch (err) {
      console.error('Error loading dashboard & profile data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No active user session.');
      const userId = session.user.id;

      // 1. Update user display name in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', userId);

      if (userError) throw userError;

      // 2. Update faculty_profiles details
      const { error: profileError } = await supabase
        .from('faculty_profiles')
        .update({
          designation: formData.designation,
          qualification: formData.qualification,
          department: formData.department,
          subjects: formData.subjects,
          contact_number: formData.contact,
          profile_photo: formData.photo
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      setSaveMessage('Profile updated successfully!');
      await loadAllDashboardData();
      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error updating faculty profile:', err);
      setSaveError(err.message || 'An error occurred while saving changes.');
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = () => {
    if (students.length === 0) {
      alert('No student records available to download.');
      return;
    }
    const headers = ['Name', 'Roll Number', 'CGPA', 'Backlogs', 'Attendance (%)', 'Risk Level'];
    const rows = students.map(s => [
      s.name,
      s.roll_number,
      s.cgpa,
      s.backlogs,
      s.attendance,
      s.risk
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mentored_students_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Computations
  const riskCounts = { Low: 0, Medium: 0, High: 0 };
  students.forEach(s => {
    if (s.risk === 'High') riskCounts.High++;
    else if (s.risk === 'Medium') riskCounts.Medium++;
    else riskCounts.Low++;
  });

  const riskData = [
    { name: 'Low Risk', value: riskCounts.Low, color: '#10b981' },
    { name: 'Medium Risk', value: riskCounts.Medium, color: '#f59e0b' },
    { name: 'High Risk', value: riskCounts.High, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const cgpaDistribution = [
    { range: '< 6.0', count: students.filter(s => s.cgpa < 6.0).length },
    { range: '6.0 - 7.5', count: students.filter(s => s.cgpa >= 6.0 && s.cgpa < 7.5).length },
    { range: '7.5 - 8.5', count: students.filter(s => s.cgpa >= 7.5 && s.cgpa < 8.5).length },
    { range: '8.5+', count: students.filter(s => s.cgpa >= 8.5).length }
  ];

  const attendanceDistribution = [
    { range: '< 75%', count: students.filter(s => s.attendance < 75.0).length },
    { range: '75% - 85%', count: students.filter(s => s.attendance >= 75.0 && s.attendance < 85.0).length },
    { range: '85%+', count: students.filter(s => s.attendance >= 85.0).length }
  ];

  const sessionHistoryData = [
    { month: 'Jan', Sessions: 2 },
    { month: 'Feb', Sessions: 4 },
    { month: 'Mar', Sessions: 3 },
    { month: 'Apr', Sessions: 6 },
    { month: 'May', Sessions: 5 }
  ];

  // Experience calculation
  const calculatedExperience = new Date().getFullYear() - parseInt(profile.yearJoined || '2018');

  return (
    <ProtectedRoute role="faculty">
      <PageShell title="My Dashboard" subtitle="Unified faculty monitoring, profile, and insights">
        <div className="grid gap-6 px-4 py-4 md:px-6 md:py-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/faculty" items={facultySidebarItems} />
          
          <div className="space-y-6 w-full min-w-0">
            {loading ? (
              <div className="portal-card flex h-[350px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Loading dashboard data…</span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. HEADER SECTION */}
                <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  <div className="h-32 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800" />
                  
                  <button 
                    onClick={() => {
                      setFormData(profile);
                      setIsEditing(true);
                    }} 
                    className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition duration-200 shadow-sm"
                    title="Edit Profile"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <div className="px-6 pb-6 pt-0">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-16 md:-mt-20 relative z-10">
                      {/* Large Profile Picture */}
                      <div className="h-[140px] w-[140px] sm:h-[160px] sm:w-[160px] md:h-[185px] md:w-[185px] rounded-[32px] overflow-hidden border-[5px] border-white shadow-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {profile.photo ? (
                          <img
                            src={profile.photo}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name)}`;
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-3 border-b border-slate-100/90">
                          <div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-1.5">{profile.name}</h2>
                            <p className="text-xs text-slate-400 font-bold tracking-wide uppercase font-mono">Employee ID: {profile.faculty_id}</p>
                          </div>
                          
                          <div className="flex justify-center sm:justify-start">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-widest shadow-sm">
                              <Sparkles className="h-3 w-3" />
                              Faculty Mentor
                            </span>
                          </div>
                        </div>

                        {/* Extra Details */}
                        <div className="grid gap-y-1.5 text-left text-xs max-w-xl">
                          <div className="flex justify-between sm:justify-start gap-4">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] w-24">Designation:</span>
                            <span className="font-semibold text-slate-700">{profile.designation}</span>
                          </div>
                          <div className="flex justify-between sm:justify-start gap-4">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] w-24">Department:</span>
                            <span className="font-semibold text-slate-700">{profile.department}</span>
                          </div>
                          <div className="flex justify-between sm:justify-start gap-4">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] w-24">Email:</span>
                            <span className="font-semibold text-slate-700">{profile.email}</span>
                          </div>
                          <div className="flex justify-between sm:justify-start gap-4">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] w-24">Phone:</span>
                            <span className="font-semibold text-slate-700">{profile.contact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. OVERVIEW CARDS */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <StatCard title="Assigned Students" value={assignedCount.toString()} tone="neutral" />
                  <StatCard title="Open Queries" value={openQueriesCount.toString()} tone="orange" />
                  <StatCard title="Pending Sessions" value={pendingSessionsCount.toString()} tone="orange" />
                  <StatCard title="Completed Sessions" value={completedSessionsCount.toString()} tone="green" />
                  <StatCard title="Average CGPA" value={avgCgpa} tone="green" />
                  <StatCard title="High Risk Students" value={highRiskCount.toString()} tone="red" />
                  <StatCard title="Mentor Notes" value={notesCount.toString()} tone="neutral" />
                  <StatCard title="Notifications" value={notificationsCount.toString()} tone="orange" />
                </div>

                {/* 3. QUICK ACTIONS */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/faculty/students">
                      <span className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span>View My Students</span>
                      </span>
                    </Link>
                    <Link href="/faculty/queries">
                      <span className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs">
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        <span>Student Queries</span>
                      </span>
                    </Link>
                    <Link href="/faculty/notes">
                      <span className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs">
                        <FileText className="h-4 w-4 text-emerald-500" />
                        <span>Mentor Notes</span>
                      </span>
                    </Link>
                    <button 
                      onClick={() => alert(' Mentoring Session Schedule dialog launched (simulation).')}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 border border-emerald-805 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Schedule Session</span>
                    </button>
                    <button 
                      onClick={downloadReport}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                      <span>Download Reports</span>
                    </button>
                  </div>
                </div>

                {/* 4. ANALYTICS */}
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
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                      <Activity className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Attendance Overview</h4>
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

                  {/* Monthly Sessions Statistics */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                      <Calendar className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mentoring Session Statistics</h4>
                    </div>
                    <div className="flex-1 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sessionHistoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="Sessions" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* 5. RECENT ACTIVITY */}
                <div className="grid gap-6 md:grid-cols-2">
                  
                  {/* Latest Student Queries */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-4">
                        <MessageSquare className="h-4 w-4 text-emerald-700" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Latest Student Queries</h4>
                      </div>
                      
                      {recentQueries.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 font-bold">No student queries found.</div>
                      ) : (
                        <div className="space-y-3">
                          {recentQueries.map((q) => (
                            <div key={q.id} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 hover:bg-slate-50 transition">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-slate-800">{q.student?.name}</span>
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide border shadow-xs ${
                                  q.status === 'Pending' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                  q.status === 'In Review' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                  'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                  {q.status}
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold text-slate-500 truncate">{q.subject}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {recentQueries.length > 0 && (
                      <Link href="/faculty/queries">
                        <span className="cursor-pointer text-[10px] font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center justify-end gap-0.5 mt-4">
                          <span>View all queries</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* Recently Completed Sessions & Latest Notes */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recently Completed Sessions</h4>
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-start gap-2.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-700">Mentoring session with Afif (23311A04X2)</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Completed on July 20, 2026 • Backlog clearance plan</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-700">Academic prep session with Sneha (23311A04Y1)</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Completed on July 18, 2026 • Mid-semester evaluation</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3.5 mb-3">
                        <FileText className="h-4 w-4 text-emerald-700" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Latest Mentor Notes</h4>
                      </div>
                      <div className="space-y-2 text-xs text-slate-600 font-semibold">
                        <div className="border-l-2 border-emerald-500 pl-2.5">
                          "Student needs extra support in DBMS and attendance monitoring."
                        </div>
                        <div className="border-l-2 border-emerald-500 pl-2.5">
                          "Discussed internship options and resume review in last meeting."
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 6. FACULTY INFORMATION (MY PROFILE) */}
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-4 w-4 text-emerald-705" />
                      <span>Faculty Information</span>
                    </h3>
                    <button 
                      onClick={() => {
                        setFormData(profile);
                        setIsEditing(true);
                      }} 
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 hover:text-emerald-800 transition"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit Info</span>
                    </button>
                  </div>

                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Name</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{profile.name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Employee ID</div>
                        <div className="font-semibold text-slate-805 font-mono mt-0.5">{profile.faculty_id}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Department</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{profile.department}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider font-mono">Designation</div>
                        <div className="font-semibold text-slate-805 mt-0.5">{profile.designation}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Qualification</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{profile.qualification}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Joining Year</div>
                        <div className="font-semibold text-slate-808 mt-0.5">{profile.yearJoined}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Experience</div>
                        <div className="font-semibold text-slate-808 mt-0.5">{calculatedExperience} Years</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Subjects Handling</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{profile.subjects}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Office Email</div>
                        <div className="font-semibold text-emerald-800 underline break-all mt-0.5">{profile.email}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Contact Number</div>
                        <div className="font-semibold text-slate-808 mt-0.5">{profile.contact}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs uppercase tracking-wider">Office Room</div>
                        <div className="font-semibold text-slate-808 mt-0.5">Block III - Room 305</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Edit Faculty Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-bold text-slate-850">Edit Faculty Profile</h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-705 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Qualification</label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subjects Taught</label>
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact Number</label>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profile Photo</label>
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                      {formData.photo && (
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img
                            src={formData.photo}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-slate-505
                          file:mr-4 file:py-2.5 file:px-4
                          file:rounded-xl file:border-0
                          file:text-sm file:font-semibold
                          file:bg-emerald-50 file:text-emerald-700
                          hover:file:bg-emerald-100 transition"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Choose a real image file from your device. The image will be compressed automatically before saving.</p>
                  </div>

                </div>

                {saveError && (
                  <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600 border border-rose-200">
                    {saveError}
                  </div>
                )}

                {saveMessage && (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 border border-emerald-200">
                    {saveMessage}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition disabled:opacity-70"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
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