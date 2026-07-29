'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ArrowLeft, Users, UserCheck, Search, Plus, X, GripVertical, CheckCircle2 
} from 'lucide-react';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Mentors' },
  { href: '/admin/hod', label: 'Manage HOD' }
];

const getStudentBTechYear = (acYear: string, roll: string) => {
  const acYearStr = String(acYear || '').toLowerCase();
  if (acYearStr.includes('iv year') || acYearStr.includes('4th year') || acYearStr === '4') return 'IV Year';
  if (acYearStr.includes('iii year') || acYearStr.includes('3rd year') || acYearStr === '3') return 'III Year';
  if (acYearStr.includes('ii year') || acYearStr.includes('2nd year') || acYearStr === '2') return 'II Year';
  if (acYearStr.includes('i year') || acYearStr.includes('1st year') || acYearStr === '1') return 'I Year';

  const r = String(roll || '').trim();
  if (r.length >= 2) {
    const joinYearDigits = parseInt(r.substring(0, 2));
    if (!isNaN(joinYearDigits)) {
      const diff = 26 - joinYearDigits;
      if (diff === 0 || diff === 1) return 'I Year';
      if (diff === 2) return 'II Year';
      if (diff === 3) return 'III Year';
      if (diff >= 4) return 'IV Year';
    }
  }
  return 'I Year';
};

