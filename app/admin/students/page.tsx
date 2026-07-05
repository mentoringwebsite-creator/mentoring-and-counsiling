'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [academicSgpa, setAcademicSgpa] = useState<number>(0);
  const [academicCgpa, setAcademicCgpa] = useState<number>(0);
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
  const [inputSgpa, setInputSgpa] = useState('0');
  const [inputCgpa, setInputCgpa] = useState('0');
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
  const [mounted, setMounted] = useState(false);
  const [targetUploadSemester, setTargetUploadSemester] = useState<string | null>(null);
  const [subInternalMarks, setSubInternalMarks] = useState('');
  const [subTotalMarks, setSubTotalMarks] = useState('');

  // Certificate Specific States
  const [memoNo, setMemoNo] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [examDate, setExamDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [hallTicketNo, setHallTicketNo] = useState('');
  const [branch, setBranch] = useState('');
  const [totalCredits, setTotalCredits] = useState('');
  const [passStatus, setPassStatus] = useState('PASS');
  const [semSgpa, setSemSgpa] = useState('');

  // Add/Edit subject modal extra states
  const [subCode, setSubCode] = useState('');
  const [subCredits, setSubCredits] = useState('3');
  const [subResult, setSubResult] = useState('P');

  // Student filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  const getStudentBTechYear = (profile: any) => {
    const acYearStr = String(profile.academic_year || '').toLowerCase();
    if (acYearStr.includes('i year') || acYearStr.includes('1st year') || acYearStr === '1' || acYearStr.includes('first')) return 'I Year';
    if (acYearStr.includes('ii year') || acYearStr.includes('2nd year') || acYearStr === '2' || acYearStr.includes('second')) return 'II Year';
    if (acYearStr.includes('iii year') || acYearStr.includes('3rd year') || acYearStr === '3' || acYearStr.includes('third')) return 'III Year';
    if (acYearStr.includes('iv year') || acYearStr.includes('4th year') || acYearStr === '4' || acYearStr.includes('fourth')) return 'IV Year';

    const roll = String(profile.roll_number || '').trim();
    if (roll.length >= 2) {
      const joinYearDigits = parseInt(roll.substring(0, 2));
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

  // Certificate metadata helper functions & synchronization hooks
  const getSemesterMetadata = (sem: string) => {
    const sub = academicSubjects.find(s => s.semester?.toString() === sem);
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

  const handleMetadataChange = (newMetadata: any) => {
    if (academicSelectedSem === 'All') return;
    const updated = academicSubjects.map(s => {
      if (s.semester?.toString() === academicSelectedSem) {
        return { ...s, ...newMetadata };
      }
      return s;
    });
    setAcademicSubjects(updated);
  };

  useEffect(() => {
    if (academicSelectedSem === 'All') {
      setMemoNo('');
      setSerialNo('');
      setExamDate('');
      setIssueDate('');
      setTotalCredits('');
      setPassStatus('PASS');
      setSemSgpa('');
    } else {
      const sub = academicSubjects.find(s => s.semester?.toString() === academicSelectedSem);
      setMemoNo(sub?.memo_no || '');
      setSerialNo(sub?.serial_no || '');
      setExamDate(sub?.exam_date || '');
      setIssueDate(sub?.issue_date || '');
      setTotalCredits(sub?.total_credits || '');
      setPassStatus(sub?.pass_status || 'PASS');
      setSemSgpa(sub?.sgpa || '');
    }
  }, [academicSelectedSem, academicSubjects]);

  useEffect(() => {
    if (selectedStudentForAcademic) {
      const profile = selectedStudentForAcademic.student_profiles?.[0] || {};
      setHallTicketNo(profile.roll_number || '');
      setBranch(profile.branch || '');

      const firstWithFather = academicSubjects.find(s => s.father_name);
      setFatherName(firstWithFather?.father_name || '');
      if (firstWithFather?.branch && !profile.branch) {
        setBranch(firstWithFather.branch);
      }
      if (firstWithFather?.hall_ticket_no && !profile.roll_number) {
        setHallTicketNo(firstWithFather.hall_ticket_no);
      }
    }
  }, [selectedStudentForAcademic, academicSubjects]);

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
    setMounted(true);
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
    setAcademicSgpa(profile.sgpa !== undefined && profile.sgpa !== null ? Number(profile.sgpa) : 0);
    setAcademicCgpa(profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 0);
    setAcademicBacklogs(profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0);
    
    const subjectsList = profile.academic_subjects || [];
    setAcademicSubjects(subjectsList);

    setInputSgpa((profile.sgpa !== undefined && profile.sgpa !== null ? Number(profile.sgpa) : 0).toString());
    setInputCgpa((profile.cgpa !== undefined && profile.cgpa !== null ? Number(profile.cgpa) : 0).toString());
    setInputBacklogs((profile.backlogs !== undefined && profile.backlogs !== null ? Number(profile.backlogs) : 0).toString());

    // Initialize personal details
    setHallTicketNo(profile.roll_number || '');
    setBranch(profile.branch || '');
    
    const firstWithFather = subjectsList.find((s: any) => s.father_name);
    setFatherName(firstWithFather?.father_name || '');
    if (firstWithFather?.branch && !profile.branch) {
      setBranch(firstWithFather.branch);
    }
    if (firstWithFather?.hall_ticket_no && !profile.roll_number) {
      setHallTicketNo(firstWithFather.hall_ticket_no);
    }

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
          academic_subjects: updatedSubjects,
          roll_number: hallTicketNo,
          branch: branch
        })
        .eq('id', academicProfileId);

      if (error) throw error;

      // Update local scorecard and input states
      setAcademicSgpa(updatedSgpa);
      setAcademicCgpa(updatedCgpa);
      setAcademicBacklogs(updatedBacklogs);
      setInputSgpa(updatedSgpa.toString());
      setInputCgpa(updatedCgpa.toString());
      setInputBacklogs(updatedBacklogs.toString());

      // Update selectedStudentForAcademic state
      setSelectedStudentForAcademic((prev: any) => {
        if (!prev) return null;
        const updatedProfile = {
          ...prev.student_profiles[0],
          sgpa: updatedSgpa,
          cgpa: updatedCgpa,
          backlogs: updatedBacklogs,
          academic_subjects: updatedSubjects,
          roll_number: hallTicketNo,
          branch: branch
        };
        return {
          ...prev,
          student_profiles: [updatedProfile]
        };
      });

      // Update local state of the students list so it reflects dynamically without full page reload
      setStudents((prev) => 
        prev.map((s) => {
          if (s.id === selectedStudentForAcademic.id) {
            const updatedProfile = {
              ...s.student_profiles[0],
              sgpa: updatedSgpa,
              cgpa: updatedCgpa,
              backlogs: updatedBacklogs,
              academic_subjects: updatedSubjects,
              roll_number: hallTicketNo,
              branch: branch
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

  const triggerSemesterUpload = (semVal: string) => {
    setTargetUploadSemester(semVal);
    const inputEl = document.getElementById('marksheet-upload-input') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.value = '';
      inputEl.click();
    }
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
          groqModel: groqModel,
          studentName: selectedStudentForAcademic?.name,
          rollNumber: hallTicketNo || selectedStudentForAcademic?.student_profiles?.[0]?.roll_number,
          targetSemester: targetUploadSemester
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
      
      // Update metadata states if present in parsed result
      if (parsedData.memo_no) setMemoNo(parsedData.memo_no);
      if (parsedData.serial_no) setSerialNo(parsedData.serial_no);
      if (parsedData.exam_date) setExamDate(parsedData.exam_date);
      if (parsedData.issue_date) setIssueDate(parsedData.issue_date);
      if (parsedData.father_name) setFatherName(parsedData.father_name);
      if (parsedData.hall_ticket_no) setHallTicketNo(parsedData.hall_ticket_no);
      if (parsedData.branch) setBranch(parsedData.branch);
      if (parsedData.total_credits) setTotalCredits(parsedData.total_credits.toString());
      if (parsedData.pass_status) setPassStatus(parsedData.pass_status);
      if (parsedData.sgpa) setSemSgpa(parsedData.sgpa.toString());

      // Smart Merging Logic:
      // Merge newly parsed subjects with existing subjects (academicSubjects)
      // Check if subject name and semester match. If yes, update it. If not, append it.
      const existingSubjects = academicSubjects || [];
      const newSubjects = (parsedData.subjects || []).map((sub: any) => ({
        ...sub,
        memo_no: parsedData.memo_no || '',
        serial_no: parsedData.serial_no || '',
        exam_date: parsedData.exam_date || '',
        issue_date: parsedData.issue_date || '',
        father_name: parsedData.father_name || fatherName || '',
        hall_ticket_no: parsedData.hall_ticket_no || hallTicketNo || '',
        branch: parsedData.branch || branch || '',
        total_credits: parsedData.total_credits || '',
        pass_status: parsedData.pass_status || 'PASS',
        sgpa: parsedData.sgpa?.toString() || sub.sgpa?.toString() || '',
        cgpa: parsedData.cgpa?.toString() || sub.cgpa?.toString() || ''
      }));
      
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
    setSubCode('');
    setSubCredits('3');
    setSubResult('P');
    setSubInternalMarks('');
    setSubTotalMarks('');
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
    setSubCode(sub.code || '');
    setSubCredits((sub.credits || '3').toString());
    setSubResult(sub.result || 'P');
    setSubInternalMarks(sub.internal_marks?.toString() || '');
    setSubTotalMarks(sub.total_marks?.toString() || '');
    setSubModalOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    // Get current semester certificate metadata to attach to the new/edited subject
    const semMeta = getSemesterMetadata(subSemester);

    const newSub = {
      name: subName.trim(),
      semester: parseInt(subSemester) || 1,
      mid1: subMid1.trim() || '-',
      mid2: subMid2.trim() || '-',
      internal_marks: subInternalMarks.trim() || '-',
      semester_marks: subSemesterMarks.trim() || '-',
      total_marks: subTotalMarks.trim() || '-',
      gpa: subGpa.trim() || '-',
      code: subCode.trim() || '-',
      credits: parseFloat(subCredits) || 0,
      result: subResult,
      
      // Attach semester-wide metadata
      memo_no: semMeta.memo_no,
      serial_no: semMeta.serial_no,
      exam_date: semMeta.exam_date,
      issue_date: semMeta.issue_date,
      total_credits: semMeta.total_credits,
      pass_status: semMeta.pass_status,
      father_name: fatherName,
      hall_ticket_no: hallTicketNo,
      branch: branch
    };

    let updatedSubjects = [...academicSubjects];
    if (editingSubIndex !== null) {
      updatedSubjects[editingSubIndex] = { ...updatedSubjects[editingSubIndex], ...newSub };
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

  // Automatically recalculate SGPA, CGPA, and Backlogs when academicSubjects list changes
  useEffect(() => {
    if (!selectedStudentForAcademic) return;

    let calculatedSgpa = 0;
    let calculatedCgpa = 0;
    let backlogCount = 0;

    if (academicSubjects.length > 0) {
      let totalCgpaCredits = 0;
      let totalCgpaPoints = 0;

      academicSubjects.forEach((sub: any) => {
        const gp = convertGradeToGP(sub.gpa);
        const credits = parseFloat(sub.credits) || 0;
        if (gp !== null && credits > 0) {
          totalCgpaCredits += credits;
          totalCgpaPoints += gp * credits;
        }
        const isF = sub.gpa === 'F' || sub.result === 'F' || sub.result === 'FAIL' || (gp !== null && gp < 4.0);
        if (isF) backlogCount++;
      });

      calculatedCgpa = totalCgpaCredits > 0 ? Number((totalCgpaPoints / totalCgpaCredits).toFixed(2)) : 0;

      const semesters = academicSubjects.map((s: any) => parseInt(s.semester)).filter((s: any) => !isNaN(s));
      const latestSem = semesters.length > 0 ? Math.max(...semesters) : 1;

      let totalSgpaCredits = 0;
      let totalSgpaPoints = 0;

      academicSubjects.forEach((sub: any) => {
        if (parseInt(sub.semester) === latestSem) {
          const gp = convertGradeToGP(sub.gpa);
          const credits = parseFloat(sub.credits) || 0;
          if (gp !== null && credits > 0) {
            totalSgpaCredits += credits;
            totalSgpaPoints += gp * credits;
          }
        }
      });

      calculatedSgpa = totalSgpaCredits > 0 ? Number((totalSgpaPoints / totalSgpaCredits).toFixed(2)) : 0;

      // Prioritize saved/parsed SGPA and CGPA if present in subject metadata
      const latestSemSubWithSgpa = academicSubjects.find(
        (sub: any) => parseInt(sub.semester) === latestSem && sub.sgpa && !isNaN(parseFloat(sub.sgpa))
      );
      if (latestSemSubWithSgpa) {
        calculatedSgpa = parseFloat(latestSemSubWithSgpa.sgpa);
      }
      
      const anySubWithCgpa = academicSubjects.find(
        (sub: any) => sub.cgpa && !isNaN(parseFloat(sub.cgpa))
      );
      if (anySubWithCgpa) {
        calculatedCgpa = parseFloat(anySubWithCgpa.cgpa);
      }
    }

    // Only overwrite local state SGPA/CGPA if they are currently 0 or if parsed metadata exists
    const latestSemSubWithSgpa = academicSubjects.find(
      (sub: any) => sub.sgpa && !isNaN(parseFloat(sub.sgpa))
    );
    if (academicSgpa === 0 || latestSemSubWithSgpa) {
      const targetSgpa = latestSemSubWithSgpa ? parseFloat(latestSemSubWithSgpa.sgpa) : calculatedSgpa;
      setAcademicSgpa(targetSgpa);
      setInputSgpa(targetSgpa.toString());
    }

    const anySubWithCgpa = academicSubjects.find(
      (sub: any) => sub.cgpa && !isNaN(parseFloat(sub.cgpa))
    );
    if (academicCgpa === 0 || anySubWithCgpa) {
      const targetCgpa = anySubWithCgpa ? parseFloat(anySubWithCgpa.cgpa) : calculatedCgpa;
      setAcademicCgpa(targetCgpa);
      setInputCgpa(targetCgpa.toString());
    }

    setAcademicBacklogs(backlogCount);
    setInputBacklogs(backlogCount.toString());
  }, [academicSubjects]);

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

  const selectedSemesterSGPA = (() => {
    if (academicSelectedSem === 'All') return null;
    const semNum = parseInt(academicSelectedSem);
    if (isNaN(semNum)) return null;

    const subjectsInSem = academicSubjects.filter(
      (sub) => parseInt(sub.semester) === semNum
    );

    // If the subjects have a parsed SGPA value associated with them, prioritize it!
    const firstSubWithSgpa = subjectsInSem.find(sub => sub.sgpa && !isNaN(parseFloat(sub.sgpa)));
    if (firstSubWithSgpa) {
      return Number(parseFloat(firstSubWithSgpa.sgpa).toFixed(2));
    }

    let totalCredits = 0;
    let weightedGPsum = 0;
    let validGPsCount = 0;

    subjectsInSem.forEach((sub) => {
      const gp = convertGradeToGP(sub.gpa);
      const credits = parseFloat(sub.credits);
      if (gp !== null) {
        validGPsCount++;
        if (!isNaN(credits) && credits >= 0) {
          // Keep credits of 0 for non-credit courses like Induction Program, they won't affect SGPA
          weightedGPsum += gp * credits;
          totalCredits += credits;
        }
      }
    });

    if (validGPsCount === 0) return null;
    
    // If all subjects have 0 credits (or no credits were set), fall back to simple average
    if (totalCredits === 0) {
      const validGPs = subjectsInSem
        .map((sub) => convertGradeToGP(sub.gpa))
        .filter((gp): gp is number => gp !== null);
      const avg = validGPs.reduce((a, b) => a + b, 0) / validGPs.length;
      return Number(avg.toFixed(2));
    }

    const avg = weightedGPsum / totalCredits;
    return Number(avg.toFixed(2));
  })();

  const cumulativeCalculatedCGPA = (() => {
    let totalCredits = 0;
    let weightedGPsum = 0;
    let validGPsCount = 0;

    academicSubjects.forEach((sub) => {
      const gp = convertGradeToGP(sub.gpa);
      const credits = parseFloat(sub.credits);
      if (gp !== null) {
        validGPsCount++;
        if (!isNaN(credits) && credits >= 0) {
          weightedGPsum += gp * credits;
          totalCredits += credits;
        }
      }
    });

    if (validGPsCount === 0) return null;
    if (totalCredits === 0) {
      const validGPs = academicSubjects
        .map((sub) => convertGradeToGP(sub.gpa))
        .filter((gp): gp is number => gp !== null);
      const avg = validGPs.reduce((a, b) => a + b, 0) / validGPs.length;
      return Number(avg.toFixed(2));
    }

    const avg = weightedGPsum / totalCredits;
    return Number(avg.toFixed(2));
  })();

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

  // Dynamic student list filtering
  const filteredStudents = students.filter((student) => {
    const profile = student.student_profiles?.[0] || {};
    
    // 1. Search Query filter (matches name, email, roll number)
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = 
      !query || 
      student.name.toLowerCase().includes(query) || 
      student.email.toLowerCase().includes(query) || 
      (profile.roll_number && profile.roll_number.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    // 2. Year filter
    const studentYear = getStudentBTechYear(profile);
    if (filterYear !== 'All' && studentYear !== filterYear) return false;

    // 3. Branch filter
    const studentBranch = String(profile.branch || '').trim().toUpperCase();
    if (filterBranch !== 'All' && studentBranch !== filterBranch) return false;

    // 4. Section filter
    const studentSection = String(profile.section || '').trim().toUpperCase();
    if (filterSection !== 'All' && studentSection !== filterSection) return false;

    return true;
  });

  // Calculate year counts for filter tabs
  const getYearCount = (year: string) => {
    return students.filter(s => {
      const p = s.student_profiles?.[0] || {};
      return getStudentBTechYear(p) === year;
    }).length;
  };

  // Collect unique branches and sections dynamically
  const uniqueBranches = Array.from(new Set(
    students
      .map(s => String(s.student_profiles?.[0]?.branch || '').trim().toUpperCase())
      .filter(b => b.length > 0)
  )).sort();

  const uniqueSections = Array.from(new Set(
    students
      .map(s => String(s.student_profiles?.[0]?.section || '').trim().toUpperCase())
      .filter(sec => sec.length > 0)
  )).sort();

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

            {/* B.Tech Academic Year Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { id: 'All', label: 'All Students', count: students.length, color: 'from-emerald-800/10 to-teal-800/10' },
                { id: 'I Year', label: 'I Year (1st)', count: getYearCount('I Year'), color: 'from-blue-500/10 to-indigo-500/10' },
                { id: 'II Year', label: 'II Year (2nd)', count: getYearCount('II Year'), color: 'from-cyan-500/10 to-teal-500/10' },
                { id: 'III Year', label: 'III Year (3rd)', count: getYearCount('III Year'), color: 'from-amber-500/10 to-orange-500/10' },
                { id: 'IV Year', label: 'IV Year (4th)', count: getYearCount('IV Year'), color: 'from-rose-500/10 to-pink-500/10' }
              ].map((tab) => {
                const isActive = filterYear === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterYear(tab.id)}
                    className={`text-left rounded-3xl border p-4 transition-all duration-300 relative overflow-hidden group shadow-sm flex flex-col justify-between ${
                      isActive 
                        ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-md ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 bg-white hover:border-slate-350 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-800' : 'text-slate-400'}`}>
                        {tab.label}
                      </span>
                      <span className={`inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-black transition-colors ${
                        isActive ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}>
                        {tab.count}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className={`text-sm font-extrabold tracking-tight ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {tab.id === 'All' ? 'Full Roster' : `${tab.id}`}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                        {tab.id === 'All' ? 'SNIST Portal' : 'B.Tech Stream'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Search and Filters Toolbar */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search query box */}
                <div className="relative w-full md:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email, or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none placeholder-slate-400 transition"
                  />
                </div>

                {/* Dropdowns */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Branch select */}
                  <div className="flex items-center gap-1.5 bg-slate-50/50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch</span>
                    <select
                      value={filterBranch}
                      onChange={(e) => setFilterBranch(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Branches</option>
                      {uniqueBranches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section select */}
                  <div className="flex items-center gap-1.5 bg-slate-50/50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</span>
                    <select
                      value={filterSection}
                      onChange={(e) => setFilterSection(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Sections</option>
                      {uniqueSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Filters button */}
                  {(filterYear !== 'All' || filterBranch !== 'All' || filterSection !== 'All' || searchQuery !== '') && (
                    <button
                      onClick={() => {
                        setFilterYear('All');
                        setFilterBranch('All');
                        setFilterSection('All');
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline pl-1 transition"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

              </div>

              {/* Filtering summary banner */}
              {(filterYear !== 'All' || filterBranch !== 'All' || filterSection !== 'All' || searchQuery !== '') && (
                <div className="text-xs text-slate-500 font-semibold border-t border-slate-100 pt-3.5 flex items-center justify-between">
                  <span>
                    Showing <strong className="text-emerald-800">{filteredStudents.length}</strong> of {students.length} students matched
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    Active filters: {[
                      filterYear !== 'All' && `${filterYear}`,
                      filterBranch !== 'All' && `Branch: ${filterBranch}`,
                      filterSection !== 'All' && `Section: ${filterSection}`,
                      searchQuery !== '' && `Search: "${searchQuery}"`
                    ].filter(Boolean).join(' | ')}
                  </span>
                </div>
              )}
            </div>

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
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-400 italic text-center" colSpan={6}>No students matched the selected filters.</td>
                    </tr>
                  ) : null}
                  {filteredStudents.map((student) => {
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
                          <div className="font-semibold uppercase">{profile.branch || '-'}</div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Sec: {profile.section || '-'} | <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{getStudentBTechYear(profile)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">Batch: {profile.academic_year || '-'}</div>
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
        </div>        {/* ==================== ACADEMIC MANAGER WORKSPACE (FULLSCREEN) ==================== */}
        {mounted && academicModalOpen && selectedStudentForAcademic && createPortal((
          <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen w-screen overflow-hidden animate-fadeIn">
            {/* Header section with fixed positioning */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-[#1c5644]/10 p-2">
                  <GraduationCap className="h-6 w-6 text-[#1c5644]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic Profile Workspace</h3>
                  <p className="text-xs text-slate-500">Student Name: <span className="font-bold text-slate-800">{selectedStudentForAcademic.name}</span> | Roll Number: <span className="font-bold text-slate-800">{selectedStudentForAcademic.student_profiles?.[0]?.roll_number || 'No Roll No.'}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setAcademicModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-55 px-3.5 py-2 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <X className="h-4 w-4" />
                <span>Close Workspace</span>
              </button>
            </div>

            {/* Scrollable body content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 w-full">
              
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* ==================== LEFT COLUMN: 1/3 width ==================== */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Cumulative stats section */}
                  <div className="p-5 rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-850 font-bold text-sm">
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
                        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3">
                          <div className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Latest SGPA</div>
                          <div className="text-lg font-black text-[#1c5644] mt-1">{academicSgpa > 0 ? academicSgpa.toFixed(2) : 'N/A'}</div>
                        </div>
                        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3">
                          <div className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Cumulative CGPA</div>
                          <div className="text-lg font-black text-slate-900 mt-1">{academicCgpa > 0 ? academicCgpa.toFixed(2) : 'N/A'}</div>
                        </div>
                        <div className={`border rounded-2xl p-3 bg-slate-50/50 ${academicBacklogs > 0 ? 'border-rose-250 text-rose-800' : 'border-slate-150 text-slate-700'}`}>
                          <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Backlogs</div>
                          <div className="text-lg font-black mt-1">{academicBacklogs}</div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleStatsSubmit} className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">SGPA</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={inputSgpa}
                              onChange={(e) => setInputSgpa(e.target.value)}
                              required
                              className="w-full rounded-xl border border-slate-205 px-3 py-1.5 text-xs bg-slate-50/50 focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">CGPA</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={inputCgpa}
                              onChange={(e) => setInputCgpa(e.target.value)}
                              required
                              className="w-full rounded-xl border border-slate-205 px-3 py-1.5 text-xs bg-slate-50/50 focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Backlogs</label>
                            <input
                              type="number"
                              min="0"
                              value={inputBacklogs}
                              onChange={(e) => setInputBacklogs(e.target.value)}
                              required
                              className="w-full rounded-xl border border-slate-205 px-3 py-1.5 text-xs bg-slate-50/50 focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setStatsEditMode(false)}
                            className="rounded-xl border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="rounded-xl bg-[#1c5644] hover:bg-[#154335] px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Student & Exam Details Card */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-805 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Student & Exam Info</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Father's Name</label>
                        <input
                          type="text"
                          value={fatherName}
                          onChange={(e) => {
                            setFatherName(e.target.value);
                            handleMetadataChange({ father_name: e.target.value });
                          }}
                          placeholder="e.g. MANSUR"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch</label>
                        <input
                          type="text"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="e.g. ELECTRONICS & COMMUNICATION ENGINEERING"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hall Ticket / Roll Number</label>
                        <input
                          type="text"
                          value={hallTicketNo}
                          onChange={(e) => setHallTicketNo(e.target.value)}
                          placeholder="e.g. 23311A04X2"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Semester Metadata Card */}
                  {academicSelectedSem !== 'All' && (
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm animate-fadeIn">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-[#1c5644]" />
                        <span>{semesterLabels[academicSelectedSem]?.short} Grade Sheet Info</span>
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Memo Number</label>
                            <input
                              type="text"
                              value={memoNo}
                              onChange={(e) => {
                                setMemoNo(e.target.value);
                                handleMetadataChange({ memo_no: e.target.value });
                              }}
                              placeholder="e.g. S375090"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serial Number</label>
                            <input
                              type="text"
                              value={serialNo}
                              onChange={(e) => {
                                setSerialNo(e.target.value);
                                handleMetadataChange({ serial_no: e.target.value });
                              }}
                              placeholder="e.g. 250109414"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exam Month/Year</label>
                            <input
                              type="text"
                              value={examDate}
                              onChange={(e) => {
                                setExamDate(e.target.value);
                                handleMetadataChange({ exam_date: e.target.value });
                              }}
                              placeholder="e.g. JANUARY 2024"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Issue</label>
                            <input
                              type="text"
                              value={issueDate}
                              onChange={(e) => {
                                setIssueDate(e.target.value);
                                handleMetadataChange({ issue_date: e.target.value });
                              }}
                              placeholder="e.g. 18.05.2024"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total Credits</label>
                            <input
                              type="text"
                              value={totalCredits}
                              onChange={(e) => {
                                setTotalCredits(e.target.value);
                                handleMetadataChange({ total_credits: e.target.value });
                              }}
                              placeholder="e.g. 18"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Result Status</label>
                            <select
                              value={passStatus}
                              onChange={(e) => {
                                setPassStatus(e.target.value);
                                handleMetadataChange({ pass_status: e.target.value });
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-700"
                            >
                              <option value="PASS">PASS</option>
                              <option value="FAIL">FAIL</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#1c5644] uppercase mb-1 font-bold">Semester SGPA</label>
                            <input
                              type="text"
                              value={semSgpa || (selectedSemesterSGPA !== null ? selectedSemesterSGPA.toString() : '')}
                              onChange={(e) => {
                                setSemSgpa(e.target.value);
                                handleMetadataChange({ sgpa: e.target.value });
                              }}
                              placeholder="e.g. 8.36"
                              className="w-full rounded-xl border border-emerald-250 bg-emerald-50/20 px-3 py-2 text-xs focus:border-[#1c5644] focus:bg-white focus:outline-none font-bold text-[#1c5644]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* ==================== RIGHT COLUMN: 2/3 width ==================== */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* AI Marksheet Scanner (OCR & Parsing) */}
                  <div className="p-5 rounded-[24px] border border-emerald-100 bg-emerald-50/20 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-105 pb-3 mb-4">
                      <div className="flex items-center gap-1.5 text-emerald-955 font-bold text-sm">
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
                          className="rounded-xl border border-slate-355 bg-white px-3 py-1.5 text-[10px] focus:outline-none w-[200px] focus:border-emerald-600 font-semibold"
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
                          onClick={() => setTargetUploadSemester(null)}
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

                    {/* Semester-Specific Upload Buttons */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                        Or Upload Ledger PDF/Image specifically for a Semester:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { value: '1', short: '1-1', label: 'I Year I Sem' },
                          { value: '2', short: '1-2', label: 'I Year II Sem' },
                          { value: '3', short: '2-1', label: 'II Year I Sem' },
                          { value: '4', short: '2-2', label: 'II Year II Sem' },
                          { value: '5', short: '3-1', label: 'III Year I Sem' },
                          { value: '6', short: '3-2', label: 'III Year II Sem' },
                          { value: '7', short: '4-1', label: 'IV Year I Sem' },
                          { value: '8', short: '4-2', label: 'IV Year II Sem' }
                        ].map((sem) => (
                          <button
                            key={sem.value}
                            type="button"
                            disabled={parsingMarksheet}
                            onClick={() => triggerSemesterUpload(sem.value)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition duration-150 text-left ${
                              parsingMarksheet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{sem.short}</span>
                              <span className="text-[9px] text-slate-500 font-semibold">{sem.label}</span>
                            </div>
                            <Upload className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                          </button>
                        ))}
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

                  {/* Subject overview list inside modal */}
                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-105 pb-3 mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="font-bold text-slate-805 text-base">Course Subjects & Marks</h4>
                        
                        <select
                          value={academicSelectedSem}
                          onChange={(e) => setAcademicSelectedSem(e.target.value)}
                          className="rounded-xl border border-slate-350 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
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

                        {academicSelectedSem !== 'All' && (
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-250 rounded-xl px-2.5 py-1 text-xs shadow-sm">
                            <span className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider">SGPA:</span>
                            <input
                              type="text"
                              value={semSgpa || (selectedSemesterSGPA !== null ? selectedSemesterSGPA.toString() : '')}
                              onChange={(e) => {
                                setSemSgpa(e.target.value);
                                handleMetadataChange({ sgpa: e.target.value });
                              }}
                              placeholder="e.g. 8.36"
                              className="w-14 bg-transparent text-emerald-900 font-bold border-none p-0 focus:outline-none focus:ring-0 text-xs font-mono text-center"
                            />
                          </div>
                        )}
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
                      <div className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-2 rounded-xl mb-3 flex items-center gap-1.5 border border-emerald-100 animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving changes to Supabase...</span>
                      </div>
                    )}

                    {filteredAcademicSubjects.length === 0 ? (
                      <p className="text-xs text-slate-405 italic text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-205">
                        No subjects registered for this student under the selected filter.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                              <th className="p-3">Subject Code</th>
                              <th className="p-3">Subject Name</th>
                              <th className="p-3 text-center">Semester</th>
                              <th className="p-3 text-center">Credits</th>
                              <th className="p-3 text-center">Mid-1</th>
                              <th className="p-3 text-center">Mid-2</th>
                              <th className="p-3 text-center">Mid Avg</th>
                              <th className="p-3 text-center font-bold text-slate-700">INT (40)</th>
                              <th className="p-3 text-center font-bold text-slate-700">EXT (60)</th>
                              <th className="p-3 text-center font-bold text-slate-800">TOTAL</th>
                              <th className="p-3 text-center">Grade</th>
                              <th className="p-3 text-center">Result</th>
                              <th className="p-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAcademicSubjects.map((sub, index) => {
                              const originalIndex = academicSubjects.findIndex(s => s === sub);
                              
                              const m1 = parseFloat(sub.mid1);
                              const m2 = parseFloat(sub.mid2);
                              const midAvg = (!isNaN(m1) && !isNaN(m2)) ? Math.round((m1 + m2) / 2) : '-';

                              const intMarks = sub.internal_marks ?? sub.mid1 ?? '-';
                              const extMarks = sub.semester_marks ?? '-';
                              
                              const iM = parseFloat(intMarks);
                              const eM = parseFloat(extMarks);
                              const totalMarks = (!isNaN(iM) && !isNaN(eM)) ? (iM + eM) : (sub.total_marks ?? '-');

                              return (
                                <tr key={index} className="hover:bg-slate-50/30">
                                  <td className="p-3 font-mono font-bold text-slate-600">{sub.code || '-'}</td>
                                  <td className="p-3 font-semibold text-slate-900">{sub.name}</td>
                                  <td className="p-3 text-center text-slate-700">{semesterLabels[sub.semester]?.short || `Sem ${sub.semester}`}</td>
                                  <td className="p-3 text-center font-semibold text-slate-650">{sub.credits ?? '-'}</td>
                                  <td className="p-3 text-center font-mono text-slate-500">{sub.mid1 || '-'}</td>
                                  <td className="p-3 text-center font-mono text-slate-500">{sub.mid2 || '-'}</td>
                                  <td className="p-3 text-center font-mono font-semibold text-slate-600">{midAvg}</td>
                                  <td className="p-3 text-center font-mono font-semibold text-slate-700">{intMarks}</td>
                                  <td className="p-3 text-center font-mono font-semibold text-slate-700">{extMarks}</td>
                                  <td className="p-3 text-center font-mono font-bold text-[#1c5644] bg-emerald-50/30">{totalMarks}</td>
                                  <td className="p-3 text-center font-bold text-slate-900">{sub.gpa}</td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
                                      sub.result === 'P' || sub.result === 'PASS'
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                        : 'bg-rose-50 border-rose-100 text-rose-800'
                                    }`}>
                                      {sub.result || 'P'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => openEditSubModal(originalIndex)}
                                        className="rounded-lg border border-slate-200 hover:bg-slate-55 p-1.5 text-slate-600 transition shadow-sm bg-white"
                                        title="Edit Subject Marks"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleSubDelete(originalIndex)}
                                        className="rounded-lg border border-slate-200 hover:bg-rose-55 p-1.5 text-rose-600 transition shadow-sm bg-white"
                                        title="Delete Subject"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Semester/Cumulative Summary Footer Row */}
                            {filteredAcademicSubjects.length > 0 && (
                              <tr className="bg-slate-50 font-bold text-slate-800 text-xs border-t border-slate-200">
                                <td colSpan={3} className="p-3 text-right font-bold text-slate-500 uppercase tracking-wider">
                                  {academicSelectedSem === 'All' ? 'Cumulative Summary' : 'Semester Summary'}
                                </td>
                                <td className="p-3 text-center text-sky-850 font-extrabold bg-sky-50/20">
                                  {filteredAcademicSubjects.reduce((acc, s) => {
                                    if (s.result === 'P' || s.result === 'PASS') {
                                      return acc + (parseFloat(s.credits) || 0);
                                    }
                                    return acc;
                                  }, 0)} Credits
                                </td>
                                <td colSpan={6} className="p-3 text-right text-rose-800 bg-rose-50/10 pr-6 font-extrabold">
                                  Backlogs: {filteredAcademicSubjects.filter(s => s.result === 'F' || s.result === 'FAIL').length}
                                </td>
                                <td colSpan={3} className="p-3 text-center text-emerald-805 bg-emerald-50/20 font-extrabold text-sm">
                                  {academicSelectedSem === 'All' ? (
                                    `CGPA: ${academicCgpa || (cumulativeCalculatedCGPA !== null ? cumulativeCalculatedCGPA.toFixed(2) : '-')}`
                                  ) : (
                                    `SGPA: ${semSgpa || (selectedSemesterSGPA !== null ? selectedSemesterSGPA.toFixed(2) : '-')}`
                                  )}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recharts Analytics Charts */}
                  {academicSubjects.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 mt-6">
                      {/* Trend line */}
                      {gpaChartData.length > 0 && (
                        <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-5 w-5 text-emerald-850" />
                            <h4 className="text-sm font-bold text-slate-805">Semester-wise GPA Track</h4>
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
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-605 mb-2">
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
                            Estimated placement readiness based on CGPA of {academicCgpa > 0 ? academicCgpa.toFixed(2) : 'N/A'} and {academicBacklogs} active backlogs.
                          </p>
                        </div>

                        {/* Middle: Key Strengths & Weaknesses */}
                        <div className="space-y-4">
                          {analysis.strengths.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-emerald-955 uppercase tracking-wide flex items-center gap-1 mb-2">
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
                                  <p className="text-[10px] text-slate-505 mt-1 font-semibold font-mono">+{analysis.momentumVal} GPA increase compared to the previous semester.</p>
                                </div>
                              </>
                            ) : analysis.momentum === 'down' ? (
                              <>
                                <div className="rounded-xl bg-rose-100 p-2 text-rose-850 shrink-0">
                                  <ArrowDownRight className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">Downward Trajectory</p>
                                  <p className="text-[10px] text-slate-505 mt-1 font-semibold font-mono">{analysis.momentumVal} GPA drop. Mentoring recommended.</p>
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
                  )}

                </div>

              </div>

            </div>
          </div>
        ), document.body)}

        {/* ==================== ADD/EDIT SUBJECT SUB-MODAL ==================== */}
        {mounted && subModalOpen && createPortal((
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Code</label>
                    <input
                      type="text"
                      value={subCode}
                      onChange={(e) => setSubCode(e.target.value)}
                      placeholder="e.g. 8BC01"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject Name</label>
                    <input
                      type="text"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder="e.g. Engineering Graphics"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
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
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credits</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={subCredits}
                      onChange={(e) => setSubCredits(e.target.value)}
                      placeholder="e.g. 3"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grade / GPA</label>
                    <input
                      type="text"
                      value={subGpa}
                      onChange={(e) => setSubGpa(e.target.value)}
                      placeholder="e.g. A, O, or 9.0"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Result Status</label>
                    <select
                      value={subResult}
                      onChange={(e) => setSubResult(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="P">PASS (P)</option>
                      <option value="F">FAIL (F)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Subject Marks Detail</span>
                  
                  {/* Row 1: Mid 1, Mid 2 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mid-1 (Internal Test)</label>
                      <input
                        type="text"
                        value={subMid1}
                        onChange={(e) => setSubMid1(e.target.value)}
                        placeholder="e.g. 18"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mid-2 (Internal Test)</label>
                      <input
                        type="text"
                        value={subMid2}
                        onChange={(e) => setSubMid2(e.target.value)}
                        placeholder="e.g. 19"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 2: JNTUH Final Marks */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Internal (INT 40)</label>
                      <input
                        type="text"
                        value={subInternalMarks}
                        onChange={(e) => setSubInternalMarks(e.target.value)}
                        placeholder="e.g. 27"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-[#1c5644] focus:bg-white focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">External (EXT 60)</label>
                      <input
                        type="text"
                        value={subSemesterMarks}
                        onChange={(e) => setSubSemesterMarks(e.target.value)}
                        placeholder="e.g. 33"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-[#1c5644] focus:bg-white focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total (INT+EXT)</label>
                      <input
                        type="text"
                        value={subTotalMarks}
                        onChange={(e) => setSubTotalMarks(e.target.value)}
                        placeholder="e.g. 60"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs focus:border-[#1c5644] focus:bg-white focus:outline-none font-bold text-[#1c5644]"
                      />
                    </div>
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
        ), document.body)}
      </PageShell>
    </ProtectedRoute>
  );
}
