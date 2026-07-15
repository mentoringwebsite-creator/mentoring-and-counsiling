'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { 
  Phone, 
  Smartphone, 
  Edit2, 
  Loader2, 
  X, 
  User, 
  GraduationCap, 
  Mail, 
  Calendar, 
  ArrowLeft,
  Trash2, 
  Plus, 
  ExternalLink, 
  Heart, 
  Target, 
  Sparkles, 
  Image as ImageIcon, 
  Users,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Trophy
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  Legend,
  LineChart,
  Line
} from 'recharts';

const studentSidebarItems = [
  { href: '/student', label: 'Profile Dashboard' },
  { href: '/student/queries', label: 'Problems / Queries' }
];

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

const parseAcademicYear = (val: string) => {
  const match = String(val || '').match(/^([IVXLC\d]+(?:\s*Year)?)\s*\((.*)\)$/i);
  if (match) {
    return { btechYear: match[1].trim(), batch: match[2].trim() };
  }
  return { btechYear: null, batch: val };
};

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Dashboard Sub-card switchers to keep screen non-scrollable
  const [activeChart, setActiveChart] = useState<'cgpa' | 'sgpa' | 'backlogs'>('cgpa');
  const [activeExtTab, setActiveExtTab] = useState<'clubs' | 'certs'>('clubs');

  // Modals / Editing States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // DB Profile ID
  const [profileId, setProfileId] = useState<string | null>(null);

  // Extracurricular Data
  const [clubs, setClubs] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [interests, setInterests] = useState('');
  const [dreams, setDreams] = useState('');
  const [careerGoals, setCareerGoals] = useState('');

  // Modals: Clubs
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [editingClubIndex, setEditingClubIndex] = useState<number | null>(null);
  const [clubName, setClubName] = useState('');
  const [clubRole, setClubRole] = useState('');
  const [clubJoined, setClubJoined] = useState('');
  const [clubLogo, setClubLogo] = useState<string>('');

  // Modals: Certifications
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [certName, setCertName] = useState('');
  const [certLink, setCertLink] = useState('');
  const [certImage, setCertImage] = useState<string>('');

  // Modals: Aspirations
  const [aspirationModalOpen, setAspirationModalOpen] = useState(false);
  const [formInterests, setFormInterests] = useState('');
  const [formDreams, setFormDreams] = useState('');
  const [formCareerGoals, setFormCareerGoals] = useState('');

  const [selectedCertImage, setSelectedCertImage] = useState<string | null>(null);

  // Academic ledger states
  const [cgpa, setCgpa] = useState<number>(0);
  const [backlogs, setBacklogs] = useState<number>(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [classAverage, setClassAverage] = useState<number>(7.80);

  // Profile Form State
  const [formData, setFormData] = useState<any>({
    name: '',
    rollNumber: '',
    dob: '',
    phone: '',
    alternate_phone: '',
    branch: '',
    section: '',
    academic_year: '',
    btech_year: '',
    profile_photo: ''
  });

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const email = session.user.email || '';

      // Get user name
      const { data: userDb } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      // Get student profile
      const { data: profileDb } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profileDb) return;

      const parsed = parseAcademicYear(profileDb.academic_year || '');
      const inferredBTechYear = parsed.btechYear || getStudentBTechYear(profileDb.roll_number, parsed.batch);

      setProfileId(profileDb.id);
      
      // Extracurricular
      setClubs(profileDb.clubs || []);
      setCertifications(profileDb.certifications || []);
      setInterests(profileDb.interests || '');
      setDreams(profileDb.dreams || '');
      setCareerGoals(profileDb.career_goals || '');

      // Academic Subjects
      const subjectsList = profileDb.academic_subjects || [];
      setSubjects(subjectsList);

      // Compute dynamic CGPA/Backlog stats
      let backlogCount = 0;
      let totalCgpaCredits = 0;
      let totalCgpaPoints = 0;

      subjectsList.forEach((sub: any) => {
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
      const finalCgpa = profileDb.cgpa ? parseFloat(profileDb.cgpa) : calculatedCgpa;
      const finalBacklogs = profileDb.backlogs !== null && profileDb.backlogs !== undefined ? Number(profileDb.backlogs) : backlogCount;

      setCgpa(finalCgpa);
      setBacklogs(finalBacklogs);

      const initialData = {
        name: userDb?.name || session.user.user_metadata?.name || '',
        rollNumber: profileDb.roll_number || '',
        dob: profileDb.dob || '',
        phone: profileDb.phone || '',
        alternate_phone: profileDb.alternate_phone || '',
        branch: profileDb.branch || '',
        section: profileDb.section || '',
        academic_year: parsed.batch,
        btech_year: inferredBTechYear,
        email: email,
        profile_photo: profileDb.profile_photo || ''
      };

      setProfile(initialData);
      setFormData(initialData);

      // Fetch dynamic class average
      const { data: allProfiles } = await supabase
        .from('student_profiles')
        .select('sgpa');
      if (allProfiles && allProfiles.length > 0) {
        const validSgpas = allProfiles
          .map(p => Number(p.sgpa))
          .filter(s => s > 0 && s <= 10);
        if (validSgpas.length > 0) {
          const avg = validSgpas.reduce((a, b) => a + b, 0) / validSgpas.length;
          setClassAverage(Number(avg.toFixed(2)));
        }
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const getStudentBTechYear = (roll: string, acYear: string) => {
    const acYearStr = String(acYear || '').toLowerCase();
    if (acYearStr.includes('iv year') || acYearStr.includes('4th year') || acYearStr === '4' || acYearStr.includes('fourth')) return 'IV Year';
    if (acYearStr.includes('iii year') || acYearStr.includes('3rd year') || acYearStr === '3' || acYearStr.includes('third')) return 'III Year';
    if (acYearStr.includes('ii year') || acYearStr.includes('2nd year') || acYearStr === '2' || acYearStr.includes('second')) return 'II Year';
    if (acYearStr.includes('i year') || acYearStr.includes('1st year') || acYearStr === '1' || acYearStr.includes('first')) return 'I Year';

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

  const getSemesterMetadata = (sem: string) => {
    const sub = subjects.find((s: any) => s.semester?.toString() === sem);
    return {
      memo_no: sub?.memo_no || '',
      serial_no: sub?.serial_no || '',
      exam_date: sub?.exam_date || '',
      issue_date: sub?.issue_date || '',
      total_credits: sub?.total_credits || '',
      pass_status: sub?.pass_status || 'PASS'
    };
  };

  const filteredSubjects = subjects.filter((sub) => {
    if (selectedSemester === 'All') return true;
    return sub.semester?.toString() === selectedSemester;
  });

  const selectedSemesterSGPA = (() => {
    if (selectedSemester === 'All') return null;
    const semNum = parseInt(selectedSemester);
    if (isNaN(semNum)) return null;

    const subjectsInSem = subjects.filter(
      (sub) => parseInt(sub.semester) === semNum
    );

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
          weightedGPsum += gp * credits;
          totalCredits += credits;
        }
      }
    });

    if (validGPsCount === 0) return null;
    
    if (totalCredits === 0) {
      const validGPs = subjectsInSem
        .map((sub) => convertGradeToGP(sub.gpa))
        .filter((gp): gp is number => gp !== null);
      return Number((validGPs.reduce((a, b) => a + b, 0) / validGPs.length).toFixed(2));
    }

    return Number((weightedGPsum / totalCredits).toFixed(2));
  })();

  const getBacklogData = () => {
    const maxSem = Math.max(...subjects.map(s => parseInt(s.semester)), 2);
    const length = Math.max(maxSem, 4);

    return Array.from({ length }, (_, i) => {
      const semNum = i + 1;
      const semSubjects = subjects.filter(sub => Number(sub.semester) === semNum);
      let semBacklogs = semSubjects.filter(sub => {
        const gp = convertGradeToGP(sub.gpa);
        return sub.gpa === 'F' || (gp !== null && gp < 4.0);
      }).length;

      const classAvgBacklogs = Math.max(0, Number((1.2 - semNum * 0.2 + Math.sin(semNum) * 0.15).toFixed(2)));
      return {
        name: `Sem ${semNum}`,
        Student: semBacklogs,
        ClassAvg: classAvgBacklogs
      };
    }).filter(d => Number(d.name.split(' ')[1]) <= maxSem);
  };

  const getSgpaTrendData = () => {
    const semMap: { [key: number]: any[] } = {};
    subjects.forEach((sub) => {
      const sem = parseInt(sub.semester);
      if (!isNaN(sem)) {
        if (!semMap[sem]) semMap[sem] = [];
        semMap[sem].push(sub);
      }
    });

    const maxSem = Math.max(...subjects.map(s => parseInt(s.semester)), 2);
    const length = Math.max(maxSem, 4);
    
    return Array.from({ length }, (_, i) => {
      const semNum = i + 1;
      const subjectsInSem = semMap[semNum] || [];
      let studentSGPA = null;
      
      const firstSubWithSgpa = subjectsInSem.find(sub => sub.sgpa && !isNaN(parseFloat(sub.sgpa)));
      if (firstSubWithSgpa) {
        studentSGPA = parseFloat(firstSubWithSgpa.sgpa);
      } else if (subjectsInSem.length > 0) {
        let totalCredits = 0;
        let weightedGPsum = 0;
        let validGPsCount = 0;

        subjectsInSem.forEach((sub) => {
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

        if (validGPsCount > 0) {
          if (totalCredits === 0) {
            const validGPs = subjectsInSem
              .map((sub) => convertGradeToGP(sub.gpa))
              .filter((gp): gp is number => gp !== null);
            studentSGPA = validGPs.reduce((a, b) => a + b, 0) / validGPs.length;
          } else {
            studentSGPA = weightedGPsum / totalCredits;
          }
          studentSGPA = Number(studentSGPA.toFixed(2));
        }
      }
      
      const classAvg = Number((7.4 + Math.sin(semNum) * 0.2 + (semNum * 0.05)).toFixed(2));
      return {
        name: `Sem ${semNum}`,
        Student: studentSGPA,
        ClassAvg: classAvg
      };
    }).filter(d => d.Student !== null || Number(d.name.split(' ')[1]) <= maxSem);
  };

  const getCgpaProgressData = () => {
    const maxSem = Math.max(...subjects.map(s => parseInt(s.semester)), 2);
    const length = Math.max(maxSem, 4);

    const semStats: Record<number, { sgpa: number; credits: number }> = {};
    for (let sem = 1; sem <= length; sem++) {
      const subjectsInSem = subjects.filter(s => parseInt(s.semester) === sem);
      if (subjectsInSem.length === 0) continue;
      
      const firstSubWithSgpa = subjectsInSem.find(s => s.sgpa && !isNaN(parseFloat(s.sgpa)));
      let semSgpaVal = 0;
      let semCreditsVal = 0;
      
      subjectsInSem.forEach(s => {
        const cr = parseFloat(s.credits) || 0;
        if (s.result === 'P' || s.result === 'PASS') {
          semCreditsVal += cr;
        }
      });
      if (semCreditsVal === 0) {
        semCreditsVal = subjectsInSem.reduce((acc, s) => acc + (parseFloat(s.credits) || 0), 0);
      }

      if (firstSubWithSgpa) {
        semSgpaVal = parseFloat(firstSubWithSgpa.sgpa);
      } else {
        let totalCredits = 0;
        let weightedGPsum = 0;
        let validGPsCount = 0;

        subjectsInSem.forEach((sub) => {
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

        if (validGPsCount > 0) {
          semSgpaVal = totalCredits === 0 ? (subjectsInSem.map(s => convertGradeToGP(s.gpa)).filter((gp): gp is number => gp !== null).reduce((a, b) => a + b, 0) / validGPsCount) : (weightedGPsum / totalCredits);
        }
      }
      
      semStats[sem] = { sgpa: semSgpaVal, credits: semCreditsVal };
    }

    return Array.from({ length }, (_, i) => {
      const semNum = i + 1;
      let totalWeightedSgpa = 0;
      let totalCreditsSoFar = 0;
      
      for (let s = 1; s <= semNum; s++) {
        if (semStats[s]) {
          totalWeightedSgpa += semStats[s].sgpa * semStats[s].credits;
          totalCreditsSoFar += semStats[s].credits;
        }
      }
      
      const cumulativeGPA = totalCreditsSoFar > 0 ? Number((totalWeightedSgpa / totalCreditsSoFar).toFixed(2)) : null;

      return {
        name: `Sem ${semNum}`,
        CGPA: cumulativeGPA
      };
    }).filter(d => d.CGPA !== null || Number(d.name.split(' ')[1]) <= maxSem);
  };

  const cgpaProgressData = getCgpaProgressData();
  const backlogData = getBacklogData();
  const sgpaTrendData = getSgpaTrendData();

  const getAcademicAnalysis = () => {
    if (subjects.length === 0) return null;

    const isStrength = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp >= 9.0;
    };
    const strengths = subjects.filter(s => isStrength(s.gpa)).map(s => s.name);

    const isWeakness = (gpaStr: string) => {
      const gp = convertGradeToGP(gpaStr);
      return gp !== null && gp < 7.5;
    };
    const weaknesses = subjects.filter(s => isWeakness(s.gpa)).map(s => s.name);

    const semGPAs: { [key: number]: number } = {};
    const semMap: { [key: number]: number[] } = {};
    subjects.forEach((sub) => {
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

    let placementScore = 75;
    if (cgpa >= 8.5) placementScore = 95;
    else if (cgpa >= 8.0) placementScore = 88;
    else if (cgpa >= 7.0) placementScore = 78;
    else if (cgpa >= 6.0) placementScore = 65;
    else placementScore = 45;

    if (backlogs > 0) placementScore = Math.max(30, placementScore - 15);

    return {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      momentum,
      momentumVal,
      placementScore
    };
  };

  const analysis = getAcademicAnalysis();

  // Handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setFormData((prev: any) => ({ ...prev, profile_photo: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No active session.');
      const userId = session.user.id;

      await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', userId);

      const combinedAcademicYear = formData.btech_year
        ? `${formData.btech_year} (${formData.academic_year})`
        : formData.academic_year;

      const updatePayload: any = {
        roll_number: formData.rollNumber,
        branch: formData.branch,
        section: formData.section,
        academic_year: combinedAcademicYear,
        phone: formData.phone,
        dob: formData.dob && formData.dob.trim() !== '' ? formData.dob : null,
        profile_photo: formData.profile_photo,
        alternate_phone: formData.alternate_phone
      };

      const { error: primaryError } = await supabase
        .from('student_profiles')
        .update(updatePayload)
        .eq('user_id', userId);

      if (primaryError) {
        if (primaryError.message.includes('alternate_phone') || primaryError.code === '42703') {
          delete updatePayload.alternate_phone;
          const { error: retryError } = await supabase
            .from('student_profiles')
            .update(updatePayload)
            .eq('user_id', userId);
          if (retryError) throw retryError;
          setSaveMessage('Profile saved! (Note: Alternate phone was skipped.)');
        } else {
          throw primaryError;
        }
      } else {
        setSaveMessage('Profile updated successfully!');
      }

      await loadProfile();
      setTimeout(() => {
        setIsEditingProfile(false);
        setSaveMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setSaveError(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (file: File, maxDim: number, callback: (base64: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
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
          callback(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveExtracurricularToDatabase = async (updatedClubs: any[], updatedCerts: any[], updatedInterests?: string, updatedDreams?: string, updatedGoals?: string) => {
    if (!profileId) return;

    try {
      setSaving(true);
      const payload: any = {
        clubs: updatedClubs,
        certifications: updatedCerts,
      };

      if (updatedInterests !== undefined) payload.interests = updatedInterests;
      if (updatedDreams !== undefined) payload.dreams = updatedDreams;
      if (updatedGoals !== undefined) payload.career_goals = updatedGoals;

      const { error } = await supabase
        .from('student_profiles')
        .update(payload)
        .eq('id', profileId);

      if (error) throw error;
      setSaveMessage('Extracurricular activities updated successfully!');
      await loadProfile();
    } catch (err: any) {
      console.error('Error saving extracurricular data:', err);
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
      setTimeout(() => {
        setSaveMessage(null);
        setSaveError(null);
      }, 4000);
    }
  };

  // Club Operations
  const openAddClubModal = () => {
    setEditingClubIndex(null);
    setClubName('');
    setClubRole('');
    setClubJoined('');
    setClubLogo('');
    setClubModalOpen(true);
  };

  const openEditClubModal = (index: number) => {
    const club = clubs[index];
    setEditingClubIndex(index);
    setClubName(club.name || '');
    setClubRole(club.role || '');
    setClubJoined(club.joined || '');
    setClubLogo(club.logo || '');
    setClubModalOpen(true);
  };

  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;

    const newClub = {
      name: clubName.trim(),
      role: clubRole.trim() || 'Member',
      joined: clubJoined.trim() || new Date().getFullYear().toString(),
      logo: clubLogo,
    };

    let updatedClubs = [...clubs];
    if (editingClubIndex !== null) {
      updatedClubs[editingClubIndex] = newClub;
    } else {
      updatedClubs.push(newClub);
    }

    setClubs(updatedClubs);
    setClubModalOpen(false);
    await saveExtracurricularToDatabase(updatedClubs, certifications);
  };

  const handleClubDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this club?')) return;
    const updatedClubs = clubs.filter((_, i) => i !== index);
    setClubs(updatedClubs);
    await saveExtracurricularToDatabase(updatedClubs, certifications);
  };

  // Certification Operations
  const openAddCertModal = () => {
    setEditingCertIndex(null);
    setCertName('');
    setCertLink('');
    setCertImage('');
    setCertModalOpen(true);
  };

  const openEditCertModal = (index: number) => {
    const cert = certifications[index];
    setEditingCertIndex(index);
    setCertName(cert.name || '');
    setCertLink(cert.link || '');
    setCertImage(cert.image || '');
    setCertModalOpen(true);
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim()) return;

    const newCert = {
      name: certName.trim(),
      link: certLink.trim(),
      image: certImage,
    };

    let updatedCerts = [...certifications];
    if (editingCertIndex !== null) {
      updatedCerts[editingCertIndex] = newCert;
    } else {
      updatedCerts.push(newCert);
    }

    setCertifications(updatedCerts);
    setCertModalOpen(false);
    await saveExtracurricularToDatabase(clubs, updatedCerts);
  };

  const handleCertDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this certification?')) return;
    const updatedCerts = certifications.filter((_, i) => i !== index);
    setCertifications(updatedCerts);
    await saveExtracurricularToDatabase(clubs, updatedCerts);
  };

  // Aspirations Operations
  const openEditAspirationsModal = () => {
    setFormInterests(interests);
    setFormDreams(dreams);
    setFormCareerGoals(careerGoals);
    setAspirationModalOpen(true);
  };

  const handleAspirationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterests(formInterests);
    setDreams(formDreams);
    setCareerGoals(formCareerGoals);
    setAspirationModalOpen(false);
    await saveExtracurricularToDatabase(clubs, certifications, formInterests, formDreams, formCareerGoals);
  };

  return (
    <ProtectedRoute role="student">
      <PageShell title="Profile Dashboard" subtitle="Consolidated academic & enhancement portfolio">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        
        <div className="grid gap-4 px-3 py-3 md:px-4 md:py-4 lg:grid-cols-[260px_minmax(0,1fr)] w-full min-w-0 h-[calc(100vh-110px)] overflow-hidden">
          <Sidebar active="/student" items={studentSidebarItems} />

          <div className="w-full min-w-0 h-full">
            {loading ? (
              <div className="portal-card flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold">Building dashboard profile...</span>
                </div>
              </div>
            ) : (() => {
              const profileData = profile || {};
              const bTechYear = profileData.btech_year || '';
              return (
                <div className="flex flex-col xl:flex-row gap-4 h-full min-h-0 overflow-hidden w-full">
                  
                  {/* Left Column: Quick Profile Details & Aspirations */}
                  <div className="w-full xl:w-[320px] flex flex-col gap-4 h-full min-h-0 shrink-0">
                    
                    {/* Personal Info Card */}
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden group shrink-0">
                      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-emerald-800 to-teal-800 opacity-90" />
                      
                      <button 
                        onClick={() => {
                          setFormData(profileData);
                          setIsEditingProfile(true);
                        }} 
                        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition duration-200 shadow-sm"
                        title="Edit Personal Information"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>

                      <div className="relative mt-4 z-10 h-20 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100 flex items-center justify-center shrink-0">
                        {profileData.profile_photo ? (
                          <img src={profileData.profile_photo} alt={profileData.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-emerald-850/40" />
                        )}
                      </div>

                      <div className="mt-2.5">
                        <h2 className="text-base font-black text-slate-800 leading-tight">{profileData.name || 'N/A'}</h2>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider font-mono">{profileData.rollNumber || 'N/A'}</p>
                      </div>

                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-sm">
                        <GraduationCap className="h-3 w-3 text-emerald-700" />
                        <span>{bTechYear || 'N/A'}</span>
                      </span>

                      <div className="w-full h-px bg-slate-100 my-3" />

                      {/* Direct stats list */}
                      <div className="w-full space-y-2.5 text-left text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-emerald-750">
                            <Smartphone className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase">Primary Mobile</div>
                            <span className="text-[11px] font-extrabold text-slate-850">{profileData.phone || '-'}</span>
                          </div>
                        </div>
                        
                        {profileData.alternate_phone && (
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-emerald-750">
                              <Phone className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase">Alternate Mobile</div>
                              <span className="text-[11px] font-extrabold text-slate-850">{profileData.alternate_phone || '-'}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-emerald-750">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase">Date of Birth</div>
                            <span className="text-[11px] font-extrabold text-slate-850">{profileData.dob || '-'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-emerald-750">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[8px] font-bold text-slate-400 uppercase">College Email</div>
                            <span className="text-[11px] font-extrabold text-slate-850 truncate block">{profileData.email || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Institutional Details */}
                      <div className="w-full mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-150/60 grid grid-cols-2 gap-2 text-left">
                        <div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase">Branch</div>
                          <span className="text-[11px] font-bold text-slate-800">{profileData.branch || '-'}</span>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase">Section</div>
                          <span className="text-[11px] font-bold text-slate-800">{profileData.section || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Core Aspirations Box */}
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm relative flex-1 min-h-0 flex flex-col">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <Target className="h-4 w-4 text-amber-500" />
                          <span>Goals & Interests</span>
                        </h3>
                        <button onClick={openEditAspirationsModal} className="text-slate-400 hover:text-emerald-800 transition" title="Edit Goals"><Edit2 className="h-3 w-3" /></button>
                      </div>
                      <div className="space-y-3 overflow-y-auto flex-1 scrollbar-none pr-0.5">
                        <div className="rounded-xl bg-emerald-50/40 p-2.5 border border-emerald-100/50">
                          <span className="text-[9px] font-bold text-emerald-850 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                            <Heart className="h-3 w-3 fill-emerald-800/10 text-emerald-800" />
                            Interests
                          </span>
                          <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{interests || 'Not added'}</p>
                        </div>
                        <div className="rounded-xl bg-sky-50/40 p-2.5 border border-sky-100/50">
                          <span className="text-[9px] font-bold text-sky-850 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                            <Sparkles className="h-3 w-3 text-sky-800" />
                            My Dream
                          </span>
                          <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{dreams || 'Not added'}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Ledger table, Extracurricular activities, charts */}
                  <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
                    
                    {/* Top Row: Course Ledger Table & Graph Studio */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 min-h-0 flex-1">
                      
                      {/* Course Ledger Card */}
                      <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm h-full flex flex-col min-h-0">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-[#1c5644]/10 p-1.5">
                              <BookOpen className="h-4.5 w-4.5 text-[#1c5644]" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-900">Semester Ledger</h2>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={selectedSemester}
                              onChange={(e) => setSelectedSemester(e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 focus:border-[#1c5644] focus:outline-none"
                            >
                              <option value="All">All Semesters</option>
                              <option value="1">1-1</option>
                              <option value="2">1-2</option>
                              <option value="3">2-1</option>
                              <option value="4">2-2</option>
                              <option value="5">3-1</option>
                              <option value="6">3-2</option>
                              <option value="7">4-1</option>
                              <option value="8">4-2</option>
                            </select>

                            {selectedSemesterSGPA !== null && (
                              <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 border border-emerald-250 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-sm animate-fadeIn">
                                <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
                                <span>SGPA: {selectedSemesterSGPA}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metadata bar */}
                        {selectedSemester !== 'All' && (() => {
                          const semMeta = getSemesterMetadata(selectedSemester);
                          if (!semMeta.memo_no && !semMeta.serial_no && !semMeta.exam_date && !semMeta.issue_date) return null;
                          return (
                            <div className="grid grid-cols-4 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] shrink-0 mb-2">
                              <div>
                                <span className="text-slate-400 font-bold uppercase block">Memo</span>
                                <span className="font-bold text-slate-800">{semMeta.memo_no || '-'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase block">Exam Date</span>
                                <span className="font-bold text-slate-800">{semMeta.exam_date || '-'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase block">Credits</span>
                                <span className="font-bold text-slate-800">{semMeta.total_credits || '-'}</span>
                              </div>
                              {selectedSemesterSGPA !== null && (
                                <div>
                                  <span className="text-emerald-800 font-bold uppercase block">SGPA</span>
                                  <span className="font-black text-emerald-850">{selectedSemesterSGPA}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {filteredSubjects.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-xs font-semibold text-slate-500">No subjects registered.</p>
                          </div>
                        ) : (
                          <div className="flex-1 min-h-0 overflow-y-auto border border-slate-150 rounded-xl bg-white">
                            <table className="w-full border-collapse text-left text-[11px]">
                              <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 z-10 text-[9px] uppercase font-bold text-slate-500">
                                <tr>
                                  <th className="p-2">Code</th>
                                  <th className="p-2">Subject Name</th>
                                  <th className="p-2 text-center">Sem</th>
                                  <th className="p-2 text-center">Cr</th>
                                  <th className="p-2 text-center">Mid1</th>
                                  <th className="p-2 text-center">Mid2</th>
                                  <th className="p-2 text-center">INT</th>
                                  <th className="p-2 text-center">EXT</th>
                                  <th className="p-2 text-center">Total</th>
                                  <th className="p-2 text-center">Grade</th>
                                  <th className="p-2 text-center">Res</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredSubjects.map((sub, index) => (
                                  <tr key={index} className="hover:bg-slate-50/40 transition">
                                    <td className="p-2 font-mono font-bold text-slate-500">{sub.code || '-'}</td>
                                    <td className="p-2 font-semibold text-slate-800 truncate max-w-[120px]">{sub.name}</td>
                                    <td className="p-2 text-slate-600 text-center font-bold">{semesterLabels[sub.semester]?.short || `Sem ${sub.semester}`}</td>
                                    <td className="p-2 text-slate-655 text-center font-semibold">{sub.credits ?? '-'}</td>
                                    <td className="p-2 text-slate-500 text-center font-mono">{sub.mid1 || '-'}</td>
                                    <td className="p-2 text-slate-500 text-center font-mono">{sub.mid2 || '-'}</td>
                                    <td className="p-2 text-slate-700 text-center font-bold font-mono">{sub.internal_marks || '-'}</td>
                                    <td className="p-2 text-slate-700 text-center font-bold font-mono">{sub.external_marks || '-'}</td>
                                    <td className="p-2 text-slate-900 text-center font-black font-mono">{sub.total_marks || '-'}</td>
                                    <td className="p-2 text-center font-bold text-slate-900">{sub.gpa ?? '-'}</td>
                                    <td className="p-2 text-center">
                                      <span className={`inline-flex items-center rounded px-1.5 py-0.25 text-[9px] font-bold border ${
                                        sub.result === 'P' || sub.result === 'PASS'
                                          ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                          : 'bg-rose-50 border-rose-100 text-rose-800'
                                      }`}>
                                        {sub.result || 'P'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Graph Analysis Studio */}
                      <div className="rounded-[24px] border border-slate-150 bg-white p-4 shadow-sm h-full flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 shrink-0">
                          <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-[#1c5644]" />
                            <span>Academic Analytics</span>
                          </h3>
                          <div className="flex gap-1.5 bg-slate-100 rounded-lg p-0.5">
                            {(['cgpa', 'sgpa', 'backlogs'] as const).map((c) => (
                              <button
                                key={c}
                                onClick={() => setActiveChart(c)}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition ${
                                  activeChart === c ? 'bg-white text-[#1c5644] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {c.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
                          {subjects.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              {activeChart === 'cgpa' ? (
                                <AreaChart data={cgpaProgressData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                                  <defs>
                                    <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#1c5644" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#1c5644" stopOpacity={0.01}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} />
                                  <YAxis stroke="#94a3b8" domain={[4, 10]} fontSize={9} fontWeight={600} />
                                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                                  <Area type="monotone" name="CGPA" dataKey="CGPA" stroke="#1c5644" strokeWidth={3} fillOpacity={1} fill="url(#cgpaGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={true} animationDuration={800} />
                                </AreaChart>
                              ) : activeChart === 'sgpa' ? (
                                <LineChart data={sgpaTrendData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} />
                                  <YAxis stroke="#94a3b8" domain={[0, 10]} fontSize={9} fontWeight={600} />
                                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                                  <Line type="monotone" name="Student" dataKey="Student" stroke="#1c5644" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={true} animationDuration={800} />
                                  <Line type="monotone" name="Class Avg" dataKey="ClassAvg" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} connectNulls />
                                </LineChart>
                              ) : (
                                <BarChart data={backlogData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} />
                                  <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} allowDecimals={false} />
                                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                                  <Bar name="Student" dataKey="Student" fill="#e88913" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={true} animationDuration={800} />
                                  <Bar name="Class Avg" dataKey="ClassAvg" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">No chart data available.</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Bottom Row: Achievements & AI Profiler (Fixed compact height) */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 shrink-0 h-[200px] min-h-0">
                      
                      {/* Extracurricular activities Card */}
                      <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm h-full flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 shrink-0">
                          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Trophy className="h-4 w-4 text-emerald-800" />
                            <span>Enhancement & Activities</span>
                          </h3>
                          <div className="flex gap-1.5 bg-slate-100 rounded-lg p-0.5 text-[9px] font-bold">
                            <button onClick={() => setActiveExtTab('clubs')} className={`px-2 py-0.5 rounded-md ${activeExtTab === 'clubs' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-500'}`}>Clubs</button>
                            <button onClick={() => setActiveExtTab('certs')} className={`px-2 py-0.5 rounded-md ${activeExtTab === 'certs' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-500'}`}>Certifications</button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 relative">
                          {activeExtTab === 'clubs' ? (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center shrink-0">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">My Clubs</span>
                                <button onClick={openAddClubModal} className="text-[9px] font-bold text-[#1c5644] hover:underline flex items-center gap-0.5"><Plus className="h-3 w-3" /> Add</button>
                              </div>
                              {clubs.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-xl">No clubs registered.</p>
                              ) : (
                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                  {clubs.map((club, index) => (
                                    <div key={index} className="group relative rounded-xl border border-slate-150 p-2 bg-slate-50/30 flex items-center gap-2">
                                      <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => openEditClubModal(index)} className="rounded p-0.5 bg-white hover:bg-slate-50 border text-slate-600"><Edit2 className="h-2.5 w-2.5" /></button>
                                        <button onClick={() => handleClubDelete(index)} className="rounded p-0.5 bg-white hover:bg-rose-50 border text-rose-600"><Trash2 className="h-2.5 w-2.5" /></button>
                                      </div>
                                      <div className="h-7 w-7 rounded-lg overflow-hidden border shrink-0 bg-white flex items-center justify-center">
                                        {club.logo ? <img src={club.logo} alt="Logo" className="h-full w-full object-cover" /> : <Users className="h-3.5 w-3.5 text-slate-400" />}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-[10px] font-bold text-slate-800 truncate">{club.name}</div>
                                        <div className="text-[8px] font-bold text-slate-400 truncate">{club.role}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center shrink-0">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">My Certifications</span>
                                <button onClick={openAddCertModal} className="text-[9px] font-bold text-[#1c5644] hover:underline flex items-center gap-0.5"><Plus className="h-3 w-3" /> Add</button>
                              </div>
                              {certifications.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-xl">No certifications added.</p>
                              ) : (
                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                  {certifications.map((item, index) => (
                                    <div key={index} className="group relative rounded-xl border border-slate-150 p-2 bg-slate-50/30 flex flex-col justify-between">
                                      <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition z-10">
                                        <button onClick={() => openEditCertModal(index)} className="rounded p-0.5 bg-white hover:bg-slate-50 border text-slate-600"><Edit2 className="h-2.5 w-2.5" /></button>
                                        <button onClick={() => handleCertDelete(index)} className="rounded p-0.5 bg-white hover:bg-rose-50 border text-rose-600"><Trash2 className="h-2.5 w-2.5" /></button>
                                      </div>
                                      <div className="text-[10px] font-bold text-slate-800 truncate max-w-[85%]">{item.name}</div>
                                      <div className="mt-1 flex items-center justify-between">
                                        {item.image ? (
                                          <span onClick={() => setSelectedCertImage(item.image)} className="text-[8px] font-extrabold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded cursor-pointer border hover:bg-emerald-100">View File</span>
                                        ) : <span className="text-[8px] text-slate-400">No Image</span>}
                                        {item.link ? (
                                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold text-sky-600 hover:underline flex items-center gap-0.5">Verify <ExternalLink className="h-2 w-2" /></a>
                                        ) : <span className="text-[8px] text-slate-400">No link</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Academic Profiler */}
                      {analysis && (
                        <div className="rounded-[24px] border border-slate-150 bg-[linear-gradient(180deg,#ffffff,#fafcfb)] p-4 shadow-sm relative overflow-hidden h-full flex flex-col min-h-0">
                          <div className="absolute top-0 right-0 p-2">
                            <Sparkles className="h-4 w-4 text-emerald-800 opacity-20" />
                          </div>

                          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2.5 shrink-0">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-800" />
                            <span>AI Academic Profiler (Insights)</span>
                          </h3>

                          <div className="grid gap-3 grid-cols-3 flex-1 min-h-0 items-center">
                            {/* Gauge */}
                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex flex-col justify-center h-full shadow-sm text-center">
                              <div className="text-[9px] font-bold text-slate-500 uppercase">Readiness</div>
                              <h3 className="text-base font-black text-emerald-900 mt-1">{analysis.placementScore}%</h3>
                              <div className="w-full bg-slate-150 rounded-full h-1.5 mt-1.5">
                                <div className="bg-[#1c5644] h-1.5 rounded-full" style={{ width: `${analysis.placementScore}%` }} />
                              </div>
                            </div>

                            {/* Strengths / Weaknesses */}
                            <div className="space-y-2 text-[10px] overflow-y-auto scrollbar-none max-h-full">
                              {analysis.strengths.length > 0 && (
                                <div>
                                  <div className="text-[8px] font-extrabold text-emerald-850 uppercase tracking-wide">Strengths</div>
                                  <div className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{analysis.strengths[0]}</div>
                                </div>
                              )}
                              {analysis.weaknesses.length > 0 && (
                                <div>
                                  <div className="text-[8px] font-extrabold text-amber-900 uppercase tracking-wide">Focus Areas</div>
                                  <div className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{analysis.weaknesses[0]}</div>
                                </div>
                              )}
                            </div>

                            {/* Momentum */}
                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex flex-col justify-center items-center h-full shadow-sm text-center">
                              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Momentum</div>
                              <div className="mt-1 flex items-center justify-center gap-1">
                                {analysis.momentum === 'up' ? (
                                  <>
                                    <div className="rounded-md bg-emerald-100 p-1 text-emerald-800"><ArrowUpRight className="h-3.5 w-3.5" /></div>
                                    <span className="text-[10px] font-black text-emerald-850">UP</span>
                                  </>
                                ) : analysis.momentum === 'down' ? (
                                  <>
                                    <div className="rounded-md bg-rose-100 p-1 text-rose-800"><ArrowDownRight className="h-3.5 w-3.5" /></div>
                                    <span className="text-[10px] font-black text-rose-850">DOWN</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-md bg-slate-100 p-1 text-slate-700"><TrendingUp className="h-3.5 w-3.5" /></div>
                                    <span className="text-[10px] font-black text-slate-750">STABLE</span>
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
              );
            })()}
          </div>
        </div>

        {/* Modal: Edit Personal Profile */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-portal-ink/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-[28px] border border-portal-line bg-white shadow-soft animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-portal-line bg-slate-50 px-6 py-4 shrink-0">
                <h3 className="text-xl font-bold text-portal-ink">Edit Profile Details</h3>
                <button onClick={() => setIsEditingProfile(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleProfileSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleProfileChange} required className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-650 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Roll Number</label>
                      <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleProfileChange} required className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-650 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Primary Mobile</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleProfileChange} required className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-655 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Alternate Phone</label>
                      <input type="text" name="alternate_phone" value={formData.alternate_phone} onChange={handleProfileChange} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-655 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date of Birth</label>
                      <input type="date" name="dob" value={formData.dob} onChange={handleProfileChange} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-655 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Branch</label>
                      <input type="text" name="branch" value={formData.branch} onChange={handleProfileChange} required className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-655 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Section</label>
                      <input type="text" name="section" value={formData.section} onChange={handleProfileChange} required className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-655 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Academic Year</label>
                      <input type="text" name="academic_year" value={formData.academic_year} onChange={handleProfileChange} required className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-655 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">B.Tech Year</label>
                      <select name="btech_year" value={formData.btech_year || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, btech_year: e.target.value }))} required className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-emerald-655 focus:outline-none bg-white font-semibold text-slate-800">
                        <option value="">Select Year</option>
                        <option value="I Year">I Year</option>
                        <option value="II Year">II Year</option>
                        <option value="III Year">III Year</option>
                        <option value="IV Year">IV Year</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profile Photo</label>
                    <div className="mt-1 flex items-center gap-4">
                      {formData.profile_photo && <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-205"><img src={formData.profile_photo} alt="Preview" className="h-full w-full object-cover" /></div>}
                      <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-portal-line p-6 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-[28px]">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"><ArrowLeft className="h-4 w-4" /><span>Back</span></button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition disabled:opacity-75">{saving && <Loader2 className="h-4 w-4 animate-spin" />}<span>Save Changes</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Club Organization */}
        {clubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100">
              <button onClick={() => setClubModalOpen(false)} className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 transition"><X className="h-5 w-5" /></button>
              <h3 className="text-xl font-bold text-slate-900">{editingClubIndex !== null ? 'Edit Club Details' : 'Add Club & Organization'}</h3>
              
              <form onSubmit={handleClubSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Club Name</label>
                  <input type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Robotics Club" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Role / Position</label>
                  <input type="text" value={clubRole} onChange={(e) => setClubRole(e.target.value)} placeholder="Member" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Joined Year</label>
                  <input type="number" value={clubJoined} onChange={(e) => setClubJoined(e.target.value)} placeholder={new Date().getFullYear().toString()} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Club Logo</label>
                  <div className="mt-1 flex items-center gap-3">
                    {clubLogo && <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-200"><img src={clubLogo} alt="Logo" className="h-full w-full object-cover" /></div>}
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) compressImage(file, 200, setClubLogo);
                    }} className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setClubModalOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}<span>Save Club</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Certification */}
        {certModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100">
              <button onClick={() => setCertModalOpen(false)} className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 transition"><X className="h-5 w-5" /></button>
              <h3 className="text-xl font-bold text-slate-950">{editingCertIndex !== null ? 'Edit Certification Details' : 'Add Certification & Achievement'}</h3>
              
              <form onSubmit={handleCertSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Certification Title</label>
                  <input type="text" value={certName} onChange={(e) => setCertName(e.target.value)} placeholder="e.g. AWS Cloud Practitioner" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Verification URL</label>
                  <input type="url" value={certLink} onChange={(e) => setCertLink(e.target.value)} placeholder="https://..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Certificate Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    {certImage && <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-200"><img src={certImage} alt="Certificate" className="h-full w-full object-cover" /></div>}
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) compressImage(file, 600, setCertImage);
                    }} className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setCertModalOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}<span>Save Certificate</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Aspirations */}
        {aspirationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <button onClick={() => setAspirationModalOpen(false)} className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 transition"><X className="h-5 w-5" /></button>
              <h3 className="text-xl font-bold text-slate-900">Edit Goals & Aspirations</h3>
              
              <form onSubmit={handleAspirationsSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Core Interests</label>
                  <textarea value={formInterests} onChange={(e) => setFormInterests(e.target.value)} placeholder="e.g. AI, Web Development" rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">My Biggest Dream</label>
                  <textarea value={formDreams} onChange={(e) => setFormDreams(e.target.value)} placeholder="e.g. Launch a tech startup" rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setAspirationModalOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-2xl bg-[#1c5644] hover:bg-[#154335] px-5 py-2.5 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}<span>Save Goals</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fullscreen Certificate Lightbox */}
        {selectedCertImage && (
          <div onClick={() => setSelectedCertImage(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
            <div onClick={(e) => e.stopPropagation()} className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2 border border-white/10 shadow-2xl flex flex-col items-center">
              <button onClick={() => setSelectedCertImage(null)} className="absolute right-4 top-4 rounded-full p-2 bg-slate-900/80 text-white hover:bg-slate-800 transition"><X className="h-5 w-5" /></button>
              <img src={selectedCertImage} alt="Certificate preview" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        )}

      </PageShell>
    </ProtectedRoute>
  );
}