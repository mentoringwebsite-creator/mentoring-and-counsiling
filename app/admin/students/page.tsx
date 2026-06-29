'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/sidebar';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Trash2, ShieldAlert, GraduationCap, Plus, X, Edit2, Award, 
  BookOpen, Sparkles, Upload, TrendingUp, BarChart3, Target, Zap, 
  AlertTriangle, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const adminSidebarItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pending', label: 'Pending Approvals' },
  { href: '/admin/students', label: 'Manage Students' },
  { href: '/admin/faculty', label: 'Manage Faculty' },
  { href: '/admin/hod', label: 'Manage HOD' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Academic Manager States
  const [academicModalOpen, setAcademicModalOpen] = useState(false);
  const [selectedStudentForAcademic, setSelectedStudentForAcademic] = useState<any | null>(null);
  const [academicProfileId, setAcademicProfileId] = useState<string | null>(null);
  const [academicSgpa, setAcademicSgpa] = useState<number>(8.0);
  const [academicCgpa, setAcademicCgpa] = useState<number>(8.0);
  const [academicBacklogs, setAcademicBacklogs] = useState<number>(0);
  const [academicSubjects, setAcademicSubjects] = useState<any[]>([]);
  const [academicSelectedSem, setAcademicSelectedSem] = useState<string>('All');
  const [academicSaving, setAcademicSaving] = useState(false);

  // AI OCR Parser states
  const [parsingMarksheet, setParsingMarksheet] = useState(false);
  const [parsingFeedback, setParsingFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [groqKey, setGroqKey] = useState('');
  const [groqModel, setGroqModel] = useState('meta-llama/llama-4-scout-17b-16e-instruct');
  const [aiEngine] = useState<'gemini' | 'groq'>('groq');
  const [serverGroqConfigured, setServerGroqConfigured] = useState(false);

  // Cumulative score input states
  const [statsEditMode, setStatsEditMode] = useState(false);
  const [inputSgpa, setInputSgpa] = useState('8.0');
  const [inputCgpa, setInputCgpa] = useState('8.0');
  const [inputBacklogs, setInputBacklogs] = useState('0');

  // Add/Edit subject modal states
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [subName, setSubName] = useState('');
  const [subSemester, setSubSemester] = useState('1');
  const [subMid1, setSubMid1] = useState('');
  const [subMid2, setSubMid2] = useState('');
  const [subSemesterMarks, setSubSemesterMarks] = useState('');
  const [subGpa, setSubGpa] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, role, status,
          student_profiles!user_id (
            id, roll_number, branch, section, academic_year, phone, dob, profile_photo, mentor_id, sgpa, cgpa, backlogs, academic_subjects
          )
        `)
        .eq('role', 'student')
        .eq('status', 'Approved');

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load students.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'faculty')
        .eq('status', 'Approved');
      if (error) throw error;
      setFacultyList(data || []);
    } catch (err: any) {
      console.error('Error fetching faculty list:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchFaculty();

    // Check server key configuration
    fetch('/api/admin/config-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServerGroqConfigured(data.groqConfigured);
        }
      })
      .catch(err => console.error('Failed to load server config status:', err));

    if (typeof window !== 'undefined') {
      setGroqKey(localStorage.getItem('admin_groq_key') || '');
      const storedModel = localStorage.getItem('admin_groq_model');
      if (storedModel) setGroqModel(storedModel);
    }
  }, []);

  const handleMentorChange = async (studentUserId: string, newMentorId: string) => {
    try {
      setFeedback(null);
      const { error } = await supabase
        .from('student_profiles')
        .update({ mentor_id: newMentorId || null })
        .eq('user_id', studentUserId);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Student mentor updated successfully.' });
      fetchStudents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update student mentor.' });
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'Pending' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: `Student status changed to ${newStatus}.` });
      fetchStudents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update student.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to completely delete this student account? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Student account deleted successfully.' });
      fetchStudents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete student.' });
    }
  };

  // Academic Profile Actions
  const openAcademicModal = (student: any) => {
    setSelectedStudentForAcademic(student);
    const profile = student.student_profiles?.[0] || {};
    setAcademicProfileId(profile.id || null);
    setAcademicSgpa(profile.sgpa !== undefined && profile.sgpa !== null ? Number(profile.sgpa) : 8.0);
    setAcademicCgpa(profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0);
    setAcademicBacklogs(profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0);
    setAcademicSubjects(profile.academic_subjects || []);

    setInputSgpa((profile.sgpa !== undefined && profile.sgpa !== null ? Number(profile.sgpa) : 8.0).toString());
    setInputCgpa((profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 8.0).toString());
    setInputBacklogs((profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0).toString());

    setStatsEditMode(false);
    setAcademicModalOpen(true);
  };

  const handleAcademicSave = async (updatedSgpa: number, updatedCgpa: number, updatedBacklogs: number, updatedSubjects: any[]) => {
    if (!academicProfileId) {
      alert('Student profile record not found.');
      return;
    }

    try {
      setAcademicSaving(true);
      const { error } = await supabase
        .from('student_profiles')
        .update({
          sgpa: updatedSgpa,
          cgpa: updatedCgpa,
          backlogs: updatedBacklogs,
          academic_subjects: updatedSubjects
        })
        .eq('id', academicProfileId);

      if (error) throw error;

      // Update local state of the students list so it reflects dynamically without full page reload
      setStudents((prev) => 
        prev.map((s) => {
          if (s.id === selectedStudentForAcademic.id) {
            const updatedProfile = {
              ...s.student_profiles[0],
              sgpa: updatedSgpa,
              cgpa: updatedCgpa,
              backlogs: updatedBacklogs,
              academic_subjects: updatedSubjects
            };
            return {
              ...s,
              student_profiles: [updatedProfile]
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      console.error('Error updating academic records:', err);
      alert(err.message || 'Failed to update academic profile.');
    } finally {
      setAcademicSaving(false);
    }
  };

  const processPdfFile = async (file: File): Promise<{ pdfText?: string, fileBase64s?: string[], mimeType: string }> => {
    const loadPdfJS = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).pdfjsLib) {
          resolve((window as any).pdfjsLib);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          const pdfjsLib = (window as any).pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
        document.head.appendChild(script);
      });
    };

    const pdfjsLib = await loadPdfJS();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    if (fullText.trim().length > 100) {
      console.log('Extracted text from PDF:', fullText.trim().substring(0, 200));
      return { pdfText: fullText, mimeType: 'text/plain' };
    }

    console.log(`No text found in PDF. Rendering all ${pdf.numPages} pages to images...`);
    const base64s: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        base64s.push(base64);
      }
    }
    return { fileBase64s: base64s, mimeType: 'image/jpeg' };
  };

  const handleMarksheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsingMarksheet(true);
      setParsingFeedback(null);

      let payload: { fileBase64?: string; fileBase64s?: string[]; pdfText?: string; mimeType: string } = { mimeType: file.type };

      if (file.type === 'application/pdf') {
        payload = await processPdfFile(file);
      } else {
        const getFileBase64 = (): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 1200;
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
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                  resolve(dataUrl.split(',')[1]);
                } else {
                  reject(new Error('Canvas context not available'));
                }
              };
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = event.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
          });
        };

        const base64 = await getFileBase64();
        payload = { fileBase64: base64, mimeType: file.type };
      }

      const response = await fetch('/api/admin/parse-marksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-groq-key': groqKey.trim()
        },
        body: JSON.stringify({
          fileBase64: payload.fileBase64,
          fileBase64s: payload.fileBase64s,
          pdfText: payload.pdfText,
          fileName: file.name,
          mimeType: payload.mimeType,
          engine: 'groq',
          groqModel: groqModel
        })
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 150)}`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to parse marksheet.');
      }

      const parsedData = result.data;
      
      // Smart Merging Logic:
      // Merge newly parsed subjects with existing subjects (academicSubjects)
      // Check if subject name and semester match. If yes, update it. If not, append it.
      const existingSubjects = academicSubjects || [];
      const newSubjects = parsedData.subjects || [];
      
      const mergedSubjects = [...existingSubjects];
      newSubjects.forEach((newSub: any) => {
        const idx = mergedSubjects.findIndex(
          (s) => (s.name || '').toLowerCase().trim() === (newSub.name || '').toLowerCase().trim() && 
                 Number(s.semester) === Number(newSub.semester)
        );
        if (idx > -1) {
          mergedSubjects[idx] = { ...mergedSubjects[idx], ...newSub };
        } else {
          mergedSubjects.push(newSub);
        }
      });

      setAcademicSgpa(Number(parsedData.sgpa) || 8.0);
      setAcademicCgpa(Number(parsedData.cgpa) || 8.0);
      setAcademicBacklogs(Number(parsedData.backlogs) || 0);

      setInputSgpa((Number(parsedData.sgpa) || 8.0).toString());
      setInputCgpa((Number(parsedData.cgpa) || 8.0).toString());
      setInputBacklogs((Number(parsedData.backlogs) || 0).toString());

      setAcademicSubjects(mergedSubjects);

      setParsingFeedback({
        type: 'success',
        message: `Successfully parsed marksheet! (${result.source || 'AI Extraction'}) loaded ${newSubjects.length} subjects (total: ${mergedSubjects.length}).`
      });

      await handleAcademicSave(
        Number(parsedData.sgpa) || 8.0,
        Number(parsedData.cgpa) || 8.0,
        Number(parsedData.backlogs) || 0,
        mergedSubjects
      );

    } catch (err: any) {
      console.error(err);
      setParsingFeedback({ type: 'error', message: err.message || 'Failed to parse file.' });
    } finally {
      setParsingMarksheet(false);
    }
  };

  const handleStatsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSgpa = Number(inputSgpa) || 0;
    const newCgpa = Number(inputCgpa) || 0;
    const newBacklogs = parseInt(inputBacklogs) || 0;

    setAcademicSgpa(newSgpa);
    setAcademicCgpa(newCgpa);
    setAcademicBacklogs(newBacklogs);
    setStatsEditMode(false);

    await handleAcademicSave(newSgpa, newCgpa, newBacklogs, academicSubjects);
  };

  // Subject Sub-modal operations
  const openAddSubModal = () => {
    setEditingSubIndex(null);
    setSubName('');
    setSubSemester(academicSelectedSem === 'All' ? '1' : academicSelectedSem);
    setSubMid1('');
    setSubMid2('');
    setSubSemesterMarks('');
    setSubGpa('');
    setSubModalOpen(true);
  };

  const openEditSubModal = (index: number) => {
    const sub = academicSubjects[index];
    setEditingSubIndex(index);
    setSubName(sub.name || '');
    setSubSemester(sub.semester?.toString() || '1');
    setSubMid1(sub.mid1?.toString() || '');
    setSubMid2(sub.mid2?.toString() || '');
    setSubSemesterMarks(sub.semester_marks?.toString() || '');
    setSubGpa(sub.gpa?.toString() || '');
    setSubModalOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    const newSub = {
      name: subName.trim(),
      semester: parseInt(subSemester) || 1,
      mid1: subMid1.trim() || '-',
      mid2: subMid2.trim() || '-',
      semester_marks: subSemesterMarks.trim() || '-',
      gpa: subGpa.trim() || '-',
    };

    let updatedSubjects = [...academicSubjects];
    if (editingSubIndex !== null) {
      updatedSubjects[editingSubIndex] = newSub;
    } else {
      updatedSubjects.push(newSub);
    }

    setAcademicSubjects(updatedSubjects);
    setSubModalOpen(false);
    await handleAcademicSave(academicSgpa, academicCgpa, academicBacklogs, updatedSubjects);
  };

  const handleSubDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this subject?')) return;
    const updatedSubjects = academicSubjects.filter((_, i) => i !== index);
    setAcademicSubjects(updatedSubjects);
    await handleAcademicSave(academicSgpa, academicCgpa, academicBacklogs, updatedSubjects);
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

  const filteredAcademicSubjects = academicSubjects.filter((sub) => {
    if (academicSelectedSem === 'All') return true;
    return sub.semester?.toString() === academicSelectedSem;
  });

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

  const getSemesterGPAData = () => {
    const semMap: { [key: number]: number[] } = {};
    academicSubjects.forEach((sub) => {
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

  const getSubjectGPADistribution = () => {
    return filteredAcademicSubjects
      .map((sub) => {
        const gp = convertGradeToGP(sub.gpa);
        return {
          name: sub.name,
          GPA: gp === null ? 0 : gp,
        };
      })
      .filter((d) => d.GPA > 0);
  };

  const subjectChartData = getSubjectGPADistribution();

  // Automated Strengths, Weaknesses, and Progress Momentum Analysis
  const getAcademicAnalysis = () => {
    if (academicSubjects.length === 0) return null;

    // 1. Core strengths (GPAs >= 9.0 or grades O/S/A+)
    const isStrength = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp >= 9.0;
    };
    const strengths = academicSubjects.filter(s => isStrength(s.gpa)).map(s => s.name);

    // 2. Focus areas (GPAs < 7.5 or grades B/C/F)
    const isWeakness = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp < 7.5;
    };
    const weaknesses = academicSubjects.filter(s => isWeakness(s.gpa)).map(s => s.name);

    // 3. GPA Momentum (Latest vs Previous Semester)
    const semGPAs: { [key: number]: number } = {};
    const semMap: { [key: number]: number[] } = {};
    academicSubjects.forEach((sub) => {
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
    if (academicCgpa >= 8.5) placementScore = 95;
    else if (academicCgpa >= 8.0) placementScore = 88;
    else if (academicCgpa >= 7.0) placementScore = 78;
    else if (academicCgpa >= 6.0) placementScore = 65;
    else placementScore = 45;

    if (academicBacklogs > 0) placementScore = Math.max(30, placementScore - 15);

    return {
      strengths: strengths.slice(0, 3), // Top 3
      weaknesses: weaknesses.slice(0, 3), // Top 3
      momentum,
      momentumVal,
      placementScore
    };
  };

  const analysis = getAcademicAnalysis();

  return (
    <ProtectedRoute role="admin">
      <PageShell title="Manage Students" subtitle="View and manage approved student accounts">
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0">
          <Sidebar active="/admin/students" items={adminSidebarItems} />

          <div className="space-y-6 w-full min-w-0">
            <div className="portal-card">
              <h2 className="text-2xl font-semibold">Approved Students</h2>
              <p className="mt-2 text-slate-600">Review student profiles, manage their assignments, update academic marks, or suspend accounts.</p>
            </div>

            {feedback && (
              <div className={`rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === 'success' 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {feedback.message}
              </div>
            )}

            <div className="overflow-x-auto w-full rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Student Name / Email</th>
                    <th className="px-5 py-4 font-semibold">Roll Number</th>
                    <th className="px-5 py-4 font-semibold">Branch & Section</th>
                    <th className="px-5 py-4 font-semibold">Contact Info</th>
                    <th className="px-5 py-4 font-semibold">Assigned Mentor</th>
                    <th className="px-5 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                          <span>Loading students…</span>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={6}>No approved students found.</td>
                    </tr>
                  ) : null}
                  {students.map((student) => {
                    const profile = student.student_profiles?.[0] || {};
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                              {profile.profile_photo ? (
                                <img
                                  src={profile.profile_photo}
                                  alt={student.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(student.name)}`;
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-slate-500 text-sm">{student.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{student.name}</div>
                              <div className="text-xs text-slate-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-slate-700">{profile.roll_number || '-'}</td>
                        <td className="px-5 py-4 text-slate-700">
                          <div>{profile.branch || '-'}</div>
                          <div className="text-xs text-slate-500">Sec: {profile.section || '-'} | Year: {profile.academic_year || '-'}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div>Primary: {profile.phone || '-'}</div>
                          <div className="text-xs text-slate-500">Alt: {profile.alternate_phone || '-'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={profile.mentor_id || ''}
                            onChange={(e) => handleMentorChange(student.id, e.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none w-full max-w-[170px]"
                          >
                            <option value="">Unassigned</option>
                            {facultyList.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openAcademicModal(student)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition"
                              title="Manage Academic profile, subjects and marks"
                            >
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>Academics</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(student.id, 'Pending')}
                              className="inline-flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                              title="Suspend Approval (back to pending)"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(student.id)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                              title="Delete Student"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==================== ACADEMIC MANAGER MODAL ==================== */}
        {academicModalOpen && selectedStudentForAcademic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setAcademicModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <GraduationCap className="h-6 w-6 text-emerald-800" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Manage Academic Profile</h3>
                  <p className="text-xs text-slate-500">Student: <span className="font-bold text-slate-800">{selectedStudentForAcademic.name}</span> ({selectedStudentForAcademic.student_profiles?.[0]?.roll_number || 'No Roll No.'})</p>
                </div>
              </div>

              {/* AI Marksheet Scanner (OCR & Parsing) */}
              <div className="mt-5 p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-sm">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-800" />
                    <span>AI Marksheet Document Scanner</span>
                  </div>
                  {/* Engine & Key Selectors */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-650">Groq Vision Model:</span>
                    <select
                      value={groqModel}
                      onChange={(e) => {
                        const model = e.target.value;
                        setGroqModel(model);
                        localStorage.setItem('admin_groq_model', model);
                        setParsingFeedback(null);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B (Recommended)</option>
                      <option value="qwen/qwen3.6-27b">Qwen 3.6 27B</option>
                      <option value="llama-3.2-11b-vision-preview">Llama 3.2 11B (Vision)</option>
                    </select>

                    <input 
                      type="password"
                      placeholder={serverGroqConfigured ? "Groq Key Active on Server" : "Paste Groq API Key..."}
                      value={groqKey}
                      onChange={(e) => {
                        setGroqKey(e.target.value);
                        localStorage.setItem('admin_groq_key', e.target.value);
                      }}
                      className="rounded-xl border border-slate-350 bg-white px-3 py-1.5 text-[10px] focus:outline-none w-[200px] focus:border-emerald-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row items-center justify-between">
                  <div className="text-xs text-slate-650 max-w-md">
                    Upload a marksheet image (PNG/JPG) or PDF. The AI will extract all subjects, marks, SGPA, and CGPA automatically!
                  </div>

                  <div className="relative shrink-0 w-full md:w-auto">
                    <input 
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={parsingMarksheet}
                      onChange={handleMarksheetUpload}
                      className="hidden"
                      id="marksheet-upload-input"
                    />
                    <label 
                      htmlFor="marksheet-upload-input"
                      className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-3 text-xs font-bold text-white transition shadow-sm w-full md:w-auto ${parsingMarksheet ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {parsingMarksheet ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white mr-1" />
                          <span>AI Parsing Document...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          <span>Upload Marksheet PDF / Image</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {parsingFeedback && (
                  <div className={`mt-3.5 rounded-2xl border px-4 py-3 text-xs font-semibold ${
                    parsingFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}>
                    {parsingFeedback.message}
                  </div>
                )}
              </div>

              {/* Cumulative stats section */}
              <div className="mt-5 p-4 rounded-3xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                    <Award className="h-4.5 w-4.5 text-emerald-800" />
                    <span>Cumulative Scorecard</span>
                  </div>
                  {!statsEditMode ? (
                    <button
                      onClick={() => setStatsEditMode(true)}
                      className="text-xs font-bold text-emerald-800 hover:underline"
                    >
                      Edit Scores
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Editing...</span>
                  )}
                </div>

                {!statsEditMode ? (
                  <div className="grid gap-3 grid-cols-3 text-center">
                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest SGPA</div>
                      <div className="text-xl font-bold text-emerald-800 mt-1">{academicSgpa.toFixed(2)}</div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative CGPA</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{academicCgpa.toFixed(2)}</div>
                    </div>
                    <div className={`border rounded-2xl p-3 shadow-sm bg-white ${academicBacklogs > 0 ? 'border-rose-100 text-rose-800' : 'border-slate-100 text-slate-700'}`}>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Backlogs</div>
                      <div className="text-xl font-bold mt-1">{academicBacklogs}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStatsSubmit} className="grid gap-4 md:grid-cols-4 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={inputSgpa}
                        onChange={(e) => setInputSgpa(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={inputCgpa}
                        onChange={(e) => setInputCgpa(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        value={inputBacklogs}
                        onChange={(e) => setInputBacklogs(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={academicSaving}
                        className="rounded-xl bg-[#1c5644] hover:bg-[#154335] px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-1 justify-center shrink-0 w-full"
                      >
                        {academicSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatsEditMode(false)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Subject overview list inside modal */}
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-4">
                    <h4 className="font-bold text-slate-800 text-base">Course Subjects & Marks</h4>
                    
                    <select
                      value={academicSelectedSem}
                      onChange={(e) => setAcademicSelectedSem(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 focus:outline-none"
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
                  </div>

                  <button
                    onClick={openAddSubModal}
                    className="rounded-xl bg-[#1c5644] hover:bg-[#154335] px-3.5 py-2 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                {academicSaving && (
                  <div className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-2 rounded-xl mb-3 flex items-center gap-1.5 border border-emerald-100">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving changes to Supabase...</span>
                  </div>
                )}

                {filteredAcademicSubjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No subjects registered for this student under the selected filter.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                          <th className="p-3">Subject Name</th>
                          <th className="p-3">Semester</th>
                          <th className="p-3">Mid-1</th>
                          <th className="p-3">Mid-2</th>
                          <th className="p-3">Semester Marks</th>
                          <th className="p-3">GPA</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAcademicSubjects.map((sub, index) => {
                          const originalIndex = academicSubjects.findIndex(s => s === sub);
                          return (
                            <tr key={index} className="hover:bg-slate-50/30">
                              <td className="p-3 font-semibold text-slate-900">{sub.name}</td>
                              <td className="p-3 text-slate-700">{semesterLabels[sub.semester]?.short || `Sem ${sub.semester}`}</td>
                              <td className="p-3 text-slate-600">{sub.mid1}</td>
                              <td className="p-3 text-slate-600">{sub.mid2}</td>
                              <td className="p-3 text-slate-600">{sub.semester_marks}</td>
                              <td className="p-3 font-bold text-slate-900">{sub.gpa}</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditSubModal(originalIndex)}
                                    className="rounded-lg border border-slate-200 hover:bg-slate-50 p-1.5 text-slate-600 transition shadow-sm bg-white"
                                    title="Edit Subject Marks"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleSubDelete(originalIndex)}
                                    className="rounded-lg border border-slate-200 hover:bg-rose-50 p-1.5 text-rose-600 transition shadow-sm bg-white"
                                    title="Delete Subject"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recharts Analytics Charts */}
              {academicSubjects.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 mt-6 border-t border-slate-100 pt-6">
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
                        <BarChart3 className="h-5 w-5 text-orange-655" />
                        <h4 className="text-sm font-bold text-slate-800">
                          {academicSelectedSem === 'All' ? 'Overall Subject Grade Points' : `Sem ${academicSelectedSem} Subject Grade Points`}
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
              {academicSubjects.length > 0 && analysis && (
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
                          Estimated placement readiness based on CGPA of {academicCgpa.toFixed(2)} and {academicBacklogs} active backlogs.
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
                              {analysis.strengths.map((str, idx) => (
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
                              {analysis.weaknesses.map((weak, idx) => (
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
                                <p className="text-xs font-bold text-slate-800">Downward Trajectory</p>
                                <p className="text-[10px] text-slate-505 mt-1 font-semibold">{analysis.momentumVal} GPA drop. Mentoring recommended.</p>
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
          </div>
        )}

        {/* ==================== ADD/EDIT SUBJECT SUB-MODAL ==================== */}
        {subModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSubModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <BookOpen className="h-5 w-5 text-emerald-800" />
                <span>{editingSubIndex !== null ? 'Edit Course Marks' : 'Add Course Marks'}</span>
              </h3>

              <form onSubmit={handleSubSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g. Mathematics-I"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
                    <select
                      value={subSemester}
                      onChange={(e) => setSubSemester(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="1">I Year I Semester (1-1)</option>
                      <option value="2">I Year II Semester (1-2)</option>
                      <option value="3">II Year I Semester (2-1)</option>
                      <option value="4">II Year II Semester (2-2)</option>
                      <option value="5">III Year I Semester (3-1)</option>
                      <option value="6">III Year II Semester (3-2)</option>
                      <option value="7">IV Year I Semester (4-1)</option>
                      <option value="8">IV Year II Semester (4-2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={subGpa}
                      onChange={(e) => setSubGpa(e.target.value)}
                      placeholder="e.g. 9.0"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mid-1</label>
                    <input
                      type="text"
                      value={subMid1}
                      onChange={(e) => setSubMid1(e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mid-2</label>
                    <input
                      type="text"
                      value={subMid2}
                      onChange={(e) => setSubMid2(e.target.value)}
                      placeholder="e.g. 19"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Semester</label>
                    <input
                      type="text"
                      value={subSemesterMarks}
                      onChange={(e) => setSubSemesterMarks(e.target.value)}
                      placeholder="e.g. 84"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
                  >
                    Save Subject
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