export default function AdminAssignStudentsPage({ params }: { params: Promise<{ facultyId: string }> }) {
  const resolvedParams = use(params);
  const facultyId = resolvedParams.facultyId;
  const router = useRouter();

  const [mentor, setMentor] = useState<any | null>(null);
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [assignedStudentUserIds, setAssignedStudentUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [draggedUserId, setDraggedUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load Mentor user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, name, email, role,
          faculty_profiles!user_id ( id, faculty_id, department, designation )
        `)
        .eq('id', facultyId)
        .single();

      if (userError || !userData) throw new Error('Mentor not found.');
      setMentor(userData);

      const fProfileId = userData.faculty_profiles?.[0]?.id;

      // Load all approved students
      const { data: studentsDb, error: studentsError } = await supabase
        .from('users')
        .select(`
          id, name, email,
          student_profiles!user_id ( user_id, roll_number, branch, section, mentor_id, academic_year )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (studentsError) throw studentsError;

      const formatted = (studentsDb || []).map((u: any) => {
        const sp = u.student_profiles?.[0] || {};
        return {
          userId: u.id,
          name: u.name || 'Student',
          email: u.email || '',
          rollNumber: sp.roll_number || 'N/A',
          branch: sp.branch || 'N/A',
          section: sp.section || '',
          mentorId: sp.mentor_id,
          btechYear: getStudentBTechYear(sp.academic_year, sp.roll_number)
        };
      });

      setAllStudentsList(formatted);

      // Find currently assigned students to this mentor
      const currentlyAssigned = formatted
        .filter((s: any) => s.mentorId === facultyId || (fProfileId && s.mentorId === fProfileId))
        .map((s: any) => s.userId);

      setAssignedStudentUserIds(currentlyAssigned);
    } catch (err: any) {
      console.error('Error loading data for assignment page:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load student assignment data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [facultyId]);

  const handleAssignStudent = (studentUserId: string) => {
    if (!assignedStudentUserIds.includes(studentUserId)) {
      setAssignedStudentUserIds((prev) => [...prev, studentUserId]);
    }
  };

  const handleUnassignStudent = (studentUserId: string) => {
    setAssignedStudentUserIds((prev) => prev.filter((id) => id !== studentUserId));
  };

  const handleSaveStudentAssignments = async () => {
    setSavingAssignments(true);
    setFeedback(null);
    try {
      const fProfileId = mentor?.faculty_profiles?.[0]?.id;

      const previousAssigned = allStudentsList
        .filter((s) => s.mentorId === facultyId || (fProfileId && s.mentorId === fProfileId))
        .map((s) => s.userId);

      // Unassign removed students
      const removedIds = previousAssigned.filter((id) => !assignedStudentUserIds.includes(id));
      if (removedIds.length > 0) {
        await supabase
          .from('student_profiles')
          .update({ mentor_id: null })
          .in('user_id', removedIds);
      }

      // Assign selected students
      const newlyAddedIds = assignedStudentUserIds.filter((id) => !previousAssigned.includes(id));
      if (newlyAddedIds.length > 0) {
        await supabase
          .from('student_profiles')
          .update({ mentor_id: facultyId })
          .in('user_id', newlyAddedIds);
      }

      setFeedback({
        type: 'success',
        message: `Successfully saved ${assignedStudentUserIds.length} assigned students for ${mentor?.name}. Redirecting...`
      });

      setTimeout(() => {
        router.push(`/admin/faculty/${facultyId}` as any);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save student assignments:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save student assignments.' });
    } finally {
      setSavingAssignments(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute role="admin">
        <PageShell title="Assign Students" subtitle="Loading student roster...">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  if (!mentor) {
    return (
      <ProtectedRoute role="admin">
        <PageShell title="Assign Students" subtitle="Mentor not found">
          <div className="p-8 text-center">
            <p className="text-slate-500 font-semibold mb-4">Mentor profile not found.</p>
            <button
              onClick={() => router.push('/admin/faculty')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Manage Mentors</span>
            </button>
          </div>
        </PageShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="admin">
      <PageShell title={`Assign Students to ${mentor.name}`} subtitle="Drag & drop or select students to assign as mentees">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/faculty" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => router.push(`/admin/faculty/${facultyId}` as any)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-700" />
                <span>Back to {mentor.name}'s Profile</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/admin/faculty/${facultyId}` as any)}
                  disabled={savingAssignments}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStudentAssignments}
                  disabled={savingAssignments}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-extrabold text-white transition shadow-md cursor-pointer"
                >
                  {savingAssignments ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Assignments...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Save Student Assignments ({assignedStudentUserIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Banner Header */}
            <div className="portal-card bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white border-0 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-400" />
                    <span>Student Mentee Assignment: {mentor.name}</span>
                  </h2>
                  <p className="mt-1 text-xs text-emerald-100/90">
                    Drag and drop student cards between columns or click <b>+</b> / <b>✕</b> buttons to manage mentee allocation.
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                  <span className="text-[10px] font-black uppercase text-emerald-200 block tracking-wider">Assigned Total</span>
                  <span className="text-xl font-black text-white">{assignedStudentUserIds.length} Students</span>
                </div>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="portal-card p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter student by name, roll number, or branch..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Drag and Drop Main Grid Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
              
              {/* Column 1: Available / Unassigned Students */}
              <div
                className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedUserId) {
                    handleUnassignStudent(draggedUserId);
                    setDraggedUserId(null);
                  }
                }}
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Available Students List
                  </h3>
                  <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {allStudentsList.filter((s) => !assignedStudentUserIds.includes(s.userId)).length} Available
                  </span>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2.5 max-h-[600px] pr-1">
                  {(() => {
                    const unassignedList = allStudentsList.filter((s) => {
                      const isNotAssignedHere = !assignedStudentUserIds.includes(s.userId);
                      const matchesQuery = 
                        s.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                        s.rollNumber.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                        s.branch.toLowerCase().includes(assignSearchQuery.toLowerCase());
                      return isNotAssignedHere && matchesQuery;
                    });

                    if (unassignedList.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-slate-400 italic">
                          No available students found matching query.
                        </div>
                      );
                    }

                    return unassignedList.map((st) => (
                      <div
                        key={st.userId}
                        draggable
                        onDragStart={() => setDraggedUserId(st.userId)}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/40 hover:border-emerald-300 transition flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 truncate">{st.name}</div>
                            <div className="text-[11px] font-mono font-bold text-slate-500 mt-0.5">
                              {st.rollNumber} • <span className="uppercase text-emerald-800 font-extrabold">{st.branch}</span>
                              <span className="text-slate-400 font-normal ml-1">({st.section ? `Sec ${st.section} • ` : ''}{st.btechYear})</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAssignStudent(st.userId)}
                          className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shrink-0 cursor-pointer shadow-2xs"
                          title="Assign to mentor"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Column 2: Assigned Students */}
              <div
                className="flex flex-col rounded-[28px] border-2 border-emerald-200 bg-white p-5 shadow-sm"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedUserId) {
                    handleAssignStudent(draggedUserId);
                    setDraggedUserId(null);
                  }
                }}
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
                  <h3 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-700" />
                    <span>Assigned to {mentor.name}</span>
                  </h3>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    {assignedStudentUserIds.length} Assigned
                  </span>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2.5 max-h-[600px] pr-1">
                  {(() => {
                    const assignedList = allStudentsList.filter((s) => {
                      const isAssignedHere = assignedStudentUserIds.includes(s.userId);
                      const matchesQuery = 
                        s.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                        s.rollNumber.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                        s.branch.toLowerCase().includes(assignSearchQuery.toLowerCase());
                      return isAssignedHere && matchesQuery;
                    });

                    if (assignedList.length === 0) {
                      return (
                        <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-emerald-200 rounded-2xl">
                          Drag students here or click <b>+</b> from the list on the left to assign.
                        </div>
                      );
                    }

                    return assignedList.map((st) => (
                      <div
                        key={st.userId}
                        draggable
                        onDragStart={() => setDraggedUserId(st.userId)}
                        className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 transition flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="h-4 w-4 text-emerald-400 group-hover:text-emerald-700 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 truncate">{st.name}</div>
                            <div className="text-[11px] font-mono font-bold text-emerald-900 mt-0.5">
                              {st.rollNumber} • <span className="uppercase">{st.branch}</span>
                              <span className="text-slate-500 font-normal ml-1">({st.section ? `Sec ${st.section} • ` : ''}{st.btechYear})</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnassignStudent(st.userId)}
                          className="p-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 transition shrink-0 cursor-pointer shadow-2xs"
                          title="Remove assignment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
