'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { supabase } from '@/lib/supabase';
import { getRiskLevel } from '@/lib/risk';
import { Loader2, User, Phone, Mail, Briefcase, Edit2, X, Upload } from 'lucide-react';

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
  const [hodName, setHodName] = useState('HOD User');
  const [hodDesignation, setHodDesignation] = useState('Professor & HOD');
  const [hodDept, setHodDept] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodContact, setHodContact] = useState('+91 9876543210');
  const [hodFacultyId, setHodFacultyId] = useState('HOD10234');
  const [hodPhoto, setHodPhoto] = useState('');

  // Edit Profile Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    designation: '',
    department: '',
    contact: '',
    photo: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

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

      setHodEmail(email);

      // 1. Fetch HOD name from users table
      const { data: userDb } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (userDb?.name) {
        setHodName(userDb.name);
      }

      // 2. Get HOD profile to determine designation, department, contact, photo
      const { data: hodProfile } = await supabase
        .from('hod_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const dept = hodProfile?.department || 'ECM – Electronics & Computer Engineering';
      setHodDept(dept);
      setHodDesignation(hodProfile?.designation || 'Professor & HOD');
      setHodContact(hodProfile?.contact_number || '+91 9876543210');
      setHodFacultyId(hodProfile?.faculty_id || 'HOD10234');
      setHodPhoto(hodProfile?.profile_photo || '');

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
          student_profiles!user_id (
            branch, cgpa, backlogs, mentor_id
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
          setEditForm((prev) => ({ ...prev, photo: dataUrl }));
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
        .update({ name: editForm.name })
        .eq('id', userId);

      // Update hod_profiles
      await supabase
        .from('hod_profiles')
        .update({
          designation: editForm.designation,
          department: editForm.department,
          contact_number: editForm.contact,
          profile_photo: editForm.photo
        })
        .eq('user_id', userId);

      setProfileMsg('HOD profile updated successfully!');
      await loadDashboardData();
      setTimeout(() => {
        setIsEditing(false);
        setProfileMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error saving HOD profile:', err);
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <ProtectedRoute role="hod">
      <PageShell title="HOD Portal" subtitle={`${hodDept ? `${hodDept} Department` : 'Department Analytics'}`}>
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/hod" items={hodSidebarItems} />
          
          <div className="grid gap-6 w-full min-w-0">
            {feedback && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800 shadow-sm">
                {feedback}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#1c5644] mr-2" />
                <span>Loading department dashboard & profile...</span>
              </div>
            ) : (
              <>
                {/* Integrated Single-Page HOD Profile Banner */}
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  {/* Cover Header */}
                  <div className="h-32 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 relative">
                    <button 
                      onClick={() => {
                        setEditForm({
                          name: hodName,
                          designation: hodDesignation,
                          department: hodDept,
                          contact: hodContact,
                          photo: hodPhoto
                        });
                        setIsEditing(true);
                      }} 
                      className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition shadow-sm"
                      title="Edit HOD Profile"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end -mt-14 relative z-10">
                      {/* Avatar */}
                      <div className="h-28 w-28 min-h-[112px] max-h-[112px] min-w-[112px] max-w-[112px] rounded-[24px] overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {hodPhoto ? (
                          <img
                            src={hodPhoto}
                            alt={hodName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(hodName)}`;
                            }}
                          />
                        ) : (
                          <User className="h-10 w-10 text-emerald-200" />
                        )}
                      </div>

                      {/* Header Info */}
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-tight">{hodName}</h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-1 text-xs text-slate-600 font-bold">
                              <span>{hodDesignation}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-emerald-800 font-black">{hodDept ? `${hodDept}` : 'Department HOD'}</span>
                            </div>
                          </div>

                          <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-black text-emerald-800 shrink-0">
                            <Briefcase className="h-3.5 w-3.5" />
                            Head of Department
                          </span>
                        </div>

                        {/* Contact Meta Details */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-emerald-700" />
                            {hodEmail}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-emerald-700" />
                            {hodContact}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono text-slate-500">
                            ID: {hodFacultyId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="portal-card grid gap-4">
                  <h2 className="text-base font-extrabold text-slate-900">Department Performance Analytics</h2>
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
              </>
            )}
          </div>
        </div>

        {/* Modal: Edit HOD Profile */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-700" />
                  <span>Edit HOD Profile</span>
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                {profileMsg && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800">
                    {profileMsg}
                  </div>
                )}

                {/* Profile Photo Upload */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    {editForm.photo ? (
                      <img src={editForm.photo} alt="Preview" className="h-full w-full object-cover" />
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
                    <p className="text-[10px] text-slate-400 mt-1">Recommended: Square JPG/PNG</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Number</label>
                    <input
                      type="text"
                      required
                      value={editForm.contact}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
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